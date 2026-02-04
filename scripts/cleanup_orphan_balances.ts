// scripts/cleanup_orphan_balances.ts
// Dry run (default):
//   npx tsx -r dotenv/config scripts/cleanup_orphan_balances.ts --companyId <id>
// Execute:
//   npx tsx -r dotenv/config scripts/cleanup_orphan_balances.ts --companyId <id> --execute

import dotenv from "dotenv";
import path from "path";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";
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

const companyId = getArg("--companyId");

if (!companyId) {
  console.error("Missing --companyId");
  process.exit(1);
}

function abort(message: string): never {
  console.error(message);
  process.exit(2);
}

function toDecimal(value: Prisma.Decimal | number | string | null | undefined) {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value ?? 0);
}

async function main() {
  const prisma = getScriptPrisma();
  try {
    const accounts = await prisma.treasuryAccount.findMany({
      where: { companyId },
      select: { assetCode: true, balance: true },
    });

    const movements = await prisma.treasuryMovement.findMany({
      where: { companyId, status: TreasuryMovementStatus.APPROVED },
      select: {
        id: true,
        assetCode: true,
        amount: true,
        type: true,
        executedBaseAmount: true,
        executedQuoteCode: true,
        executedQuoteAmount: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const crossAssetQuotes = movements.filter(
      (m) => m.executedQuoteCode && m.executedQuoteCode !== m.assetCode
    );
    if (crossAssetQuotes.length) {
      abort(
        `Cannot compute expected balances safely: found ${crossAssetQuotes.length} approved movement(s) with executedQuoteCode different from assetCode. Example movementId=${crossAssetQuotes[0]?.id}`
      );
    }

    const expected = new Map<string, Prisma.Decimal>();

    for (const movement of movements) {
      if (movement.type !== "deposit" && movement.type !== "withdraw") {
        abort(
          `Unsupported movement.type=${movement.type} for movementId=${movement.id}. Abort to avoid incorrect balances.`
        );
      }

      const baseAmount = movement.executedBaseAmount ?? movement.amount;
      if (!baseAmount) {
        abort(`Missing amount for movementId=${movement.id}. Abort for manual intervention.`);
      }

      const signed = movement.type === "deposit" ? baseAmount : baseAmount.negated();
      const prev = expected.get(movement.assetCode) ?? new Prisma.Decimal(0);
      expected.set(movement.assetCode, prev.plus(signed));
    }

    const assetSet = new Set<string>();
    for (const account of accounts) assetSet.add(account.assetCode);
    for (const asset of expected.keys()) assetSet.add(asset);

    const rows: Array<{
      assetCode: string;
      actual: Prisma.Decimal;
      expected: Prisma.Decimal;
      delta: Prisma.Decimal;
    }> = [];

    for (const assetCode of assetSet) {
      const actual = toDecimal(accounts.find((a) => a.assetCode === assetCode)?.balance);
      const expectedBalance = expected.get(assetCode) ?? new Prisma.Decimal(0);
      const delta = actual.minus(expectedBalance);
      rows.push({ assetCode, actual, expected: expectedBalance, delta });
    }

    console.log(`Company: ${companyId}`);
    console.log(`Approved movements: ${movements.length}`);
    for (const row of rows) {
      console.log(
        `${row.assetCode}: actual=${row.actual.toString()} expected=${row.expected.toString()} delta=${row.delta.toString()}`
      );
    }

    const adjustments = rows.filter((row) => !row.delta.isZero());

    if (!adjustments.length) {
      console.log("No deltas detected. No cleanup needed.");
      return;
    }

    if (!execute) {
      console.log("[DRY RUN] Would create adjustment movements and set balances to expected values.");
      for (const row of adjustments) {
        const direction = row.delta.greaterThan(0) ? "withdraw" : "deposit";
        console.log(
          `- ${row.assetCode}: ${direction} ${row.delta.abs().toString()} (to reach ${row.expected.toString()})`
        );
      }
      return;
    }

    const now = new Date();
    const created: Array<{ assetCode: string; movementId: string }> = [];

    await prisma.$transaction(async (tx) => {
      for (const row of adjustments) {
        const amount = row.delta.abs();
        const type = row.delta.greaterThan(0) ? "withdraw" : "deposit";

        const movement = await tx.treasuryMovement.create({
          data: {
            companyId,
            assetCode: row.assetCode as AssetCode,
            type,
            amount,
            status: TreasuryMovementStatus.APPROVED,
            approvedAt: now,
            executedAt: now,
            executedSource: "TEST_CLEANUP",
            executedBaseAmount: amount,
            executedQuoteCode: row.assetCode as AssetCode,
            executedQuoteAmount: amount,
            internalNote: "revert orphan balance from failed smoke test",
          },
          select: { id: true },
        });

        await tx.treasuryAccount.upsert({
          where: { companyId_assetCode: { companyId, assetCode: row.assetCode as AssetCode } },
          update: { balance: row.expected },
          create: { companyId, assetCode: row.assetCode as AssetCode, balance: row.expected },
        });

        created.push({ assetCode: row.assetCode, movementId: movement.id });
      }
    });

    console.log("Cleanup applied. Movement IDs:");
    for (const entry of created) {
      console.log(`- ${entry.assetCode}: ${entry.movementId}`);
    }

    const afterAccounts = await prisma.treasuryAccount.findMany({
      where: { companyId },
      select: { assetCode: true, balance: true },
    });
    console.log("Balances after cleanup:");
    for (const account of afterAccounts) {
      console.log(`- ${account.assetCode}: ${account.balance.toString()}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
