// web/app/api/treasury/summary/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { AssetCode, Prisma } from "@prisma/client";

const ASSETS: AssetCode[] = [AssetCode.BTC, AssetCode.CLP, AssetCode.USD];

function normalizeAsset(input: string | null): AssetCode | null {
  const v = String(input ?? "").trim().toUpperCase();
  if (v === "BTC") return AssetCode.BTC;
  if (v === "CLP") return AssetCode.CLP;
  if (v === "USD") return AssetCode.USD;
  return null;
}

function safeDecimal(x: any, fallback = "0") {
  try {
    return new Prisma.Decimal(String(x ?? fallback));
  } catch {
    return new Prisma.Decimal(fallback);
  }
}

async function getPrice(origin: string, pair: "BTC_CLP" | "USDT_CLP") {
  const res = await fetch(`${origin}/api/prices/current?pair=${pair}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, error: data?.error ?? "Price error", data: null };

  const priceStr = String(data?.price ?? "");
  if (!priceStr) return { ok: false as const, error: "Missing price", data: null };

  return { ok: true as const, error: null, data };
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });



    // =====================================================
  // ✅ ONBOARDING: estado del usuario (orden correcto)
  // =====================================================
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      personProfile: { select: { userId: true } },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 401 }
    );
  }

  const onboarding = await prisma.userOnboarding.findUnique({
    where: { userId: user.id },
    select: { termsAcceptedAt: true },
  });

  const onboardingStatus = {
    hasProfile: Boolean(user.personProfile?.userId),
    termsAccepted: Boolean(onboarding?.termsAcceptedAt),
    canOperate: Boolean(user.personProfile?.userId) && Boolean(onboarding?.termsAcceptedAt),
  };

  // =====================================================
  // BALANCES
  // =====================================================
  const url = new URL(req.url);
  const origin = url.origin;
  const requestedAsset = normalizeAsset(url.searchParams.get("asset"));

  const accounts = await prisma.$transaction(async (tx) => {
    await Promise.all(
      ASSETS.map((assetCode) =>
        tx.treasuryAccount.upsert({
          where: { companyId_assetCode: { companyId: activeCompanyId, assetCode } },
          update: {},
          create: {
            companyId: activeCompanyId,
            assetCode,
            balance: new Prisma.Decimal(0),
          },
          select: { id: true },
        })
      )
    );

    if (requestedAsset) {
      return tx.treasuryAccount.findMany({
        where: { companyId: activeCompanyId, assetCode: requestedAsset },
        select: { assetCode: true, balance: true },
      });
    }

    return tx.treasuryAccount.findMany({
      where: { companyId: activeCompanyId },
      select: { assetCode: true, balance: true },
    });
  });

  const balances: Record<AssetCode, string> = {
    BTC: "0",
    CLP: "0",
    USD: "0",
  };

  for (const a of accounts) {
    balances[a.assetCode] = a.balance?.toString?.() ?? "0";
  }

  // =====================================================
  // PRECIOS
  // =====================================================
  const [pBtcClp, pUsdtClp] = await Promise.all([
    getPrice(origin, "BTC_CLP"),
    getPrice(origin, "USDT_CLP"),
  ]);

  const btcClp = pBtcClp.ok ? safeDecimal(pBtcClp.data.price) : null;
  const usdClp = pUsdtClp.ok ? safeDecimal(pUsdtClp.data.price) : null;

  // =====================================================
  // VALORIZACIÓN
  // =====================================================
  const btcBalDec = safeDecimal(balances.BTC);
  const clpBalDec = safeDecimal(balances.CLP);
  const usdBalDec = safeDecimal(balances.USD);

  const btcValueClp = btcClp ? btcBalDec.mul(btcClp) : null;
  const usdValueClp = usdClp ? usdBalDec.mul(usdClp) : null;

  const totalClp =
    btcValueClp && usdValueClp
      ? clpBalDec.add(btcValueClp).add(usdValueClp)
      : null;

  // =====================================================
  // MOVIMIENTOS
  // =====================================================
  const movements = await prisma.treasuryMovement.findMany({
    where: { companyId: activeCompanyId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      assetCode: true,
      amount: true,
      status: true,
      createdAt: true,
      executedPrice: true,
      executedQuoteCode: true,
      executedSource: true,
      executedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    activeCompanyId,

    // ✅ ESTADO DE ONBOARDING
    onboarding: onboardingStatus,

    balances,

    prices: {
      BTC_CLP: btcClp ? btcClp.toString() : null,
      USD_CLP: usdClp ? usdClp.toString() : null,
    },

    valuations: {
      BTC_in_CLP: btcValueClp ? btcValueClp.toString() : null,
      CLP_in_CLP: clpBalDec.toString(),
      USD_in_CLP: usdValueClp ? usdValueClp.toString() : null,
      total_in_CLP: totalClp ? totalClp.toString() : null,
    },

    movements,
  });
}