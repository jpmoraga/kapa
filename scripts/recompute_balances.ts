// scripts/recompute_balances.ts
// Dry run (default):
//   npx tsx -r dotenv/config scripts/recompute_balances.ts --companyId <id>
// Execute:
//   npx tsx -r dotenv/config scripts/recompute_balances.ts --companyId <id> --execute

import dotenv from "dotenv";
import path from "path";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";
import { getScriptPrisma } from "./_prisma";
import { syncSystemWalletFromBudaBalances } from "../lib/syncSystemWallet";
import { budaGetBalances } from "../lib/buda";
import { getTradeFeePercent, computeTradeFee } from "../lib/fees";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const args = process.argv.slice(2);
const execute = args.includes("--execute");

function getArg(name: string) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const companyIdArg = getArg("--companyId");

function dec(x: any, fallback = "0") {
  try {
    return new Prisma.Decimal(String(x ?? fallback));
  } catch {
    return new Prisma.Decimal(fallback);
  }
}

type BalanceMap = Record<AssetCode, Prisma.Decimal>;

function initBalances(): BalanceMap {
  return {
    BTC: new Prisma.Decimal(0),
    CLP: new Prisma.Decimal(0),
    USD: new Prisma.Decimal(0),
  };
}

function applyMovement(bal: BalanceMap, m: any) {
  const asset = m.assetCode as AssetCode;
  const type = String(m.type);
  const base = dec(m.executedBaseAmount ?? m.amount);
  const price = m.executedPrice ? dec(m.executedPrice) : null;
  const quote = m.executedQuoteAmount != null ? dec(m.executedQuoteAmount) : price ? base.mul(price) : null;
  const feeAmt = m.executedFeeAmount != null ? dec(m.executedFeeAmount) : null;
  const feeCode = (m.executedFeeCode as AssetCode | null) ?? (asset === AssetCode.CLP ? AssetCode.CLP : type === "deposit" ? AssetCode.CLP : asset);

  if (asset === AssetCode.CLP) {
    if (type === "withdraw") bal.CLP = bal.CLP.minus(base);
    else if (type === "deposit") bal.CLP = bal.CLP.plus(base);
    else if (type === "adjust") bal.CLP = bal.CLP.plus(base);
    return;
  }

  if (type === "deposit") {
    bal[asset] = bal[asset].plus(base);
    if (quote) {
      const fee = feeAmt ?? computeTradeFee(quote, getTradeFeePercent(asset));
      const clpDelta = feeCode === AssetCode.CLP ? quote.plus(fee) : quote;
      bal.CLP = bal.CLP.minus(clpDelta);
    }
    return;
  }

  if (type === "withdraw") {
    const fee = feeAmt ?? computeTradeFee(base, getTradeFeePercent(asset));
    const assetDelta = feeCode === asset ? base.plus(fee) : base;
    bal[asset] = bal[asset].minus(assetDelta);
    if (quote) {
      bal.CLP = bal.CLP.plus(quote);
    }
    return;
  }

  if (type === "adjust") {
    bal[asset] = bal[asset].plus(base);
  }
}

async function main() {
  const prisma = getScriptPrisma();
  try {
    const companies = companyIdArg
      ? await prisma.company.findMany({ where: { id: companyIdArg }, select: { id: true, name: true } })
      : await prisma.company.findMany({ select: { id: true, name: true } });

    const systemCompany = await prisma.company.findFirst({
      where: { name: "__SYSTEM_WALLET__" },
      select: { id: true },
    });

    for (const company of companies) {
      if (systemCompany?.id && company.id === systemCompany.id) continue;

      const movements = await prisma.treasuryMovement.findMany({
        where: { companyId: company.id, status: TreasuryMovementStatus.APPROVED },
        select: {
          id: true,
          type: true,
          assetCode: true,
          amount: true,
          executedBaseAmount: true,
          executedQuoteAmount: true,
          executedFeeAmount: true,
          executedFeeCode: true,
          executedPrice: true,
        },
      });

      const balances = initBalances();
      for (const m of movements) applyMovement(balances, m);

      console.log("company", company.id, company.name, {
        BTC: balances.BTC.toString(),
        CLP: balances.CLP.toString(),
        USD: balances.USD.toString(),
        movements: movements.length,
      });

      if (execute) {
        await prisma.$transaction(async (tx) => {
          for (const asset of Object.values(AssetCode)) {
            await tx.treasuryAccount.upsert({
              where: { companyId_assetCode: { companyId: company.id, assetCode: asset } },
              update: { balance: balances[asset] },
              create: { companyId: company.id, assetCode: asset, balance: balances[asset] },
            });
          }
        });
      }
    }

    if (execute && systemCompany) {
      try {
        const balances = await budaGetBalances();
        await prisma.$transaction(async (tx) => syncSystemWalletFromBudaBalances(tx, balances));
        console.log("system_wallet_sync: ok");
      } catch (e: any) {
        console.warn("system_wallet_sync: error", e?.message ?? e);
      }
    }

    if (systemCompany) {
      try {
        const buda = await budaGetBalances();
        const sums = await prisma.treasuryAccount.groupBy({
          by: ["assetCode"],
          where: {
            companyId: { not: systemCompany.id },
            assetCode: { in: [AssetCode.CLP, AssetCode.BTC, AssetCode.USD] },
          },
          _sum: { balance: true },
        });

        const sumClient = (a: AssetCode) => {
          const row = sums.find((x) => x.assetCode === a);
          return dec(row?._sum?.balance ?? "0");
        };

        const budaClp = dec(buda.byCurrency["CLP"] ?? "0");
        const budaBtc = dec(buda.byCurrency["BTC"] ?? "0");
        const budaUsd = dec(buda.byCurrency["USDT"] ?? buda.byCurrency["USD"] ?? "0");

        const expected = {
          CLP: Prisma.Decimal.max(budaClp.minus(sumClient(AssetCode.CLP)), new Prisma.Decimal(0)),
          BTC: Prisma.Decimal.max(budaBtc.minus(sumClient(AssetCode.BTC)), new Prisma.Decimal(0)),
          USD: Prisma.Decimal.max(budaUsd.minus(sumClient(AssetCode.USD)), new Prisma.Decimal(0)),
        };

        const actualRows = await prisma.treasuryAccount.findMany({
          where: { companyId: systemCompany.id },
          select: { assetCode: true, balance: true },
        });

        const actual: Record<AssetCode, string> = {
          CLP: "0",
          BTC: "0",
          USD: "0",
        };
        for (const r of actualRows) {
          actual[r.assetCode] = r.balance?.toString?.() ?? "0";
        }

        console.log("system_wallet_report", {
          buda: {
            CLP: budaClp.toString(),
            BTC: budaBtc.toString(),
            USD: budaUsd.toString(),
          },
          clients: {
            CLP: sumClient(AssetCode.CLP).toString(),
            BTC: sumClient(AssetCode.BTC).toString(),
            USD: sumClient(AssetCode.USD).toString(),
          },
          expected: {
            CLP: expected.CLP.toString(),
            BTC: expected.BTC.toString(),
            USD: expected.USD.toString(),
          },
          actual,
        });
      } catch (e: any) {
        console.warn("system_wallet_report_error", e?.message ?? e);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
