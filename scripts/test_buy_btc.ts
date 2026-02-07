// scripts/test_buy_btc.ts
// Dry run (default):
//   npx tsx -r dotenv/config scripts/test_buy_btc.ts --companyId <id> --userId <id>
// Execute:
//   npx tsx -r dotenv/config scripts/test_buy_btc.ts --execute --companyId <id> --userId <id>
// Options:
//   --amountBtc 0.001 --priceClp <required> --mode internal|external

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
const amountStr = getArg("--amountBtc") ?? "0.001";
const priceStr = getArg("--priceClp");
const mode = (getArg("--mode") ?? "internal").toLowerCase();

if (!companyId || !userId) {
  console.error("Missing --companyId or --userId");
  process.exit(1);
}

if (!priceStr) {
  console.error("Missing --priceClp (required).");
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

    if (!execute) {
      console.log("[DRY RUN] Would create BTC buy + approve and validate balances.");
      console.log("companyId", companyId);
      console.log("userId", userId);
      console.log("amountBtc", amount.toString());
      console.log("priceClp", price.toString());
      console.log("mode", mode);
      console.log("hasBudaKeys", hasBudaKeys);
      return;
    }

    const { companyId: systemCompanyId } = await prisma.$transaction(async (tx) =>
      ensureSystemWallet(tx)
    );

    await prisma.priceSnapshot.create({
      data: {
        assetCode: AssetCode.BTC,
        quoteCode: AssetCode.CLP,
        price,
        source: "manual:smoke_buy_btc",
      },
    });

    const startingClp = new Prisma.Decimal("10000000");
    const startingBtc = new Prisma.Decimal("0");
    const systemBtc = mode === "internal" ? amount.mul(2) : new Prisma.Decimal("0");
    const systemClp = mode === "external" ? new Prisma.Decimal("100000000") : new Prisma.Decimal("0");

    await prisma.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      update: { balance: startingClp },
      create: { companyId, assetCode: AssetCode.CLP, balance: startingClp },
    });

    await prisma.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.BTC } },
      update: { balance: startingBtc },
      create: { companyId, assetCode: AssetCode.BTC, balance: startingBtc },
    });

    await prisma.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.BTC } },
      update: { balance: systemBtc },
      create: { companyId: systemCompanyId, assetCode: AssetCode.BTC, balance: systemBtc },
    });

    await prisma.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
      update: { balance: systemClp },
      create: { companyId: systemCompanyId, assetCode: AssetCode.CLP, balance: systemClp },
    });

    const idempotencyKey = `smoke-buy-btc-${Date.now()}`;
    const first = await prisma.treasuryMovement.create({
      data: {
        companyId,
        assetCode: AssetCode.BTC,
        type: "deposit",
        amount,
        status: TreasuryMovementStatus.PENDING,
        createdByUserId: userId,
        note: "smoke buy btc",
        internalNote: "smoke_buy_btc",
        idempotencyKey,
      },
      select: { id: true },
    });

    let duplicateError = null;
    try {
      await prisma.treasuryMovement.create({
        data: {
          companyId,
          assetCode: AssetCode.BTC,
          type: "deposit",
          amount,
          status: TreasuryMovementStatus.PENDING,
          createdByUserId: userId,
          note: "smoke buy btc duplicate",
          internalNote: "smoke_buy_btc_duplicate",
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

    const beforeClp = await prisma.treasuryAccount.findUnique({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      select: { balance: true },
    });
    const beforeBtc = await prisma.treasuryAccount.findUnique({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.BTC } },
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
    const afterBtc = await prisma.treasuryAccount.findUnique({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.BTC } },
      select: { balance: true },
    });

    const feePct = getTradeFeePercent(AssetCode.BTC);
    const estClp = amount.mul(price);
    const feeOnQuote = computeTradeFee(estClp, feePct);
    const totalBuyClp = estClp.plus(feeOnQuote);

    const expectedClp = new Prisma.Decimal(beforeClp?.balance ?? 0).minus(totalBuyClp);
    const expectedBtc = new Prisma.Decimal(beforeBtc?.balance ?? 0).plus(amount);

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
          afterBtc?.balance?.toString() === expectedBtc.toString(),
        detail: `afterCLP=${afterClp?.balance?.toString?.()} expectedCLP=${expectedClp.toString()} afterBTC=${afterBtc?.balance?.toString?.()} expectedBTC=${expectedBtc.toString()}`,
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
            afterBtc?.balance?.toString() === expectedBtc.toString(),
          detail: `afterCLP=${afterClp?.balance?.toString?.()} expectedCLP=${expectedClp.toString()} afterBTC=${afterBtc?.balance?.toString?.()} expectedBTC=${expectedBtc.toString()}`,
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
            afterBtc?.balance?.toString() === (beforeBtc?.balance?.toString?.() ?? "0"),
          detail: `afterCLP=${afterClp?.balance?.toString?.()} beforeCLP=${beforeClp?.balance?.toString?.()} afterBTC=${afterBtc?.balance?.toString?.()} beforeBTC=${beforeBtc?.balance?.toString?.()}`,
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
