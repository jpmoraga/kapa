// scripts/purge_qa_user.ts
// Dry run (default):
//   npx tsx -r dotenv/config scripts/purge_qa_user.ts --email jorge.mendez.fredes@gmail.com
// Execute:
//   npx tsx -r dotenv/config scripts/purge_qa_user.ts --email jorge.mendez.fredes@gmail.com --execute
// Optional:
//   --delete-company (only if company has no other users)
//   --since YYYY-MM-DD (limit movements by createdAt)

import dotenv from "dotenv";
import path from "path";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";
import { getScriptPrisma } from "./_prisma";
import { syncSystemWalletFromBuda } from "../lib/syncSystemWallet";
import { budaGetBalances } from "../lib/buda";
import { getTradeFeePercent, computeTradeFee } from "../lib/fees";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const deleteCompany = args.includes("--delete-company");

function getArg(name: string) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const emailRaw = getArg("--email");
if (!emailRaw) {
  console.error("Missing --email");
  process.exit(1);
}

const email = emailRaw.toLowerCase().trim();
const sinceStr = getArg("--since");
const since = sinceStr ? new Date(sinceStr) : null;
if (sinceStr && Number.isNaN(since?.getTime())) {
  console.error("Invalid --since. Use YYYY-MM-DD");
  process.exit(1);
}

function parseDbInfo(urlStr: string) {
  try {
    const url = new URL(urlStr);
    return {
      host: url.host,
      database: url.pathname.replace("/", ""),
      protocol: url.protocol,
    };
  } catch {
    return { host: "unknown", database: "unknown", protocol: "unknown" };
  }
}

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

