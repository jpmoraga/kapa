// scripts/test_sell_usdt.ts
// Dry run (default):
//   npx tsx -r dotenv/config scripts/test_sell_usdt.ts --companyId <id> --userId <id>
// Execute:
//   npx tsx -r dotenv/config scripts/test_sell_usdt.ts --execute --companyId <id> --userId <id>
// Options:
//   --amountUsdt 10 --priceClp 900 --mode internal|external

import dotenv from "dotenv";
import path from "path";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";
import { getScriptPrisma } from "./_prisma";
import { ensureSystemWallet } from "../lib/systemWallet";
import { approveMovementAsSystem } from "../lib/treasury/approveMovement";
import { computeTradeFee, getTradeFeePercent } from "../lib/fees";

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
const userId = getArg("--userId");
const amountStr = getArg("--amountUsdt") ?? "10";
const priceStr = getArg("--priceClp") ?? "900";
const mode = (getArg("--mode") ?? "internal").toLowerCase();

if (!companyId || !userId) {
  console.error("Missing --companyId or --userId");
  process.exit(1);
}

if (mode !== "internal" && mode !== "external") {
  console.error("Invalid --mode. Use internal|external");
  process.exit(1);
}

const hasBudaKeys = Boolean(process.env.BUDA_API_KEY && process.env.BUDA_API_SECRET);

