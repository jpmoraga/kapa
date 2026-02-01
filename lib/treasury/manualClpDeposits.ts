import { prisma } from "@/lib/prisma";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";

type ApprovalChannel = "whatsapp" | "admin";

function extractMovementId(notes: string | null | undefined) {
  if (!notes) return null;
  const m = notes.match(/movementId:([a-zA-Z0-9_-]+)/);
  return m?.[1] ?? null;
}

function appendNote(existing: string | null | undefined, next: string) {
  if (!existing) return next;
  if (existing.includes(next)) return existing;
  return `${existing} | ${next}`;
}

export async function approveClpDepositByMovement(opts: {
  movementId: string;
  companyId: string;
  actorUserId?: string | null;
  amountClp?: number;
  channel: ApprovalChannel;
  correlationId?: string;
}) {
  const { movementId, companyId, actorUserId, amountClp, channel, correlationId } = opts;

  return prisma.$transaction(async (tx) => {
    const movement = await tx.treasuryMovement.findUnique({
      where: { id: movementId },
      select: {
        id: true,
        companyId: true,
        status: true,
        assetCode: true,
        type: true,
        amount: true,
        internalNote: true,
      },
    });

    if (!movement) throw new Error("MOVEMENT_NOT_FOUND");
    if (movement.companyId !== companyId) throw new Error("WRONG_COMPANY");
    if (movement.type !== "deposit" || movement.assetCode !== AssetCode.CLP) {
      throw new Error("NOT_CLP_DEPOSIT");
    }

    if (movement.status === TreasuryMovementStatus.APPROVED) {
      return { movement, credited: false, already: true };
    }
    if (movement.status !== TreasuryMovementStatus.PENDING) {
      throw new Error("NOT_PENDING");
    }

    const amount = new Prisma.Decimal(
      amountClp != null ? Math.round(amountClp).toString() : movement.amount.toString()
    );
    if (amount.lte(0)) throw new Error("BAD_AMOUNT");

    const accClp = await tx.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      update: {},
      create: { companyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
      select: { balance: true },
    });

    await tx.treasuryAccount.update({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      data: { balance: new Prisma.Decimal(accClp.balance).plus(amount) },
    });

    const movementUpdated = await tx.treasuryMovement.update({
      where: { id: movement.id },
      data: {
        status: TreasuryMovementStatus.APPROVED,
        approvedByUserId: actorUserId ?? undefined,
        approvedAt: new Date(),
        executedAt: new Date(),
        executedSource: `manual-${channel}`,
        executedBaseAmount: amount,
        executedQuoteAmount: amount,
        executedQuoteCode: AssetCode.CLP,
        executedFeeAmount: new Prisma.Decimal(0),
        executedFeeCode: AssetCode.CLP,
        internalNote: appendNote(movement.internalNote, `approved:${channel}`),
      },
      select: { id: true, status: true },
    });

    const slip = await tx.depositSlip.findFirst({
      where: { notes: { contains: `movementId:${movement.id}` } },
      select: { id: true, status: true, notes: true },
    });

    if (slip) {
      await tx.depositSlip.update({
        where: { id: slip.id },
        data: {
          status: "approved",
          ocrStatus: "parsed",
          parsedAmountClp: BigInt(amount.toFixed(0)),
          notes: appendNote(slip.notes, `approved:${channel}`),
        },
      });
    }

    console.info(
      JSON.stringify({
        event: "deposit:approved",
        correlationId,
        movementId: movement.id,
        companyId,
        amountClp: amount.toString(),
        channel,
        slipId: slip?.id ?? null,
      })
    );

    return { movement: movementUpdated, credited: true, already: false };
  });
}

export async function rejectClpDepositByMovement(opts: {
  movementId: string;
  companyId: string;
  actorUserId?: string | null;
  channel: ApprovalChannel;
  correlationId?: string;
}) {
  const { movementId, companyId, actorUserId, channel, correlationId } = opts;

  return prisma.$transaction(async (tx) => {
    const movement = await tx.treasuryMovement.findUnique({
      where: { id: movementId },
      select: {
        id: true,
        companyId: true,
        status: true,
        assetCode: true,
        type: true,
        internalNote: true,
      },
    });

    if (!movement) throw new Error("MOVEMENT_NOT_FOUND");
    if (movement.companyId !== companyId) throw new Error("WRONG_COMPANY");
    if (movement.type !== "deposit" || movement.assetCode !== AssetCode.CLP) {
      throw new Error("NOT_CLP_DEPOSIT");
    }

    if (movement.status === TreasuryMovementStatus.REJECTED) {
      return { movement, already: true };
    }
    if (movement.status !== TreasuryMovementStatus.PENDING) {
      throw new Error("NOT_PENDING");
    }

    const movementUpdated = await tx.treasuryMovement.update({
      where: { id: movement.id },
      data: {
        status: TreasuryMovementStatus.REJECTED,
        approvedByUserId: actorUserId ?? undefined,
        approvedAt: new Date(),
        internalNote: appendNote(movement.internalNote, `rejected:${channel}`),
      },
      select: { id: true, status: true },
    });

    const slip = await tx.depositSlip.findFirst({
      where: { notes: { contains: `movementId:${movement.id}` } },
      select: { id: true, status: true, notes: true },
    });

    if (slip) {
      await tx.depositSlip.update({
        where: { id: slip.id },
        data: {
          status: "rejected",
          notes: appendNote(slip.notes, `rejected:${channel}`),
        },
      });
    }

    console.info(
      JSON.stringify({
        event: "deposit:rejected",
        correlationId,
        movementId: movement.id,
        companyId,
        channel,
        slipId: slip?.id ?? null,
      })
    );

    return { movement: movementUpdated, already: false };
  });
}