async function recomputeBalances(prisma: ReturnType<typeof getScriptPrisma>, companyIds: string[], doExecute: boolean) {
  const uniqueCompanyIds = Array.from(new Set(companyIds));
  const systemCompany = await prisma.company.findFirst({
    where: { name: "__SYSTEM_WALLET__" },
    select: { id: true },
  });

  const report: any[] = [];

  for (const companyId of uniqueCompanyIds) {
    if (!companyId) continue;
    if (systemCompany?.id && companyId === systemCompany.id) continue;

    const movements = await prisma.treasuryMovement.findMany({
      where: { companyId, status: TreasuryMovementStatus.APPROVED },
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
    for (const m of movements) {
      applyMovement(balances, m);
    }

    report.push({
      companyId,
      balances: {
        BTC: balances.BTC.toString(),
        CLP: balances.CLP.toString(),
        USD: balances.USD.toString(),
      },
      movementsCount: movements.length,
    });

    if (doExecute) {
      await prisma.$transaction(async (tx) => {
        for (const asset of Object.values(AssetCode)) {
          await tx.treasuryAccount.upsert({
            where: { companyId_assetCode: { companyId, assetCode: asset } },
            update: { balance: balances[asset] },
            create: { companyId, assetCode: asset, balance: balances[asset] },
          });
        }
      });
    }
  }

  let systemWalletUpdated = false;
  let systemWalletError: string | null = null;
  let systemWalletReport: any = null;
  if (doExecute && systemCompany) {
    try {
      await prisma.$transaction(async (tx) => syncSystemWalletFromBuda(tx));
      systemWalletUpdated = true;
    } catch (e: any) {
      systemWalletError = String(e?.message ?? "SYNC_ERROR");
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

      systemWalletReport = {
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
      };
    } catch (e: any) {
      systemWalletReport = { error: String(e?.message ?? "BUDA_ERROR") };
    }
  }

  return { report, systemWalletUpdated, systemWalletError, systemWalletReport };
}

async function main() {
  const prisma = getScriptPrisma();
  const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
  const dbInfo = parseDbInfo(datasourceUrl);

  console.log("Connected DB:", dbInfo);
  console.log("DRY_RUN:", !execute);
  console.log("Target email:", email);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        activeCompanyId: true,
      },
    });

    if (!user) {
      console.log("User not found. Nothing to do.");
      return;
    }

    const memberships = await prisma.companyUser.findMany({
      where: { userId: user.id },
      select: { companyId: true, role: true },
    });

    const personalCompanies = await prisma.company.findMany({
      where: { personalOwnerId: user.id },
      select: { id: true, name: true, personalOwnerId: true },
    });

    const companyIds = new Set<string>();
    memberships.forEach((m) => companyIds.add(m.companyId));
    personalCompanies.forEach((c) => companyIds.add(c.id));

    const companies = await prisma.company.findMany({
      where: { id: { in: Array.from(companyIds) } },
      select: { id: true, name: true, personalOwnerId: true },
    });

    const companyMemberCounts = await prisma.companyUser.groupBy({
      by: ["companyId"],
      where: { companyId: { in: Array.from(companyIds) } },
      _count: { companyId: true },
    });

    const companyPlan = companies.map((c) => {
      const countRow = companyMemberCounts.find((x) => x.companyId === c.id);
      const memberCount = countRow?._count?.companyId ?? 0;
      const canDelete = deleteCompany && memberCount <= 1;
      return { id: c.id, name: c.name, memberCount, canDelete, personalOwnerId: c.personalOwnerId };
    });

    const movementsCreated = await prisma.treasuryMovement.findMany({
      where: {
        createdByUserId: user.id,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      select: { id: true, companyId: true },
    });

    const companyIdsToDelete = companyPlan.filter((c) => c.canDelete).map((c) => c.id);
    const movementsCompanyWide = companyIdsToDelete.length
      ? await prisma.treasuryMovement.findMany({
          where: { companyId: { in: companyIdsToDelete } },
          select: { id: true, companyId: true },
        })
      : [];

    const movementIdsToDelete = new Set<string>();
    movementsCreated.forEach((m) => movementIdsToDelete.add(m.id));
    movementsCompanyWide.forEach((m) => movementIdsToDelete.add(m.id));

    const depositSlips = await prisma.depositSlip.findMany({
      where: { userId: user.id },
      select: { id: true, filePath: true },
    });
    const depositSlipCount = depositSlips.length;

    const sessionCount = await prisma.session.count({ where: { userId: user.id } });
    const bankCount = await prisma.bankAccount.count({ where: { userId: user.id } });
    const profile = await prisma.personProfile.findUnique({
      where: { userId: user.id },
      select: { idDocumentFrontPath: true, idDocumentBackPath: true },
    });
    const profileCount = profile ? 1 : 0;
    const onboardingCount = await prisma.userOnboarding.count({ where: { userId: user.id } });
    const emailTokenCount = await prisma.emailVerificationToken.count({ where: { userId: user.id } });

    const approvedByCount = await prisma.treasuryMovement.count({
      where: { approvedByUserId: user.id, id: { notIn: Array.from(movementIdsToDelete) } },
    });

    const createdByRemainingCount = await prisma.treasuryMovement.count({
      where: { createdByUserId: user.id, id: { notIn: Array.from(movementIdsToDelete) } },
    });

    console.log("Plan:");
    console.log({
      userId: user.id,
      memberships: memberships.length,
      companies: companyPlan,
      movementDeleteCount: movementIdsToDelete.size,
      depositSlipCount,
      depositSlipPaths: depositSlips.map((s) => s.filePath),
      kycPaths: [profile?.idDocumentFrontPath, profile?.idDocumentBackPath].filter(Boolean),
      sessionCount,
      bankCount,
      profileCount,
      onboardingCount,
      emailTokenCount,
      approvedByToNull: approvedByCount,
      createdByToNull: createdByRemainingCount,
      deleteCompanyFlag: deleteCompany,
    });

    if (!execute) return;

    const affectedCompanies = new Set<string>();
    movementsCreated.forEach((m) => affectedCompanies.add(m.companyId));
    companyIdsToDelete.forEach((id) => affectedCompanies.add(id));
    memberships.forEach((m) => affectedCompanies.add(m.companyId));

    await prisma.$transaction(async (tx) => {
      // Avoid cascading delete of company when personalOwnerId is set but company has other members.
      const companiesToKeep = companyPlan.filter((c) => !c.canDelete && c.personalOwnerId === user.id);
      for (const c of companiesToKeep) {
        await tx.company.update({
          where: { id: c.id },
          data: { personalOwnerId: null },
        });
      }

      if (movementIdsToDelete.size) {
        await tx.treasuryMovement.deleteMany({
          where: { id: { in: Array.from(movementIdsToDelete) } },
        });
      }

      if (depositSlipCount) {
        await tx.depositSlip.deleteMany({
          where: { userId: user.id },
        });
      }

      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.bankAccount.deleteMany({ where: { userId: user.id } });
      await tx.personProfile.deleteMany({ where: { userId: user.id } });
      await tx.userOnboarding.deleteMany({ where: { userId: user.id } });
      await tx.emailVerificationToken.deleteMany({ where: { userId: user.id } });

      await tx.treasuryMovement.updateMany({
        where: { approvedByUserId: user.id },
        data: { approvedByUserId: null },
      });

      await tx.treasuryMovement.updateMany({
        where: { createdByUserId: user.id },
        data: { createdByUserId: null },
      });

      await tx.companyUser.deleteMany({ where: { userId: user.id } });

      if (companyIdsToDelete.length) {
        await tx.treasuryAccount.deleteMany({ where: { companyId: { in: companyIdsToDelete } } });
        await tx.treasuryMovement.deleteMany({ where: { companyId: { in: companyIdsToDelete } } });
        await tx.company.deleteMany({ where: { id: { in: companyIdsToDelete } } });
      }

      await tx.user.delete({ where: { id: user.id } });
    });

    console.log("Execution summary: purge completed.");

    const recompute = await recomputeBalances(prisma, Array.from(affectedCompanies), execute);
    console.log("Recompute report:", recompute.report);
    console.log("System wallet updated:", recompute.systemWalletUpdated);
    if (recompute.systemWalletError) {
      console.warn("System wallet sync error:", recompute.systemWalletError);
    }
    if (recompute.systemWalletReport) {
      console.log("System wallet report:", recompute.systemWalletReport);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
