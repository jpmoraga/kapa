// scripts/adjust_dani_balances.ts
// Dry run (default):
//   npx tsx -r dotenv/config scripts/adjust_dani_balances.ts --companyId cmky41qga002yjs0fp77dex3l
// Execute (requires --actorUserId):
//   npx tsx -r dotenv/config scripts/adjust_dani_balances.ts --companyId cmky41qga002yjs0fp77dex3l --actorUserId <id> --execute

import dotenv from "dotenv";
import path from "path";
import { PrismaClient, AssetCode, TreasuryMovementStatus, Prisma } from "@prisma/client";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const getArg = (name: string) => {
  const idx = args.indexOf(name);
  return idx === -1 ? null : (args[idx + 1] ?? null);
};

const companyId = getArg("--companyId") ?? "cmky41qga002yjs0fp77dex3l";
const actorUserId = getArg("--actorUserId");

if (execute && !actorUserId) {
  console.error("Missing --actorUserId (required when using --execute)");
  process.exit(2);
}

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL });

function toDecimal(value: Prisma.Decimal | number | string | null | undefined) {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value ?? 0);
}

async function main() {
  const assets = [AssetCode.BTC, AssetCode.USD];

  const movements = await prisma.treasuryMovement.findMany({
    where: {
      companyId,
      status: TreasuryMovementStatus.APPROVED,
      assetCode: { in: assets },
    },
    select: {
      id: true,
      assetCode: true,
      type: true,
      executedBaseAmount: true,
      executedAt: true,
      amount: true,
    },
  });

  const missingBase = movements.filter((m) => !m.executedBaseAmount);
  if (missingBase.length) {
    console.error(
      `Abort: ${missingBase.length} APPROVED movement(s) missing executedBaseAmount for BTC/USD. Example id=${missingBase[0]?.id}`
    );
    process.exit(2);
  }

  const expectedByAsset = new Map<AssetCode, Prisma.Decimal>();
  for (const asset of assets) expectedByAsset.set(asset, new Prisma.Decimal(0));

  for (const m of movements) {
    const base = toDecimal(m.executedBaseAmount);
    if (m.type === "deposit") {
      expectedByAsset.set(m.assetCode, toDecimal(expectedByAsset.get(m.assetCode)).plus(base));
    } else if (m.type === "withdraw") {
      expectedByAsset.set(m.assetCode, toDecimal(expectedByAsset.get(m.assetCode)).minus(base));
    } else {
      console.error(`Abort: unexpected type=${m.type} for movement ${m.id}`);
      process.exit(2);
    }
  }

  const balances = await prisma.treasuryAccount.findMany({
    where: { companyId, assetCode: { in: assets } },
    select: { assetCode: true, balance: true },
  });

  const actualByAsset = new Map<AssetCode, Prisma.Decimal>();
  for (const asset of assets) actualByAsset.set(asset, new Prisma.Decimal(0));
  for (const b of balances) actualByAsset.set(b.assetCode, toDecimal(b.balance));

  const rows = assets.map((asset) => {
    const actual = toDecimal(actualByAsset.get(asset));
    const expected = toDecimal(expectedByAsset.get(asset));
    const delta = expected.minus(actual); // + deposit, - withdraw
    return { asset, actual, expected, delta };
  });

  console.log(`Company: ${companyId}`);
  for (const row of rows) {
    console.log(
      `${row.asset}: actual=${row.actual.toString()} expected=${row.expected.toString()} delta=${row.delta.toString()}`
    );
  }

  if (!execute) {
    console.log("[DRY RUN] No changes applied.");
    return;
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      if (row.delta.isZero()) continue;
      const amount = row.delta.abs();
      const type = row.delta.greaterThan(0) ? "deposit" : "withdraw";

      await tx.treasuryMovement.create({
        data: {
          companyId,
          assetCode: row.asset,
          type,
          amount,
          status: TreasuryMovementStatus.APPROVED,
          approvedAt: now,
          approvedByUserId: actorUserId ?? undefined,
          createdByUserId: actorUserId ?? undefined,
          executedAt: now,
          executedSource: "CLEANUP_ORPHAN",
          executedBaseAmount: amount,
          executedQuoteAmount: null,
          executedQuoteCode: null,
          executedFeeAmount: new Prisma.Decimal(0),
          executedFeeCode: row.asset,
          note: "cleanup smoke residue",
        },
      });

      await tx.treasuryAccount.update({
        where: { companyId_assetCode: { companyId, assetCode: row.asset } },
        data: {
          balance: row.delta.greaterThan(0)
            ? { increment: amount }
            : { decrement: amount },
        },
      });
    }
  });

  console.log("Adjustments applied.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
