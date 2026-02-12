export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// NOTE: /api/credito/loans/[id]/approve está deprecated en v1; usar /disburse.

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
          approvedAt: true,
          userId: true,
        },
      });

      if (!loan) {
        const err: any = new Error("NOT_FOUND");
        err.code = "NOT_FOUND";
        throw err;
      }

      if (loan.currency !== LoanCurrency.CLP) {
        const err: any = new Error("INVALID_CURRENCY");
        err.code = "INVALID_CURRENCY";
        throw err;
      }

      const now = new Date();
      const prevStatus = loan.status;

      const updatedCount = await tx.$executeRaw`
        UPDATE "Loan"
        SET
          "status" = ${LoanStatus.DISBURSED},
          "disbursedAt" = ${now},
          "approvedAt" = COALESCE("approvedAt", ${now})
        WHERE
          "id" = ${loanId}
          AND "companyId" = ${activeCompanyId}
          AND "status" IN (${LoanStatus.CREATED}, ${LoanStatus.APPROVED})
          AND "disbursementMovementId" IS NULL
      `;

      if (updatedCount === 0) {
        const current = await tx.loan.findFirst({
          where: { id: loanId, companyId: activeCompanyId },
          select: {
            id: true,
            status: true,
            disbursementMovementId: true,
            disbursedAt: true,
            principalClp: true,
            approvedAt: true,
          },
        });

        if (!current) {
          const err: any = new Error("NOT_FOUND");
          err.code = "NOT_FOUND";
          throw err;
        }

        if (current.status === LoanStatus.DISBURSED) {
          let warning: string | null = null;
          let movement: {
            id: string;
            type: string;
            assetCode: AssetCode;
            amount: Prisma.Decimal;
            status: TreasuryMovementStatus;
          } | null = null;

          if (current.disbursementMovementId) {
            movement = await tx.treasuryMovement.findUnique({
              where: { id: current.disbursementMovementId },
              select: { id: true, type: true, assetCode: true, amount: true, status: true },
            });
          } else {
            warning =
              "Loan está DISBURSED pero sin disbursementMovementId; requiere reparación admin";
            console.error("LOAN_DISBURSE_INCONSISTENT_STATE", {
              loanId: current.id,
              companyId: activeCompanyId,
              status: current.status,
              disbursementMovementId: null,
            });
          }

          return {
            kind: "idempotent" as const,
            loan: current,
            movement,
            event: null,
            prevStatus: LoanStatus.DISBURSED,
            nextStatus: LoanStatus.DISBURSED,
            principalClp: current.principalClp,
            warning,
          };
        }

        const err: any = new Error("INVALID_STATUS");
        err.code = "INVALID_STATUS";
        err.status = current.status;
        throw err;
      }

      await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
        update: {},
        create: { companyId: activeCompanyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
        select: { id: true },
      });

      await tx.treasuryAccount.update({
        where: { companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP } },
        data: { balance: { increment: loan.principalClp } },
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

      const updated = await tx.loan.update({
        where: { id: loan.id },
        data: {
          disbursementMovementId: movement.id,
        },
        select: { id: true, status: true, disbursedAt: true, disbursementMovementId: true, approvedAt: true },
      });

      const event = await tx.loanEvent.create({
        data: {
          loanId: updated.id,
          type: LoanEventType.DISBURSED,
          createdByUserId: user.id,
          payload: {
            prevStatus,
            nextStatus: LoanStatus.DISBURSED,
            principalClp: loan.principalClp.toString(),
            movementId: movement.id,
            disbursedAt: updated.disbursedAt?.toISOString() ?? now.toISOString(),
            approvedAt: updated.approvedAt?.toISOString() ?? now.toISOString(),
          },
        },
        select: { id: true, type: true, createdAt: true },
      });

      return {
        kind: "created" as const,
        loan: updated,
        movement,
        event,
        prevStatus,
        nextStatus: LoanStatus.DISBURSED,
        principalClp: loan.principalClp,
        warning: null,
      };
    });

    console.info("LOAN_DISBURSE", {
      loanId: result.loan.id,
      companyId: activeCompanyId,
      adminUserId: user.id,
      prevStatus: result.prevStatus,
      nextStatus: result.nextStatus,
      principalClp: result.principalClp.toString(),
      movementId: result.movement?.id ?? null,
    });

    return NextResponse.json({
      ok: true,
      kind: result.kind,
      loan: {
        id: result.loan.id,
        status: result.loan.status,
        disbursedAt: result.loan.disbursedAt?.toISOString() ?? null,
        disbursementMovementId: result.loan.disbursementMovementId ?? null,
        approvedAt: result.loan.approvedAt?.toISOString() ?? null,
      },
      movement: result.movement
        ? {
            id: result.movement.id,
            type: result.movement.type,
            assetCode: result.movement.assetCode,
            amount: result.movement.amount.toString(),
            status: result.movement.status,
          }
        : null,
      event: result.event
        ? {
            id: result.event.id,
            type: result.event.type,
            createdAt: result.event.createdAt.toISOString(),
          }
        : null,
      ...(result.warning ? { warning: result.warning } : {}),
    });
  } catch (e: any) {
    if (e?.code === "NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Loan no existe" }, { status: 404 });
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
