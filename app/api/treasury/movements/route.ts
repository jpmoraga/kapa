// web/app/api/treasury/movements/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";

import path from "path";
import fs from "fs/promises";

import { budaCreateMarketOrder } from "@/lib/buda";
import { syncSystemWalletFromBuda } from "@/lib/syncSystemWallet";
import { requireCanOperate } from "@/lib/guards/requireCanOperate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MovementType = "deposit" | "withdraw" | "adjust";

function normalizeAssetCode(input: any): AssetCode {
  const v = String(input ?? "").trim().toUpperCase();
  if (v === "BTC") return AssetCode.BTC;
  if (v === "CLP") return AssetCode.CLP;
  if (v === "USD") return AssetCode.USD;
  return AssetCode.BTC;
}

function isMultipart(req: Request) {
  const ct = req.headers.get("content-type") || "";
  return ct.toLowerCase().includes("multipart/form-data");
}

function safeExtFromMime(mime: string) {
  const m = String(mime || "").toLowerCase();
  if (m === "application/pdf") return "pdf";
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  return null;
}

async function saveReceiptLocal(opts: { companyId: string; movementId: string; file: File }) {
  const { companyId, movementId, file } = opts;

  const ext = safeExtFromMime(file.type);
  if (!ext) throw new Error("BAD_FILE_TYPE");

  const MAX_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_BYTES) throw new Error("FILE_TOO_LARGE");

  const publicDir = path.join(process.cwd(), "public");
  const dir = path.join(publicDir, "uploads", "treasury", companyId);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${movementId}.${ext}`;
  const abs = path.join(dir, filename);

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(abs, buf);

  return `/uploads/treasury/${companyId}/${filename}`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, personProfile: { select: { userId: true } } },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const onboarding = await prisma.userOnboarding.findUnique({
    where: { userId: user.id },
    select: { termsAcceptedAt: true },
  });

  const canOperate = Boolean(user.personProfile?.userId) && Boolean(onboarding?.termsAcceptedAt);
  if (!canOperate) {
    return NextResponse.json(
      {
        error: "Completa tu onboarding para operar.",
        onboarding: {
          hasProfile: Boolean(user.personProfile?.userId),
          termsAccepted: Boolean(onboarding?.termsAcceptedAt),
          canOperate,
        },
      },
      { status: 403 }
    );
  }

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });
  if (!membership) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  // ====== Leer body (JSON o multipart) ======
  let type: MovementType = "deposit";
  let note: string | null = null;
  let amountStr = "";
  let assetCode: AssetCode = AssetCode.BTC;
  let receiptFile: File | null = null;

  if (isMultipart(req)) {
    const fd = await req.formData();
    type = String(fd.get("type") ?? "").trim() as MovementType;
    note = String(fd.get("note") ?? "").trim() || null;
    amountStr = String(fd.get("amount") ?? "").trim();
    assetCode = normalizeAssetCode(fd.get("assetCode"));
    const f = fd.get("receipt");
    receiptFile = f instanceof File ? f : null;
  } else {
    const body = await req.json().catch(() => ({}));
    type = String(body.type ?? "").trim() as MovementType;
    note = String(body.note ?? "").trim() || null;
    amountStr = String(body.amount ?? "").trim();
    assetCode = normalizeAssetCode(body.assetCode);
  }

  if (!["deposit", "withdraw", "adjust"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (!amountStr) {
    return NextResponse.json({ error: "Monto requerido" }, { status: 400 });
  }

  if (type === "deposit" && assetCode === AssetCode.CLP) {
    if (!receiptFile) {
      return NextResponse.json({ error: "Comprobante requerido (PDF/JPG/PNG)." }, { status: 400 });
    }
  }

  let amount: Prisma.Decimal;
  try {
    amount = new Prisma.Decimal(amountStr);
  } catch {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  if (type === "deposit" || type === "withdraw") {
    if (amount.lte(0)) return NextResponse.json({ error: "Monto debe ser > 0" }, { status: 400 });
  } else {
    if (amount.eq(0)) return NextResponse.json({ error: "Monto no puede ser 0" }, { status: 400 });
  }

  if (type === "adjust") {
    const role = String(membership.role ?? "").toLowerCase();
    if (role !== "admin" && role !== "owner") {
      return NextResponse.json({ error: "Solo admin/owner puede crear ajustes." }, { status: 403 });
    }
  }

  // ====== Crear movimiento PENDING y (si aplica) guardar attachment ======
  try {
    const out = await prisma.$transaction(async (tx) => {
      // 1) Crear movimiento
      const movement = await tx.treasuryMovement.create({
        data: {
          companyId: activeCompanyId,
          assetCode,
          type,
          amount,
          note,
          createdByUserId: user.id,
          status: TreasuryMovementStatus.PENDING,
        },
        select: { id: true, status: true },
      });
    
      // 2) Guardar comprobante si es CLP deposit
      let attachmentUrl: string | null = null;
    
      if (type === "deposit" && assetCode === AssetCode.CLP && receiptFile) {
        attachmentUrl = await saveReceiptLocal({
          companyId: activeCompanyId,
          movementId: movement.id,
          file: receiptFile,
        });
    
        await tx.treasuryMovement.update({
          where: { id: movement.id },
          data: { attachmentUrl },
          select: { id: true },
        });
    
        // AUTO-APPROVE CLP
        const accClp = await tx.treasuryAccount.upsert({
          where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
          update: {},
          create: { companyId: activeCompanyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
          select: { balance: true },
        });
    
        await tx.treasuryAccount.update({
          where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
          data: { balance: new Prisma.Decimal(accClp.balance).plus(amount) },
        });
    
        await tx.treasuryMovement.update({
          where: { id: movement.id },
          data: {
            status: TreasuryMovementStatus.APPROVED,
            approvedByUserId: user.id,
            approvedAt: new Date(),
            executedPrice: new Prisma.Decimal(1),
            executedQuoteCode: AssetCode.CLP,
            executedSource: "bank-receipt",
            executedAt: new Date(),
          },
          select: { id: true },
        });
    
        return { movementId: movement.id, status: TreasuryMovementStatus.APPROVED, attachmentUrl, autoExecuted: true };
      }
    
      // 3) Si es BTC/USD y es deposit/withdraw => EJECUTA AUTOMATICO
      const isTradeAsset = assetCode === AssetCode.BTC || assetCode === AssetCode.USD;
      const isBuy = type === "deposit";
      const isSell = type === "withdraw";
    
      if (isTradeAsset && (isBuy || isSell)) {
        // 3.1 lock
        await tx.treasuryMovement.update({
          where: { id: movement.id },
          data: { status: TreasuryMovementStatus.PROCESSING },
          select: { id: true },
        });
    
        // 3.2 sync system wallet desde Buda (remanente)
        await syncSystemWalletFromBuda(tx);
    
        // ✅ por ahora SOLO dejamos el movimiento en PROCESSING para que el approve endpoint haga el resto
        // (esto te deja el flujo funcionando sin reescribir toda tu lógica hoy)
        return { movementId: movement.id, status: TreasuryMovementStatus.PROCESSING, attachmentUrl, autoExecuted: false };
      }
    
      // 4) default: queda PENDING
      return { movementId: movement.id, status: movement.status, attachmentUrl, autoExecuted: false };
    });

    return NextResponse.json({ ok: true, ...out });
  } catch (e: any) {
    console.error("MOVEMENT_CREATE_ERROR", e);

    if (e?.message === "BAD_FILE_TYPE") {
      return NextResponse.json({ error: "Formato inválido. Solo PDF/JPG/PNG." }, { status: 400 });
    }
    if (e?.message === "FILE_TOO_LARGE") {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 10MB)." }, { status: 400 });
    }

    return NextResponse.json({ error: e?.message ?? "Error creando movimiento" }, { status: 500 });
  }
}