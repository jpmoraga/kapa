export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { PRICING_KEYS, getPricingContext, getRuleInt } from "@/lib/pricing";
import {
  AssetCode,
  LoanCurrency,
  LoanEventType,
  LoanStatus,
  Prisma,
  TreasuryMovementStatus,
} from "@prisma/client";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function computeInterest(params: {
  principal: Prisma.Decimal;
  apr: Prisma.Decimal;
  startAt: Date;
  endAt: Date;
  minDays: number;
}) {
  const diffMs = Math.max(0, params.endAt.getTime() - params.startAt.getTime());
  const daysElapsed = Math.ceil(diffMs / MS_PER_DAY);
  const chargedDays = Math.max(daysElapsed, params.minDays);
  const dailyRate = params.apr.div(365);
  const interest = params.principal.mul(dailyRate).mul(chargedDays);
  return { daysElapsed, chargedDays, interest };
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "No autenticado", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }
  if (!activeCompanyId) {
    return NextResponse.json(
      { ok: false, error: "Sin empresa activa", code: "NO_ACTIVE_COMPANY" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Usuario no encontrado", code: "USER_NOT_FOUND" },
      { status: 401 }
    );
  }

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });

  const role = String(membership?.role ?? "").toLowerCase();
  const isAdminOrOwner = role === "admin" || role === "owner";

  const { id: loanId } = await context.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        select: {
          id: true,
          companyId: true,
          userId: true,
          status: true,
          currency: true,
          principalClp: true,
          interestApr: true,
          disbursedAt: true,
          createdAt: true,
          paidAt: true,
          interestChargedClp: true,
          chargedDays: true,
        },
      });

      if (!loan || loan.companyId !== activeCompanyId) {
        const err: any = new Error("NOT_FOUND");
        err.code = "LOAN_NOT_FOUND";
        throw err;
      }

      const isBorrower = loan.userId === user.id;
      if (!isBorrower && !isAdminOrOwner) {
        const err: any = new Error("FORBIDDEN");
        err.code = "FORBIDDEN";
        throw err;
      }

      if (loan.currency !== LoanCurrency.CLP) {
        const err: any = new Error("INVALID_CURRENCY");
        err.code = "INVALID_CURRENCY";
        throw err;
      }

      const borrower = await tx.user.findUnique({
        where: { id: loan.userId },
        select: { isSubscriber: true },
      });
      const isSubscriber = Boolean(borrower?.isSubscriber);
      const pricing = await getPricingContext({
        companyId: activeCompanyId,
        userId: loan.userId,
        tx,
      });
      const minDaysKey = isSubscriber
        ? PRICING_KEYS.LOAN_MIN_DAYS_SUBSCRIBER
        : PRICING_KEYS.LOAN_MIN_DAYS_STANDARD;
      const minDaysRule = getRuleInt(pricing.rules, minDaysKey);
      const fallbackMinDays = isSubscriber ? 1 : 7;
      const minDays = minDaysRule && minDaysRule > 0 ? minDaysRule : fallbackMinDays;

      if (loan.status === LoanStatus.CLOSED) {
        const startAt = loan.disbursedAt ?? loan.createdAt;
        const endAt = loan.paidAt ?? new Date();
        if (!loan.disbursedAt) {
          console.warn("LOAN_PAY_MISSING_DISBURSED_AT", { loanId: loan.id });
        }
        const apr = new Prisma.Decimal(loan.interestApr);
        const computed = computeInterest({
          principal: loan.principalClp,
          apr,
          startAt,
          endAt,
          minDays,
        });
        const chargedDays = loan.chargedDays ?? computed.chargedDays;
        const interest = loan.interestChargedClp ?? computed.interest;
        const total = loan.principalClp.plus(interest);
        return {
          kind: "idempotent" as const,
          loanId: loan.id,
          principal: loan.principalClp,
          interest,
          chargedDays,
          minDays,
          minDaysApplied: chargedDays > computed.daysElapsed,
          total,
        };
      }

      if (loan.status !== LoanStatus.DISBURSED) {
        const err: any = new Error("LOAN_NOT_PAYABLE");
        err.code = "LOAN_NOT_PAYABLE";
        err.status = loan.status;
        throw err;
      }

      const now = new Date();
      const startAt = loan.disbursedAt ?? loan.createdAt;
      if (!loan.disbursedAt) {
        console.warn("LOAN_PAY_MISSING_DISBURSED_AT", { loanId: loan.id });
      }

      const apr = new Prisma.Decimal(loan.interestApr);
      const computed = computeInterest({
        principal: loan.principalClp,
        apr,
        startAt,
        endAt: now,
        minDays,
      });
      const interest = computed.interest;
      const total = loan.principalClp.plus(interest);
      const totalPaid = total;

      await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
        update: {},
        create: { companyId: activeCompanyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
        select: { id: true },
      });

      await tx.treasuryAccount.update({
        where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
        data: { balance: { increment: totalPaid } },
        select: { id: true },
      });

      const principalMovement = await tx.treasuryMovement.create({
        data: {
          companyId: activeCompanyId,
          loanId: loan.id,
          assetCode: AssetCode.CLP,
          type: "adjust",
          amount: loan.principalClp,
          note: `Loan principal payment ${loan.id}`,
          createdByUserId: user.id,
          status: TreasuryMovementStatus.APPROVED,
          approvedAt: now,
          approvedByUserId: user.id,
        },
        select: { id: true, amount: true, status: true, type: true },
      });

      const interestMovement = await tx.treasuryMovement.create({
        data: {
          companyId: activeCompanyId,
          loanId: loan.id,
          assetCode: AssetCode.CLP,
          type: "adjust",
          amount: interest,
          note: `Loan interest earned ${loan.id}`,
          createdByUserId: user.id,
          status: TreasuryMovementStatus.APPROVED,
          approvedAt: now,
          approvedByUserId: user.id,
        },
        select: { id: true, amount: true, status: true, type: true },
      });

      const updated = await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: LoanStatus.CLOSED,
          closedAt: now,
          paidAt: now,
          interestChargedClp: interest,
          chargedDays: computed.chargedDays,
        },
        select: { id: true, status: true },
      });

      await tx.loanEvent.create({
        data: {
          loanId: loan.id,
          type: LoanEventType.PRINCIPAL_PAID,
          createdByUserId: user.id,
          payload: {
            principalClp: loan.principalClp.toString(),
            paidAt: now.toISOString(),
            movementId: principalMovement.id,
          },
        },
      });

      await tx.loanEvent.create({
        data: {
          loanId: loan.id,
          type: LoanEventType.INTEREST_PAID,
          createdByUserId: user.id,
          payload: {
            interestClp: interest.toString(),
            chargedDays: computed.chargedDays,
            minDays,
            interestApr: apr.toString(),
            paidAt: now.toISOString(),
            movementId: interestMovement.id,
          },
        },
      });

      return {
        kind: "created" as const,
        loanId: updated.id,
        principal: loan.principalClp,
        interest,
        chargedDays: computed.chargedDays,
        minDays,
        minDaysApplied: computed.chargedDays > computed.daysElapsed,
        total,
      };
    });

    return NextResponse.json({
      ok: true,
      kind: result.kind,
      loanId: result.loanId,
      principal: result.principal.toString(),
      interest: result.interest.toString(),
      chargedDays: result.chargedDays,
      minDaysApplied: result.minDaysApplied,
      minDays: result.minDays,
      total: result.total.toString(),
    });
  } catch (e: any) {
    if (e?.code === "LOAN_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: "Loan no existe", code: "LOAN_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (e?.code === "FORBIDDEN") {
      return NextResponse.json(
        { ok: false, error: "No autorizado", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (e?.code === "INVALID_CURRENCY") {
      return NextResponse.json(
        { ok: false, error: "Moneda inválida", code: "INVALID_CURRENCY" },
        { status: 400 }
      );
    }

    if (e?.code === "LOAN_NOT_PAYABLE") {
      const status = String(e?.status ?? "").toUpperCase();
      return NextResponse.json(
        {
          ok: false,
          error: status
            ? `Loan no es pagable (status=${status})`
            : "Loan no es pagable",
          code: "LOAN_NOT_PAYABLE",
        },
        { status: 409 }
      );
    }

    console.error("LOAN_PAY_ERROR", e);
    return NextResponse.json(
      { ok: false, error: "Error interno", code: "LOAN_PAY_ERROR" },
      { status: 500 }
    );
  }
}
