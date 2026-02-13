// app/api/credito/sim-data/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getLoanApr, aprToMonthlyPct } from "@/lib/loans/rates";
import { fetchBtcClpPrice, safeDecimal } from "@/lib/loans/pricing";
import { AssetCode } from "@prisma/client";

export async function GET(req: Request) {
  let activeCompanyId: string | undefined;

  try {
    const session = await getServerSession(authOptions);
    activeCompanyId = (session as any)?.activeCompanyId as string | undefined;
    const path = new URL(req.url).pathname;

    if (!session?.user?.email) {
      console.warn("SIM_DATA_ERROR", {
        activeCompanyId,
        status: 401,
        code: "NO_AUTH",
        path,
      });
      return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
    }
    if (!activeCompanyId) {
      console.warn("SIM_DATA_ERROR", {
        activeCompanyId,
        status: 400,
        code: "NO_ACTIVE_COMPANY",
        path,
      });
      return NextResponse.json({ ok: false, error: "Sin empresa activa" }, { status: 400 });
    }

    const email = session.user.email.toLowerCase().trim();
    let user: { id: string; isSubscriber: boolean } | null = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, isSubscriber: true },
      });
    } catch (error: any) {
      console.error("SIM_DATA_ERROR", {
        activeCompanyId,
        status: 500,
        code: "DB_USER_LOOKUP_FAILED",
        path,
        message: error?.message ?? String(error),
      });
      return NextResponse.json(
        { ok: false, error: "Error interno", code: "DB_USER_LOOKUP_FAILED" },
        { status: 500 }
      );
    }
    if (!user) {
      console.error("SIM_DATA_ERROR", {
        activeCompanyId,
        status: 401,
        code: "USER_NOT_FOUND",
        path,
      });
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 401 });
    }

    let account: { balance: unknown } | null = null;
    try {
      account = await prisma.treasuryAccount.findUnique({
        where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.BTC } },
        select: { balance: true },
      });
    } catch (error: any) {
      console.error("SIM_DATA_ERROR", {
        activeCompanyId,
        status: 500,
        code: "DB_TREASURY_ACCOUNT_FAILED",
        path,
        message: error?.message ?? String(error),
      });
      return NextResponse.json(
        { ok: false, error: "Error interno", code: "DB_TREASURY_ACCOUNT_FAILED" },
        { status: 500 }
      );
    }

    const btcAvailable = account?.balance?.toString?.() ?? null;

    const url = new URL(req.url);
    let price: { ok: boolean; price: string | null; error: string | null };
    try {
      price = await fetchBtcClpPrice(url.origin);
    } catch (error: any) {
      console.error("SIM_DATA_ERROR", {
        activeCompanyId,
        status: 502,
        code: "PRICING_FETCH_FAILED",
        path,
        message: error?.message ?? String(error),
      });
      const isSubscriber = Boolean(user.isSubscriber);
      const apr = getLoanApr(isSubscriber);
      const monthlyRatePct = aprToMonthlyPct(apr);
      const maxLtvPct = isSubscriber ? 60 : 50;
      const liquidationBands = { withdraw: 40, risk: 65, marginCall: 70, liquidation: 80 };
      return NextResponse.json({
        ok: true,
        isSubscriber,
        apr,
        monthlyRatePct,
        maxLtvPct,
        liquidationBands,
        btcAvailable,
        basePriceClp: null,
        priceError: "PRICING_FETCH_FAILED",
      });
    }
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
  } catch (error: any) {
    console.error("SIM_DATA_ERROR", {
      activeCompanyId,
      status: 500,
      code: "UNHANDLED",
      message: error?.message ?? String(error),
    });
    return NextResponse.json(
      { ok: false, error: "Error interno", code: "UNHANDLED" },
      { status: 500 }
    );
  }
}
