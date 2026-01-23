export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { AssetCode, Prisma } from "@prisma/client";
import { computeTradeFee, getTradeFeePercent } from "@/lib/fees";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  if (!membership) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;

  const movement = await prisma.treasuryMovement.findFirst({
    where: { id, companyId: activeCompanyId },
    select: {
      id: true,
      type: true,
      assetCode: true,
      amount: true,
      status: true,
      createdAt: true,
      executedAt: true,
      executedPrice: true,
      executedBaseAmount: true,
      executedQuoteAmount: true,
      executedFeeAmount: true,
      executedFeeCode: true,
      internalReason: true,
      externalOrderId: true,
      externalVenue: true,
    },
  });

  if (!movement) return NextResponse.json({ error: "Movimiento no existe" }, { status: 404 });

  if (movement.assetCode !== AssetCode.BTC && movement.assetCode !== AssetCode.USD) {
    return NextResponse.json({ error: "Movimiento no es trade" }, { status: 400 });
  }

  const isBuy = movement.type === "deposit";
  const baseAmount = new Prisma.Decimal(movement.executedBaseAmount ?? movement.amount ?? 0);
  const price = movement.executedPrice ? new Prisma.Decimal(movement.executedPrice) : null;

  const grossQuote =
    movement.executedQuoteAmount != null
      ? new Prisma.Decimal(movement.executedQuoteAmount as any)
      : price
      ? price.mul(baseAmount)
      : null;

  const feePct = getTradeFeePercent(movement.assetCode);
  const feeAmount =
    movement.executedFeeAmount != null
      ? new Prisma.Decimal(movement.executedFeeAmount as any)
      : isBuy
      ? grossQuote
        ? computeTradeFee(grossQuote, feePct)
        : null
      : computeTradeFee(baseAmount, feePct);

  const grossAmount = isBuy ? grossQuote : baseAmount;
  const netAmount =
    grossAmount && feeAmount
      ? isBuy
        ? grossAmount.plus(feeAmount)
        : grossAmount.minus(feeAmount)
      : null;

  const hasExecuted = Boolean(movement.executedAt);
  const isEstimated = movement.status !== "APPROVED" || !hasExecuted;

  let message: string | null = null;
  if (movement.status === "PROCESSING") {
    message = "Orden en proceso";
  } else if (movement.status === "PENDING" && movement.internalReason === "INSUFFICIENT_LIQUIDITY") {
    message = "Pendiente por liquidez";
  }

  return NextResponse.json({
    ok: true,
    movementId: movement.id,
    side: isBuy ? "buy" : "sell",
    baseAsset: movement.assetCode,
    quoteAsset: "CLP",
    grossAmount: grossAmount ? grossAmount.toString() : null,
    feePercent: feePct.toString(),
    feeAmount: feeAmount ? feeAmount.toString() : null,
    feeCurrency: isBuy ? "CLP" : movement.assetCode,
    netAmount: netAmount ? netAmount.toString() : null,
    qty: baseAmount.toString(),
    price: price ? price.toString() : null,
    status: movement.status,
    createdAt: movement.createdAt,
    executedAt: movement.executedAt,
    isEstimated,
    message,
    internalReason: movement.internalReason,
    externalOrderId: movement.externalOrderId,
    externalVenue: movement.externalVenue,
  });
}
