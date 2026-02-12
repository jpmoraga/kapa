export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getLoanApr } from "@/lib/loans/rates";
import { fetchBtcClpPrice, safeDecimal } from "@/lib/loans/pricing";
import {
  AssetCode,
  LoanCurrency,
  LoanEventType,
  LoanRepaymentType,
  LoanStatus,
  Prisma,
} from "@prisma/client";

function parseNumber(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  const parsed = Number(String(input ?? "").trim().replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDecimal(input: unknown): Prisma.Decimal | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  try {
    const dec = new Prisma.Decimal(raw);
    if (!dec.isFinite() || dec.lte(0)) return null;
    return dec;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) {
    return NextResponse.json({ ok: false, error: "Sin empresa activa" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isSubscriber: true },
  });
  if (!user) return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const principalClp = parseDecimal(body?.principalClp);
  if (!principalClp) {
    return NextResponse.json({ ok: false, error: "principalClp inválido" }, { status: 400 });
  }

  const termMonthsRaw = parseNumber(body?.termMonths);
  const termMonths = termMonthsRaw ? Math.round(termMonthsRaw) : 3;
  if (!Number.isFinite(termMonths) || termMonths < 1 || termMonths > 36) {
    return NextResponse.json({ ok: false, error: "termMonths inválido" }, { status: 400 });
  }

  const repaymentTypeRaw = String(body?.repaymentType ?? "BULLET").toUpperCase();
  const repaymentType =
    repaymentTypeRaw === "BULLET" ? LoanRepaymentType.BULLET : undefined;
  if (!repaymentType) {
    return NextResponse.json({ ok: false, error: "repaymentType inválido" }, { status: 400 });
  }

  const ltvTarget = parseNumber(body?.ltvTarget);
  const ltvMax = parseNumber(body?.ltvMax);
  const liquidationLtv = parseNumber(body?.liquidationLtv);

  if (ltvTarget === null || ltvMax === null || liquidationLtv === null) {
    return NextResponse.json({ ok: false, error: "LTV inválido" }, { status: 400 });
  }

  if (
    ltvTarget <= 0 ||
    ltvMax <= 0 ||
    liquidationLtv <= 0 ||
    ltvTarget >= 1 ||
    ltvMax >= 1 ||
    liquidationLtv >= 1 ||
    ltvTarget > ltvMax ||
    ltvMax > liquidationLtv
  ) {
    return NextResponse.json({ ok: false, error: "LTV fuera de rango" }, { status: 400 });
  }

  const priceRes = await fetchBtcClpPrice(new URL(req.url).origin);
  if (!priceRes.ok || !priceRes.price) {
    return NextResponse.json({ ok: false, error: "Sin precio BTC/CLP" }, { status: 400 });
  }

  const priceBtcClp = safeDecimal(priceRes.price);
  if (priceBtcClp.lte(0)) {
    return NextResponse.json({ ok: false, error: "Sin precio BTC/CLP" }, { status: 400 });
  }

  const ltvTargetDec = new Prisma.Decimal(String(ltvTarget));
  const collateralBtc = principalClp.div(priceBtcClp).div(ltvTargetDec);
  const collateralSatsDec = collateralBtc.mul("100000000");
  const collateralSats = BigInt(collateralSatsDec.ceil().toFixed(0));

  const account = await prisma.treasuryAccount.findUnique({
    where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.BTC } },
    select: { balance: true },
  });

  const availableBtc = account?.balance ? safeDecimal(account.balance) : safeDecimal("0");
  if (availableBtc.lt(collateralBtc)) {
    return NextResponse.json({ ok: false, error: "BTC insuficiente para colateral" }, { status: 400 });
  }

  const isSubscriber = Boolean(user.isSubscriber);
  const apr = getLoanApr(isSubscriber);
  const aprDec = safeDecimal(apr);

  console.info("CREDITO_CREATE_LOAN", {
    userId: user.id,
    activeCompanyId,
    principalClp: principalClp.toString(),
    collateralSats: collateralSats.toString(),
    isSubscriber,
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          companyId: activeCompanyId,
          userId: user.id,
          currency: LoanCurrency.CLP,
          principalClp,
          interestApr: aprDec,
          termMonths,
          repaymentType,
          ltvTarget: new Prisma.Decimal(String(ltvTarget)),
          ltvMax: new Prisma.Decimal(String(ltvMax)),
          liquidationLtv: new Prisma.Decimal(String(liquidationLtv)),
          status: LoanStatus.CREATED,
        },
        select: {
          id: true,
          status: true,
          principalClp: true,
          currency: true,
          interestApr: true,
          termMonths: true,
          repaymentType: true,
          ltvTarget: true,
          ltvMax: true,
          liquidationLtv: true,
          createdAt: true,
        },
      });

      const collateral = await tx.loanCollateral.create({
        data: {
          loanId: loan.id,
          assetCode: AssetCode.BTC,
          amountSats: collateralSats,
        },
        select: { amountSats: true },
      });

      await tx.loanEvent.create({
        data: {
          loanId: loan.id,
          type: LoanEventType.CREATED,
          payload: {
            principalClp: principalClp.toString(),
            priceBtcClp: priceBtcClp.toString(),
            ltvTarget,
            ltvMax,
            liquidationLtv,
            collateralSats: collateralSats.toString(),
            termMonths,
            repaymentType,
            isSubscriber,
            interestApr: apr,
          },
          createdByUserId: user.id,
        },
      });

      return { loan, collateral };
    });

    return NextResponse.json({
      ok: true,
      loan: {
        id: result.loan.id,
        status: result.loan.status,
        principalClp: result.loan.principalClp.toString(),
        currency: result.loan.currency,
        interestApr: result.loan.interestApr.toString(),
        termMonths: result.loan.termMonths,
        repaymentType: result.loan.repaymentType,
        ltvTarget: result.loan.ltvTarget.toString(),
        ltvMax: result.loan.ltvMax.toString(),
        liquidationLtv: result.loan.liquidationLtv.toString(),
        createdAt: result.loan.createdAt.toISOString(),
      },
      collateral: { amountSats: result.collateral.amountSats.toString() },
      meta: { priceBtcClp: priceBtcClp.toString() },
    });
  } catch (error) {
    console.error("CREDITO_CREATE_LOAN_ERROR", error);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) {
    return NextResponse.json({ ok: false, error: "Sin empresa activa" }, { status: 400 });
  }

  const loans = await prisma.loan.findMany({
    where: { companyId: activeCompanyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      currency: true,
      principalClp: true,
      interestApr: true,
      termMonths: true,
      repaymentType: true,
      ltvTarget: true,
      ltvMax: true,
      liquidationLtv: true,
      createdAt: true,
      approvedAt: true,
      disbursedAt: true,
      closedAt: true,
      disbursementMovementId: true,
      collateral: {
        select: { amountSats: true },
      },
    },
  });

  const activeStatuses = new Set<LoanStatus>([
    LoanStatus.CREATED,
    LoanStatus.APPROVED,
    LoanStatus.DISBURSED,
  ]);

  let totalActiveLoans = 0;
  let totalCollateralSats = BigInt(0);

  const mappedLoans = loans.map((loan) => {
    const collateralSatsTotal = loan.collateral.reduce(
      (sum, c) => sum + BigInt(c.amountSats),
      BigInt(0)
    );

    if (activeStatuses.has(loan.status)) {
      totalActiveLoans += 1;
      totalCollateralSats += collateralSatsTotal;
    }

    return {
      id: loan.id,
      status: loan.status,
      currency: loan.currency,
      principalClp: loan.principalClp.toString(),
      interestApr: loan.interestApr.toString(),
      termMonths: loan.termMonths,
      repaymentType: loan.repaymentType,
      ltvTarget: loan.ltvTarget.toString(),
      ltvMax: loan.ltvMax.toString(),
      liquidationLtv: loan.liquidationLtv.toString(),
      createdAt: loan.createdAt.toISOString(),
      approvedAt: loan.approvedAt?.toISOString() ?? null,
      disbursedAt: loan.disbursedAt?.toISOString() ?? null,
      closedAt: loan.closedAt?.toISOString() ?? null,
      disbursementMovementId: loan.disbursementMovementId ?? null,
      collateralSatsTotal: collateralSatsTotal.toString(),
    };
  });

  return NextResponse.json({
    ok: true,
    summary: {
      totalActiveLoans,
      totalCollateralSats: totalCollateralSats.toString(),
    },
    loans: mappedLoans,
  });
}
