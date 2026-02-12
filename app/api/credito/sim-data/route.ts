// app/api/credito/sim-data/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getLoanApr, aprToMonthlyPct } from "@/lib/loans/rates";
import { AssetCode, Prisma } from "@prisma/client";

function safeDecimal(x: any, fallback = "0") {
  try {
    return new Prisma.Decimal(String(x ?? fallback));
  } catch {
    return new Prisma.Decimal(fallback);
  }
}

async function fetchBtcClpPrice(origin: string) {
  const res = await fetch(`${origin}/api/prices/current?pair=BTC_CLP`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, price: null, error: data?.error ?? "price_error" };
  const priceStr = String(data?.price ?? "");
  if (!priceStr) return { ok: false as const, price: null, error: "missing_price" };
  return { ok: true as const, price: priceStr, error: null };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ ok: false, error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isSubscriber: true },
  });
  if (!user) return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 401 });

  const account = await prisma.treasuryAccount.findUnique({
    where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.BTC } },
    select: { balance: true },
  });

  const btcAvailable = account?.balance?.toString?.() ?? null;

  const url = new URL(req.url);
  const price = await fetchBtcClpPrice(url.origin);
  const isSubscriber = Boolean(user.isSubscriber);
  const apr = getLoanApr(isSubscriber);
  const monthlyRatePct = aprToMonthlyPct(apr);
  const maxLtvPct = isSubscriber ? 60 : 50;
  const liquidationBands = { withdraw: 40, risk: 65, marginCall: 70, liquidation: 80 };
  const hasPrice = price.ok;
  const hasBtc = btcAvailable !== null && Number(btcAvailable) > 0;

  console.info("CREDITO_SIM_DATA", {
    userId: user.id,
    activeCompanyId,
    isSubscriber,
    hasPrice,
    hasBtc,
  });

  if (!price.ok) {
    return NextResponse.json({
      ok: true,
      isSubscriber,
      apr,
      monthlyRatePct,
      maxLtvPct,
      liquidationBands,
      btcAvailable,
      basePriceClp: null,
      priceError: price.error,
    });
  }

  const priceDec = safeDecimal(price.price);

  return NextResponse.json({
    ok: true,
    isSubscriber,
    apr,
    monthlyRatePct,
    maxLtvPct,
    liquidationBands,
    btcAvailable,
    basePriceClp: priceDec.toString(),
  });
}
