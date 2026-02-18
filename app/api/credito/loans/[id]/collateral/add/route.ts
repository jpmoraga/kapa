export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { AssetCode, LoanEventType, LoanStatus } from "@prisma/client";

function parseSats(input: unknown): bigint | null {
  if (typeof input === "bigint") return input > BigInt(0) ? input : null;
  if (typeof input === "number") {
    if (!Number.isFinite(input) || !Number.isInteger(input) || input <= 0) return null;
    return BigInt(input);
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const value = BigInt(trimmed);
    return value > BigInt(0) ? value : null;
  }
  return null;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (process.env.K21_ENABLE_COLLATERAL_MUTATIONS !== "true") {
    return NextResponse.json(
      { ok: false, error: "Collateral disabled", code: "COLLATERAL_DISABLED" },
      { status: 503 }
    );
  }

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
  const body = await req.json().catch(() => null);
  const sats = parseSats(body?.sats);

  if (!sats) {
    return NextResponse.json(
      { ok: false, error: "Sats inválidos", code: "INVALID_SATS" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        select: {
          id: true,
          companyId: true,
          userId: true,
          status: true,
          collateralSatsTotal: true,
          collateral: { select: { amountSats: true } },
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

      if (loan.status !== LoanStatus.DISBURSED) {
        const err: any = new Error("INVALID_STATUS");
        err.code = "INVALID_STATUS";
        throw err;
      }

      const collateralSum = loan.collateral.reduce(
        (acc, entry) => acc + entry.amountSats,
        BigInt(0)
      );
      const currentTotal = collateralSum;
      const newTotal = currentTotal + sats;

      await tx.loanCollateral.create({
        data: {
          loanId: loan.id,
          assetCode: AssetCode.BTC,
          amountSats: sats,
        },
        select: { id: true },
      });

      await tx.loan.update({
        where: { id: loan.id },
        data: { collateralSatsTotal: newTotal },
        select: { id: true },
      });

      await tx.loanEvent.create({
        data: {
          loanId: loan.id,
          type: LoanEventType.COLLATERAL_ADDED,
          payload: {
            sats: sats.toString(),
            previousTotalSats: currentTotal.toString(),
            newTotalSats: newTotal.toString(),
          },
          createdByUserId: user.id,
        },
        select: { id: true },
      });

      return { collateralSatsTotal: newTotal };
    });

    return NextResponse.json({ ok: true, collateralSatsTotal: result.collateralSatsTotal.toString() });
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
    if (e?.code === "INVALID_STATUS") {
      return NextResponse.json(
        { ok: false, error: "Loan no permite cambiar garantía", code: "INVALID_STATUS" },
        { status: 409 }
      );
    }

    console.error("COLLATERAL_ADD_ERROR", e);
    return NextResponse.json(
      { ok: false, error: "Error interno", code: "COLLATERAL_ERROR" },
      { status: 500 }
    );
  }
}