export async function approveClpDepositBySlip(opts: {
  slipId: string;
  amountClp: number;
  channel: ApprovalChannel;
  actorUserId?: string | null;
  correlationId?: string;
}) {
  const { slipId, amountClp, channel, actorUserId, correlationId } = opts;

  return prisma.$transaction(async (tx) => {
    const slip = await tx.depositSlip.findUnique({
      where: { id: slipId },
      select: {
        id: true,
        status: true,
        notes: true,
        parsedAmountClp: true,
        declaredAmountClp: true,
      },
    });

    if (!slip) throw new Error("SLIP_NOT_FOUND");

    const movementId = extractMovementId(slip.notes);
    await tx.depositSlip.update({
      where: { id: slip.id },
      data: {
        status: "approved",
        ocrStatus: "parsed",
        parsedAmountClp: BigInt(Math.round(amountClp)),
        notes: appendNote(slip.notes, `approved:${channel}`),
      },
    });

    if (!movementId) {
      return { credited: false, movementId: null };
    }

    const movement = await tx.treasuryMovement.findUnique({
      where: { id: movementId },
      select: {
        id: true,
        companyId: true,
        status: true,
        assetCode: true,
        type: true,
        amount: true,
        internalNote: true,
      },
    });

    if (!movement) {
      return { credited: false, movementId };
    }

    if (movement.type !== "deposit" || movement.assetCode !== AssetCode.CLP) {
      return { credited: false, movementId };
    }

    if (movement.status === TreasuryMovementStatus.APPROVED) {
      return { credited: false, movementId };
    }
    if (movement.status !== TreasuryMovementStatus.PENDING) {
      throw new Error("NOT_PENDING");
    }

    const amount = new Prisma.Decimal(Math.round(amountClp).toString());

    const accClp = await tx.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId: movement.companyId, assetCode: AssetCode.CLP } },
      update: {},
      create: { companyId: movement.companyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
      select: { balance: true },
    });

    await tx.treasuryAccount.update({
      where: { companyId_assetCode: { companyId: movement.companyId, assetCode: AssetCode.CLP } },
      data: { balance: new Prisma.Decimal(accClp.balance).plus(amount) },
    });

    await tx.treasuryMovement.update({
      where: { id: movement.id },
      data: {
        status: TreasuryMovementStatus.APPROVED,
        approvedByUserId: actorUserId ?? undefined,
        approvedAt: new Date(),
        executedAt: new Date(),
        executedSource: `manual-${channel}`,
        executedBaseAmount: amount,
        executedQuoteAmount: amount,
        executedQuoteCode: AssetCode.CLP,
        executedFeeAmount: new Prisma.Decimal(0),
        executedFeeCode: AssetCode.CLP,
        internalNote: appendNote(movement.internalNote, `approved:${channel}`),
      },
    });

    console.info(
      JSON.stringify({
        event: "deposit:approved",
        correlationId,
        movementId: movement.id,
        companyId: movement.companyId,
        amountClp: amount.toString(),
        channel,
        slipId,
      })
    );

    return { credited: true, movementId };
  });
}

export async function rejectClpDepositBySlip(opts: {
  slipId: string;
  channel: ApprovalChannel;
  actorUserId?: string | null;
  correlationId?: string;
}) {
  const { slipId, channel, actorUserId, correlationId } = opts;

  return prisma.$transaction(async (tx) => {
    const slip = await tx.depositSlip.findUnique({
      where: { id: slipId },
      select: { id: true, status: true, notes: true },
    });

    if (!slip) throw new Error("SLIP_NOT_FOUND");

    const movementId = extractMovementId(slip.notes);
    await tx.depositSlip.update({
      where: { id: slip.id },
      data: {
        status: "rejected",
        notes: appendNote(slip.notes, `rejected:${channel}`),
      },
    });

    if (!movementId) {
      return { rejected: true, movementId: null };
    }

    const movement = await tx.treasuryMovement.findUnique({
      where: { id: movementId },
      select: {
        id: true,
        companyId: true,
        status: true,
        assetCode: true,
        type: true,
        internalNote: true,
      },
    });

    if (!movement) {
      return { rejected: true, movementId };
    }

    if (movement.type !== "deposit" || movement.assetCode !== AssetCode.CLP) {
      return { rejected: true, movementId };
    }

    if (movement.status === TreasuryMovementStatus.REJECTED) {
      return { rejected: true, movementId };
    }
    if (movement.status !== TreasuryMovementStatus.PENDING) {
      throw new Error("NOT_PENDING");
    }

    await tx.treasuryMovement.update({
      where: { id: movement.id },
      data: {
        status: TreasuryMovementStatus.REJECTED,
        approvedByUserId: actorUserId ?? undefined,
        approvedAt: new Date(),
        internalNote: appendNote(movement.internalNote, `rejected:${channel}`),
      },
    });

    console.info(
      JSON.stringify({
        event: "deposit:rejected",
        correlationId,
        movementId: movement.id,
        companyId: movement.companyId,
        channel,
        slipId,
      })
    );

    return { rejected: true, movementId };
  });
}