async function main() {
  const prisma = getScriptPrisma();
  try {
    const amount = new Prisma.Decimal(amountStr);
    const price = new Prisma.Decimal(priceStr);
    const feePct = getTradeFeePercent(AssetCode.USD);
    const feeOnBase = computeTradeFee(amount, feePct);
    const totalSellBase = amount.plus(feeOnBase);

    if (!execute) {
      console.log("[DRY RUN] Would create USDT sell + approve and validate balances.");
      console.log("companyId", companyId);
      console.log("userId", userId);
      console.log("amountUsdt", amount.toString());
      console.log("priceClp", price.toString());
      console.log("mode", mode);
      console.log("hasBudaKeys", hasBudaKeys);
      return;
    }

    const idempotencyColumns = await prisma.$queryRaw<
      Array<{ column_name: string }>
    >`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'TreasuryMovement'
        AND column_name = 'idempotencyKey'
    `;
    if (!idempotencyColumns.length) {
      console.error(
        "Missing TreasuryMovement.idempotencyKey column. Apply migration before running this smoke test."
      );
      process.exit(2);
    }

    const idempotencyKey = `smoke-sell-usdt-${Date.now()}`;
    const first = await prisma.treasuryMovement.create({
      data: {
        companyId,
        assetCode: AssetCode.USD,
        type: "withdraw",
        amount,
        status: TreasuryMovementStatus.PENDING,
        createdByUserId: userId,
        note: "smoke sell usdt",
        internalNote: "smoke_sell_usdt",
        idempotencyKey,
      },
      select: { id: true },
    });

    let duplicateError = null;
    try {
      await prisma.treasuryMovement.create({
        data: {
          companyId,
          assetCode: AssetCode.USD,
          type: "withdraw",
          amount,
          status: TreasuryMovementStatus.PENDING,
          createdByUserId: userId,
          note: "smoke sell usdt duplicate",
          internalNote: "smoke_sell_usdt_duplicate",
          idempotencyKey,
        },
      });
    } catch (e: any) {
      duplicateError = e?.code ?? e?.message ?? "duplicate_error";
    }

    const found = await prisma.treasuryMovement.findFirst({
      where: { companyId, idempotencyKey },
      select: { id: true },
    });

    const { companyId: systemCompanyId } = await prisma.$transaction(async (tx) =>
      ensureSystemWallet(tx)
    );

    await prisma.priceSnapshot.create({
      data: {
        assetCode: AssetCode.USD,
        quoteCode: AssetCode.CLP,
        price,
        source: "manual:smoke_sell_usdt",
      },
    });

    const startingClp = new Prisma.Decimal("0");
    const startingUsd = totalSellBase.mul(2);
    const systemUsd = mode === "external" ? totalSellBase.mul(2) : new Prisma.Decimal("0");
    const systemClp = mode === "internal" ? new Prisma.Decimal("100000000") : new Prisma.Decimal("0");

    await prisma.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      update: { balance: startingClp },
      create: { companyId, assetCode: AssetCode.CLP, balance: startingClp },
    });

    await prisma.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.USD } },
      update: { balance: startingUsd },
      create: { companyId, assetCode: AssetCode.USD, balance: startingUsd },
    });

    await prisma.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.USD } },
      update: { balance: systemUsd },
      create: { companyId: systemCompanyId, assetCode: AssetCode.USD, balance: systemUsd },
    });

    await prisma.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
      update: { balance: systemClp },
      create: { companyId: systemCompanyId, assetCode: AssetCode.CLP, balance: systemClp },
    });

    const beforeClp = await prisma.treasuryAccount.findUnique({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      select: { balance: true },
    });
    const beforeUsd = await prisma.treasuryAccount.findUnique({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.USD } },
      select: { balance: true },
    });

    const approved = await approveMovementAsSystem({
      movementId: first.id,
      companyId,
      actorUserId: userId,
      skipSync: true,
    });

    const movement = await prisma.treasuryMovement.findUnique({
      where: { id: first.id },
      select: {
        status: true,
        executedAt: true,
        executedBaseAmount: true,
        executedQuoteAmount: true,
        executedQuoteCode: true,
        executedSource: true,
        internalReason: true,
        externalOrderId: true,
      },
    });

    const afterClp = await prisma.treasuryAccount.findUnique({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      select: { balance: true },
    });
    const afterUsd = await prisma.treasuryAccount.findUnique({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.USD } },
      select: { balance: true },
    });

    const estClp = amount.mul(price);
    const expectedClp = new Prisma.Decimal(beforeClp?.balance ?? 0).plus(estClp);
    const expectedUsd = new Prisma.Decimal(beforeUsd?.balance ?? 0).minus(totalSellBase);

    const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

    checks.push({
      name: "idempotency_dedup",
      ok: Boolean(found?.id && found.id === first.id),
      detail: `found=${found?.id ?? "null"} first=${first.id} dupErr=${duplicateError}`,
    });

    if (mode === "internal") {
      checks.push({
        name: "status_approved",
        ok: movement?.status === TreasuryMovementStatus.APPROVED,
        detail: `status=${movement?.status}`,
      });
      checks.push({
        name: "executed_fields",
        ok: Boolean(
          movement?.executedAt &&
            movement.executedBaseAmount &&
            movement.executedQuoteAmount &&
            movement.executedQuoteCode === AssetCode.CLP &&
            movement.executedSource
        ),
        detail: `executedAt=${movement?.executedAt} source=${movement?.executedSource}`,
      });
      checks.push({
        name: "balances_updated",
        ok:
          afterClp?.balance?.toString() === expectedClp.toString() &&
          afterUsd?.balance?.toString() === expectedUsd.toString(),
        detail: `afterCLP=${afterClp?.balance?.toString?.()} expectedCLP=${expectedClp.toString()} afterUSD=${afterUsd?.balance?.toString?.()} expectedUSD=${expectedUsd.toString()}`,
      });
    } else {
      if (hasBudaKeys) {
        checks.push({
          name: "status_processing",
          ok: movement?.status === TreasuryMovementStatus.PROCESSING,
          detail: `status=${movement?.status}`,
        });
        checks.push({
          name: "external_order",
          ok: Boolean(movement?.externalOrderId),
          detail: `externalOrderId=${movement?.externalOrderId ?? "null"}`,
        });
        checks.push({
          name: "balances_updated",
          ok:
            afterClp?.balance?.toString() === expectedClp.toString() &&
            afterUsd?.balance?.toString() === expectedUsd.toString(),
          detail: `afterCLP=${afterClp?.balance?.toString?.()} expectedCLP=${expectedClp.toString()} afterUSD=${afterUsd?.balance?.toString?.()} expectedUSD=${expectedUsd.toString()}`,
        });
      } else {
        checks.push({
          name: "status_pending_no_keys",
          ok: movement?.status === TreasuryMovementStatus.PENDING,
          detail: `status=${movement?.status} reason=${movement?.internalReason ?? ""}`,
        });
        checks.push({
          name: "balances_unchanged",
          ok:
            afterClp?.balance?.toString() === (beforeClp?.balance?.toString?.() ?? "0") &&
            afterUsd?.balance?.toString() === (beforeUsd?.balance?.toString?.() ?? "0"),
          detail: `afterCLP=${afterClp?.balance?.toString?.()} beforeCLP=${beforeClp?.balance?.toString?.()} afterUSD=${afterUsd?.balance?.toString?.()} beforeUSD=${beforeUsd?.balance?.toString?.()}`,
        });
      }
    }

    const failed = checks.filter((c) => !c.ok);
    for (const check of checks) {
      console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name} ${check.detail ? `| ${check.detail}` : ""}`);
    }

    if (failed.length) {
      console.log("SMOKE RESULT: FAIL");
      console.log("approve_result", approved);
      process.exitCode = 1;
    } else {
      console.log("SMOKE RESULT: PASS");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
