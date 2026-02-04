// scripts/force_approve_btc.ts
// Dry run (default):
//   npx tsx -r dotenv/config scripts/force_approve_btc.ts
// Execute:
//   npx tsx -r dotenv/config scripts/force_approve_btc.ts --execute
//
// Optional overrides:
//   --companyId <id>
//   --amount 0.0006
//   --at 2026-01-29T00:15:35.335-03:00

import dotenv from "dotenv";
import path from "path";
import { AssetCode, InternalMovementReason, InternalMovementState, Prisma, TreasuryMovementStatus } from "@prisma/client";
import { getScriptPrisma } from "./_prisma";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const args = process.argv.slice(2);
const execute = args.includes("--execute");

function getArg(name: string) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const companyId = getArg("--companyId") ?? "cmku4mimd000tl10fp104l57s";
const amountStr = getArg("--amount") ?? "0.0006";
const atStr = getArg("--at") ?? "2026-01-29T00:15:35.335Z";

const amount = new Prisma.Decimal(amountStr);
const at = new Date(atStr);
if (Number.isNaN(at.getTime())) {
  console.error("Invalid --at timestamp. Use ISO string, e.g. 2026-01-29T00:15:35.335-03:00");
  process.exit(1);
}

const windowMs = 5 * 60 * 1000;
const from = new Date(at.getTime() - windowMs);
const to = new Date(at.getTime() + windowMs);

async function main() {
  const prisma = getScriptPrisma();
  try {
    const candidates = await prisma.treasuryMovement.findMany({
      where: {
        companyId,
        status: TreasuryMovementStatus.PENDING,
        assetCode: AssetCode.BTC,
        type: "deposit",
        amount,
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        assetCode: true,
        type: true,
        amount: true,
        createdAt: true,
        internalReason: true,
        internalState: true,
      },
    });

    if (candidates.length !== 1) {
      console.log("Expected exactly 1 candidate. Found:", candidates.length);
      for (const c of candidates) {
        console.log(c);
      }
      return;
    }

    const target = candidates[0];
    console.log("Candidate:", {
      id: target.id,
      companyId,
      amount: target.amount.toString(),
      createdAt: target.createdAt,
      status: target.status,
    });

    if (!execute) {
      console.log("[DRY RUN] Would approve movement and increment BTC balance.");
      return;
    }

    const tag = "manual approval after liquidity issue";

    const out = await prisma.$transaction(async (tx) => {
      const acc = await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId, assetCode: AssetCode.BTC } },
        update: {},
        create: { companyId, assetCode: AssetCode.BTC, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      });

      await tx.treasuryAccount.update({
        where: { companyId_assetCode: { companyId, assetCode: AssetCode.BTC } },
        data: { balance: new Prisma.Decimal(acc.balance).plus(amount) },
      });

      const updated = await tx.treasuryMovement.update({
        where: { id: target.id },
        data: {
          status: TreasuryMovementStatus.APPROVED,
          approvedAt: new Date(),
          executedAt: new Date(),
          executedSource: "manual_admin_fix",
          executedBaseAmount: amount,
          executedQuoteAmount: amount,
          executedFeeAmount: new Prisma.Decimal(0),
          internalNote: tag,
          internalReason: InternalMovementReason.NONE,
          internalState: InternalMovementState.NONE,
        },
        select: { id: true, status: true },
      });

      return updated;
    });

    console.log("Updated movement:", out);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
