// scripts/repair_clp_deposit.ts
// Usage (dry run):
//   npx tsx -r dotenv/config scripts/repair_clp_deposit.ts dani_becerra@hotmail.com
// Execute:
//   npx tsx -r dotenv/config scripts/repair_clp_deposit.ts dani_becerra@hotmail.com --execute
// Optional:
//   --amount 2000
//   --from 2026-01-28T00:00:00-03:00 --to 2026-01-29T00:00:00-03:00
//   --force-rejected (allow approving a rejected movement)

import dotenv from "dotenv";
import path from "path";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";
import { getScriptPrisma } from "./_prisma";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const args = process.argv.slice(2);
const emailRaw = args[0];

function getArg(name: string) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const execute = args.includes("--execute");
const forceRejected = args.includes("--force-rejected");

if (!emailRaw) {
  console.error("Usage: npx tsx -r dotenv/config scripts/repair_clp_deposit.ts <email> [--execute]");
  process.exit(1);
}

const email = emailRaw.toLowerCase().trim();
const amountStr = getArg("--amount") ?? "2000";
const amountNum = Number(String(amountStr).replace(/[^\d]/g, ""));
if (!Number.isFinite(amountNum) || amountNum <= 0) {
  console.error("Invalid amount. Use --amount 2000");
  process.exit(1);
}
const amountDec = new Prisma.Decimal(amountNum.toString());

const fromArg = getArg("--from") ?? "2026-01-28T00:00:00-03:00";
const toArg = getArg("--to") ?? "2026-01-29T00:00:00-03:00";
const from = new Date(fromArg);
const to = new Date(toArg);

if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
  console.error("Invalid --from/--to date. Example: 2026-01-28T00:00:00-03:00");
  process.exit(1);
}

async function approveClpMovement(opts: {
  prisma: ReturnType<typeof getScriptPrisma>;
  movementId: string;
  companyId: string;
  actorUserId: string;
  amount: Prisma.Decimal;
}) {
  const { prisma, movementId, companyId, actorUserId, amount } = opts;

  return prisma.$transaction(async (tx) => {
    const movement = await tx.treasuryMovement.findUnique({
      where: { id: movementId },
      select: { id: true, type: true, assetCode: true, status: true },
    });

    if (!movement) throw new Error("MOVEMENT_NOT_FOUND");
    if (movement.type !== "deposit") throw new Error("NOT_DEPOSIT");
    if (movement.assetCode !== AssetCode.CLP) throw new Error("NOT_CLP");
    if (movement.status === TreasuryMovementStatus.APPROVED) {
      return { id: movement.id, status: movement.status };
    }
    if (movement.status === TreasuryMovementStatus.REJECTED && !forceRejected) {
      throw new Error("MOVEMENT_REJECTED");
    }

    const acc = await tx.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      update: {},
      create: { companyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
      select: { balance: true },
    });

    const next = new Prisma.Decimal(acc.balance).plus(amount);

    await tx.treasuryAccount.update({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      data: { balance: next },
    });

    const tag = "manual repair after upload error";
    const updated = await tx.treasuryMovement.update({
      where: { id: movement.id },
      data: {
        status: TreasuryMovementStatus.APPROVED,
        approvedAt: new Date(),
        approvedByUserId: actorUserId,
        executedAt: new Date(),
        executedPrice: new Prisma.Decimal(1),
        executedQuoteCode: AssetCode.CLP,
        executedSource: "internal",
        executedBaseAmount: amount,
        executedQuoteAmount: amount,
        executedFeeAmount: new Prisma.Decimal(0),
        executedFeeCode: AssetCode.CLP,
        internalNote: tag,
        note: tag,
      },
      select: { id: true, status: true },
    });

    return updated;
  });
}

async function main() {
  const prisma = getScriptPrisma();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, activeCompanyId: true },
    });

    if (!user) {
      console.error("User not found:", email);
      return;
    }

    let companyId = user.activeCompanyId ?? null;
    if (!companyId) {
      const membership = await prisma.companyUser.findFirst({
        where: { userId: user.id },
        select: { companyId: true },
      });
      companyId = membership?.companyId ?? null;
    }

    if (!companyId) {
      console.error("No company found for user:", email);
      return;
    }

    console.log("User:", { email, userId: user.id, companyId });
    console.log("Window:", { from: from.toISOString(), to: to.toISOString(), amount: amountDec.toString() });

    const slip = await prisma.depositSlip.findFirst({
      where: {
        userId: user.id,
        createdAt: { gte: from, lte: to },
        OR: [
          { parsedAmountClp: BigInt(amountNum) },
          { declaredAmountClp: BigInt(amountNum) },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        parsedAmountClp: true,
        declaredAmountClp: true,
        notes: true,
        createdAt: true,
      },
    });

    const movement = await prisma.treasuryMovement.findFirst({
      where: {
        companyId,
        type: "deposit",
        createdAt: { gte: from, lte: to },
        amount: amountDec,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        assetCode: true,
        amount: true,
        createdAt: true,
        note: true,
        internalNote: true,
      },
    });

    console.log("DepositSlip:", slip ?? "none");
    console.log("Movement:", movement ?? "none");

    if (movement) {
      if (movement.assetCode !== AssetCode.CLP && slip) {
        console.log("Movement assetCode is not CLP; slip exists. Will correct assetCode to CLP.");
        if (execute) {
          await prisma.treasuryMovement.update({
            where: { id: movement.id },
            data: { assetCode: AssetCode.CLP },
          });
        }
      }

      if (!execute) {
        console.log("[DRY RUN] Would approve existing movement:", movement.id);
        return;
      }

      const updated = await approveClpMovement({
        prisma,
        movementId: movement.id,
        companyId,
        actorUserId: user.id,
        amount: amountDec,
      });

      console.log("Approved movement:", updated);
      return;
    }

    if (!execute) {
      console.log("[DRY RUN] Would create new APPROVED movement and update TreasuryAccount.");
      return;
    }

    const tag = "manual repair after upload error";
    const created = await prisma.$transaction(async (tx) => {
      const mv = await tx.treasuryMovement.create({
        data: {
          companyId,
          type: "deposit",
          assetCode: AssetCode.CLP,
          amount: amountDec,
          status: TreasuryMovementStatus.APPROVED,
          approvedAt: new Date(),
          approvedByUserId: user.id,
          executedAt: new Date(),
          executedPrice: new Prisma.Decimal(1),
          executedQuoteCode: AssetCode.CLP,
          executedSource: "internal",
          executedBaseAmount: amountDec,
          executedQuoteAmount: amountDec,
          executedFeeAmount: new Prisma.Decimal(0),
          executedFeeCode: AssetCode.CLP,
          internalNote: tag,
          note: tag,
          createdByUserId: user.id,
        },
        select: { id: true, status: true },
      });

      const acc = await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
        update: {},
        create: { companyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      });

      const next = new Prisma.Decimal(acc.balance).plus(amountDec);

      await tx.treasuryAccount.update({
        where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
        data: { balance: next },
      });

      return mv;
    });

    console.log("Created movement:", created);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
