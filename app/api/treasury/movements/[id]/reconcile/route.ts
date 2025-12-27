// web/app/api/treasury/movements/[id]/reconcile/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";
import { requireCanOperate } from "@/lib/guards/requireCanOperate";
import { budaGetOrder } from "@/lib/buda";

// ---- helpers robustos (Buda a veces devuelve arrays tipo ["0.001","BTC"]) ----
function toNumberMaybe(x: any): number | null {
  if (x === null || x === undefined) return null;
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  if (Array.isArray(x) && x.length > 0) return toNumberMaybe(x[0]);
  if (typeof x === "object") {
    // por si viene { amount: "0.1", ... }
    if ("amount" in x) return toNumberMaybe((x as any).amount);
    if ("value" in x) return toNumberMaybe((x as any).value);
  }
  return null;
}

function extractOrderIdFromNote(note: string | null | undefined) {
  const s = String(note ?? "");
  const m = s.match(/budaOrderId=([A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const can = await requireCanOperate(user.id);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });

  // admin/owner
  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });
  const role = String(membership?.role ?? "").toLowerCase();
  const isAdminOrOwner = role === "admin" || role === "owner";
  if (!isAdminOrOwner) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id: movementId } = await params;

  try {
    const out = await prisma.$transaction(async (tx) => {
      const m = await tx.treasuryMovement.findFirst({
        where: { id: movementId, companyId: activeCompanyId },
        select: {
          id: true,
          status: true,
          type: true,
          assetCode: true,
          amount: true,
          note: true,
          executedPrice: true,
          executedQuoteCode: true,
          executedSource: true,
          executedAt: true,
        },
      });

      if (!m) throw new Error("NOT_FOUND");
      if (m.status === TreasuryMovementStatus.APPROVED) {
        return { ok: true, already: true };
      }
      if (m.status !== TreasuryMovementStatus.PROCESSING) throw new Error("NOT_PROCESSING");

      // reconcile solo aplica a trades en Buda (BTC y USD/USDT)
      if (m.assetCode !== AssetCode.BTC && m.assetCode !== AssetCode.USD) {
        throw new Error("NOT_TRADE_ASSET");
      }

      const orderId = extractOrderIdFromNote(m.note);
      if (!orderId) throw new Error("MISSING_ORDER_ID");

      const payload = await budaGetOrder(orderId);
      const order = payload?.order ?? payload;

      // ✅ Sin state: usamos montos realmente transados
      const tradedBase = toNumberMaybe(order?.traded_amount);       // BTC o USDT (base)
      const totalExchanged = toNumberMaybe(order?.total_exchanged); // CLP (quote)

      // “Aún no se ejecuta” (puede estar abierta o parcial 0)
      if (!tradedBase || !totalExchanged || tradedBase <= 0 || totalExchanged <= 0) {
        return { ok: true, done: false, orderId, tradedBase, totalExchanged };
      }

      const tradedBaseDec = new Prisma.Decimal(tradedBase);
      const clpDec = new Prisma.Decimal(totalExchanged);

      // precio ejecutado (CLP por BTC/USDT)
      const executedPrice = clpDec.div(tradedBaseDec);

      // upsert cuentas
      const accAsset = await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: m.assetCode } },
        update: {},
        create: { companyId: activeCompanyId, assetCode: m.assetCode, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      });

      const accClp = await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
        update: {},
        create: { companyId: activeCompanyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      });

      const currentAsset = new Prisma.Decimal(accAsset.balance);
      const currentClp = new Prisma.Decimal(accClp.balance);

      // ✅ reglas contables según tipo
      const isBuy = m.type === "deposit";
      const isSell = m.type === "withdraw";
      if (!isBuy && !isSell) throw new Error("BAD_TYPE");

      // chequeos mínimos (por seguridad)
      if (isBuy && currentClp.lt(clpDec)) throw new Error("INSUFFICIENT_CLP");
      if (isSell && currentAsset.lt(tradedBaseDec)) throw new Error("INSUFFICIENT_FUNDS");

      // aplicar balances reales usando montos ejecutados
      if (isBuy) {
        await tx.treasuryAccount.update({
          where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
          data: { balance: currentClp.minus(clpDec) },
        });
        await tx.treasuryAccount.update({
          where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: m.assetCode } },
          data: { balance: currentAsset.plus(tradedBaseDec) },
        });
      } else {
        await tx.treasuryAccount.update({
          where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: m.assetCode } },
          data: { balance: currentAsset.minus(tradedBaseDec) },
        });
        await tx.treasuryAccount.update({
          where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
          data: { balance: currentClp.plus(clpDec) },
        });
      }

      // marcar movimiento aprobado + precio congelado real
      const updated = await tx.treasuryMovement.update({
        where: { id: m.id },
        data: {
          status: TreasuryMovementStatus.APPROVED,
          executedPrice,
          executedQuoteCode: AssetCode.CLP,
          executedSource: m.assetCode === AssetCode.BTC ? "buda-btc" : "buda-usdt",
          executedAt: new Date(),
        },
        select: { id: true, status: true },
      });

      return { ok: true, done: true, updated, orderId, tradedBase, totalExchanged };
    });

    return NextResponse.json(out);
  } catch (e: any) {
    console.error("RECONCILE_ERROR", e);

    if (e?.message === "NOT_FOUND") return NextResponse.json({ error: "Movimiento no existe" }, { status: 404 });
    if (e?.message === "NOT_PROCESSING")
      return NextResponse.json({ error: "Solo se reconcilia cuando status=PROCESSING" }, { status: 400 });
    if (e?.message === "NOT_TRADE_ASSET")
      return NextResponse.json({ error: "Este movimiento no requiere reconcile" }, { status: 400 });
    if (e?.message === "MISSING_ORDER_ID")
      return NextResponse.json({ error: "No encuentro budaOrderId en note" }, { status: 400 });
    if (e?.message === "INSUFFICIENT_CLP")
      return NextResponse.json({ error: "Fondos insuficientes en CLP (reconcile)" }, { status: 400 });
    if (e?.message === "INSUFFICIENT_FUNDS")
      return NextResponse.json({ error: "Fondos insuficientes en el asset (reconcile)" }, { status: 400 });
    if (e?.message === "MISSING_BUDA_KEYS")
      return NextResponse.json({ error: "Faltan BUDA_API_KEY / BUDA_API_SECRET" }, { status: 400 });

    return NextResponse.json({ error: "Error reconcile" }, { status: 500 });
  }
}