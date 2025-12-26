// web/app/api/prices/manual/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { AssetCode, Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Pair = "BTC_CLP" | "USDT_CLP";

function normalizePair(input: any): Pair | null {
  const v = String(input ?? "").trim().toUpperCase();
  if (v === "BTC_CLP") return "BTC_CLP";
  if (v === "USDT_CLP") return "USDT_CLP";
  return null;
}

function pairMeta(pair: Pair) {
  if (pair === "BTC_CLP") {
    return { assetCode: AssetCode.BTC, quoteCode: AssetCode.CLP } as const;
  }
  // USDT_CLP -> USD/CLP en nuestro schema
  return { assetCode: AssetCode.USD, quoteCode: AssetCode.CLP } as const;
}

function parseDecimal(input: any): string | null {
  const s = String(input ?? "").trim().replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return s;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });

  const role = String(membership?.role ?? "").toLowerCase();
  const isAdminOrOwner = role === "admin" || role === "owner";
  if (!isAdminOrOwner) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const pair = normalizePair(body?.pair);
  const priceStr = parseDecimal(body?.price);
  const source = String(body?.source ?? "manual").trim() || "manual";

  if (!pair) return NextResponse.json({ error: "pair inválido (BTC_CLP | USDT_CLP)" }, { status: 400 });
  if (!priceStr) return NextResponse.json({ error: "price inválido (> 0)" }, { status: 400 });

  const { assetCode, quoteCode } = pairMeta(pair);

  const created = await prisma.priceSnapshot.create({
    data: {
      assetCode,
      quoteCode,
      price: new Prisma.Decimal(priceStr),
      source,
    },
    select: { assetCode: true, quoteCode: true, price: true, source: true, createdAt: true },
  });

  return NextResponse.json({
    ok: true,
    pair,
    assetCode: created.assetCode,
    quoteCode: created.quoteCode,
    price: created.price.toString(),
    source: created.source,
    createdAt: created.createdAt.toISOString(),
  });
}