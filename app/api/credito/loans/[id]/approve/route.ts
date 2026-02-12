export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { LoanEventType, LoanStatus } from "@prisma/client";

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
        select: { id: true, status: true, approvedAt: true },
      });

      if (!loan) {
        const err: any = new Error("NOT_FOUND");
        err.code = "NOT_FOUND";
        throw err;
      }

      if (loan.status !== LoanStatus.CREATED) {
        const err: any = new Error("INVALID_STATUS");
        err.code = "INVALID_STATUS";
        err.status = loan.status;
        throw err;
      }

      const now = new Date();
      const approvedAt = loan.approvedAt ?? now;
      const nextStatus = LoanStatus.APPROVED;

      console.info("LOAN_APPROVE", {
        loanId,
        companyId: activeCompanyId,
        userId: user.id,
        prevStatus: loan.status,
        nextStatus,
      });

      const updated = await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: nextStatus,
          approvedAt: loan.approvedAt ? loan.approvedAt : approvedAt,
        },
        select: { id: true, status: true, approvedAt: true },
      });

      const event = await tx.loanEvent.create({
        data: {
          loanId: updated.id,
          type: LoanEventType.APPROVED,
          createdByUserId: user.id,
          payload: {
            prevStatus: loan.status,
            nextStatus,
            approvedAt: approvedAt.toISOString(),
          },
        },
        select: { id: true, type: true, createdAt: true },
      });

      return { loan: updated, event };
    });

    return NextResponse.json({
      ok: true,
      loan: {
        id: result.loan.id,
        status: result.loan.status,
        approvedAt: result.loan.approvedAt?.toISOString() ?? null,
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

    if (e?.code === "INVALID_STATUS") {
      const status = String(e?.status ?? "").toUpperCase();
      const message =
        status === LoanStatus.APPROVED
          ? "Loan ya aprobado"
          : status === LoanStatus.DISBURSED
            ? "Loan ya desembolsado"
            : status
              ? `Loan no es aprobable (status=${status})`
              : "Loan no es aprobable";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    console.error("LOAN_APPROVE_ERROR", e);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
