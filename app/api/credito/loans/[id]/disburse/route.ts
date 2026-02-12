export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import {
  AssetCode,
  LoanCurrency,
  LoanEventType,
  LoanStatus,
  Prisma,
  TreasuryMovementStatus,
} from "@prisma/client";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) {
    return NextResponse.json({ ok: false, error: "Sin empresa activa" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 401 });

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });

  const role = String(membership?.role ?? "").toLowerCase();
  const isAdminOrOwner = role === "admin" || role === "owner";
  if (!isAdminOrOwner) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });

  const { id: loanId } = await context.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findFirst({
        where: { id: loanId, companyId: activeCompanyId },
        select: {
          id: true,
          status: true,
          principalClp: true,
          currency: true,
          disbursementMovementId: true,
          disbursedAt: true,
          userId: true,
        },
      });

      if (!loan) {
        const err: any = new Error("NOT_FOUND");
        err.code = "NOT_FOUND";
        throw err;
      }

      if (loan.status === LoanStatus.DISBURSED) {
        const err: any = new Error("ALREADY_DISBURSED");
        err.code = "ALREADY_DISBURSED";
        throw err;
      }

      if (loan.status !== LoanStatus.APPROVED) {
        const err: any = new Error("INVALID_STATUS");
        err.code = "INVALID_STATUS";
        err.status = loan.status;
        throw err;
      }

      if (loan.currency !== LoanCurrency.CLP) {
        const err: any = new Error("INVALID_CURRENCY");
        err.code = "INVALID_CURRENCY";
        throw err;
      }

      const now = new Date();
      const prevStatus = loan.status;
      const nextStatus = LoanStatus.DISBURSED;

      const account = await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
        update: {},
        create: { companyId: activeCompanyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      });

      const nextBalance = new Prisma.Decimal(account.balance).plus(loan.principalClp);

      await tx.treasuryAccount.update({
        where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
        data: { balance: nextBalance },
        select: { id: true },
      });

      const movement = await tx.treasuryMovement.create({
        data: {
          companyId: activeCompanyId,
          assetCode: AssetCode.CLP,
          type: "adjust",
          amount: loan.principalClp,
          note: `Loan disbursement ${loan.id}`,
          createdByUserId: user.id,
          status: TreasuryMovementStatus.APPROVED,
          approvedAt: now,
          approvedByUserId: user.id,
          paidOut: true,
          paidOutAt: now,
        },
        select: { id: true, type: true, assetCode: true, amount: true, status: true },
      });

      const disbursedAt = loan.disbursedAt ?? now;

      const updated = await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: nextStatus,
          disbursedAt: loan.disbursedAt ? loan.disbursedAt : disbursedAt,
          disbursementMovementId: movement.id,
        },
        select: { id: true, status: true, disbursedAt: true, disbursementMovementId: true },
      });

      const event = await tx.loanEvent.create({
        data: {
          loanId: updated.id,
          type: LoanEventType.DISBURSED,
          createdByUserId: user.id,
          payload: {
            prevStatus,
            nextStatus,
            principalClp: loan.principalClp.toString(),
            movementId: movement.id,
            disbursedAt: disbursedAt.toISOString(),
          },
        },
        select: { id: true, type: true, createdAt: true },
      });

      return { loan: updated, movement, event, prevStatus, nextStatus, principalClp: loan.principalClp };
    });

    console.info("LOAN_DISBURSE", {
      loanId: result.loan.id,
      companyId: activeCompanyId,
      adminUserId: user.id,
      prevStatus: result.prevStatus,
      nextStatus: result.nextStatus,
      principalClp: result.principalClp.toString(),
      movementId: result.movement.id,
    });

    return NextResponse.json({
      ok: true,
      loan: {
        id: result.loan.id,
        status: result.loan.status,
        disbursedAt: result.loan.disbursedAt?.toISOString() ?? null,
        disbursementMovementId: result.loan.disbursementMovementId ?? null,
      },
      movement: {
        id: result.movement.id,
        type: result.movement.type,
        assetCode: result.movement.assetCode,
        amount: result.movement.amount.toString(),
        status: result.movement.status,
      },
      event: {
        id: result.event.id,
        type: result.event.type,
        createdAt: result.event.createdAt.toISOString(),
      },
    });
  } catch (e: any) {
    if (e?.code === "NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Loan no existe" }, { status: 404 });
    }

    if (e?.code === "ALREADY_DISBURSED") {
      return NextResponse.json({ ok: false, error: "Loan ya desembolsado" }, { status: 400 });
    }

    if (e?.code === "INVALID_STATUS") {
      const status = String(e?.status ?? "").toUpperCase();
      return NextResponse.json(
        { ok: false, error: `Loan no es desembolsable (status=${status || "UNKNOWN"})` },
        { status: 400 }
      );
    }

    if (e?.code === "INVALID_CURRENCY") {
      return NextResponse.json({ ok: false, error: "Moneda inválida" }, { status: 400 });
    }

    console.error("LOAN_DISBURSE_ERROR", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
