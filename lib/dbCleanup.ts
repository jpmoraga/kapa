import { AssetCode, InternalMovementReason, InternalMovementState, Prisma, PrismaClient, TreasuryMovementStatus } from "@prisma/client";
import { computeTradeFee, getTradeFeePercent } from "@/lib/fees";

type BalanceMap = Record<AssetCode, Prisma.Decimal>;

function dec(x: any, fallback = "0") {
  try {
    return new Prisma.Decimal(String(x ?? fallback));
  } catch {
    return new Prisma.Decimal(fallback);
  }
}

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
  const feeCode =
    (m.executedFeeCode as AssetCode | null) ??
    (asset === AssetCode.CLP ? AssetCode.CLP : type === "deposit" ? AssetCode.CLP : asset);

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

export async function recomputeBalancesForCompanies(prisma: PrismaClient, companyIds: string[]) {
  const uniqueCompanyIds = Array.from(new Set(companyIds.filter(Boolean)));
  if (!uniqueCompanyIds.length) return 0;

  const systemCompany = await prisma.company.findFirst({
    where: { name: "__SYSTEM_WALLET__" },
    select: { id: true },
  });

  let updated = 0;
  for (const companyId of uniqueCompanyIds) {
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
    for (const m of movements) applyMovement(balances, m);

    await prisma.$transaction(async (tx) => {
      for (const asset of Object.values(AssetCode)) {
        await tx.treasuryAccount.upsert({
          where: { companyId_assetCode: { companyId, assetCode: asset } },
          update: { balance: balances[asset] },
          create: { companyId, assetCode: asset, balance: balances[asset] },
        });
      }
    });

    updated += 1;
  }

  return updated;
}

async function deleteQaUser(prisma: PrismaClient, userId: string) {
  const memberships = await prisma.companyUser.findMany({
    where: { userId },
    select: { companyId: true },
  });

  const personalCompanies = await prisma.company.findMany({
    where: { personalOwnerId: userId },
    select: { id: true, personalOwnerId: true },
  });

  const companyIds = new Set<string>();
  memberships.forEach((m) => companyIds.add(m.companyId));
  personalCompanies.forEach((c) => companyIds.add(c.id));

  const companyMemberCounts = await prisma.companyUser.groupBy({
    by: ["companyId"],
    where: { companyId: { in: Array.from(companyIds) } },
    _count: { companyId: true },
  });

  const companiesToDelete = personalCompanies
    .filter((c) => {
      const countRow = companyMemberCounts.find((x) => x.companyId === c.id);
      const memberCount = countRow?._count?.companyId ?? 0;
      return memberCount <= 1;
    })
    .map((c) => c.id);

  const companiesToKeep = personalCompanies.filter((c) => !companiesToDelete.includes(c.id));

  await prisma.$transaction(async (tx) => {
    for (const c of companiesToKeep) {
      await tx.company.update({
        where: { id: c.id },
        data: { personalOwnerId: null },
      });
    }

    await tx.depositSlip.deleteMany({ where: { userId } });
    await tx.session.deleteMany({ where: { userId } });
    await tx.bankAccount.deleteMany({ where: { userId } });
    await tx.personProfile.deleteMany({ where: { userId } });
    await tx.userOnboarding.deleteMany({ where: { userId } });
    await tx.emailVerificationToken.deleteMany({ where: { userId } });

    await tx.treasuryMovement.updateMany({
      where: { approvedByUserId: userId },
      data: { approvedByUserId: null },
    });

    await tx.treasuryMovement.updateMany({
      where: { createdByUserId: userId },
      data: { createdByUserId: null },
    });

    await tx.companyUser.deleteMany({ where: { userId } });

    if (companiesToDelete.length) {
      await tx.treasuryAccount.deleteMany({ where: { companyId: { in: companiesToDelete } } });
      await tx.treasuryMovement.deleteMany({ where: { companyId: { in: companiesToDelete } } });
      await tx.company.deleteMany({ where: { id: { in: companiesToDelete } } });
    }

    await tx.user.delete({ where: { id: userId } });
  });

  return Array.from(companyIds);
}

export async function runDbCleanup(
  prisma: PrismaClient,
  opts: { qaEmailDomain?: string | null } = {}
) {
  const now = new Date();
  const stuckBefore = new Date(now.getTime() - 15 * 60 * 1000);
  const pendingBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const stuck = await prisma.treasuryMovement.findMany({
    where: {
      status: TreasuryMovementStatus.PROCESSING,
      createdAt: { lt: stuckBefore },
    },
    select: { id: true, companyId: true },
  });

  const pendingOld = await prisma.treasuryMovement.findMany({
    where: {
      status: TreasuryMovementStatus.PENDING,
      createdAt: { lt: pendingBefore },
    },
    select: { id: true, companyId: true },
  });

  const affectedCompanyIds = new Set<string>();
  stuck.forEach((m) => affectedCompanyIds.add(m.companyId));
  pendingOld.forEach((m) => affectedCompanyIds.add(m.companyId));

  if (stuck.length) {
    await prisma.treasuryMovement.updateMany({
      where: { id: { in: stuck.map((m) => m.id) } },
      data: {
        internalReason: InternalMovementReason.UNKNOWN,
        internalState: InternalMovementState.FAILED_TEMPORARY,
        lastError: "cleanup: stuck processing",
      },
    });
  }

  if (pendingOld.length) {
    await prisma.treasuryMovement.updateMany({
      where: { id: { in: pendingOld.map((m) => m.id) } },
      data: {
        internalReason: InternalMovementReason.UNKNOWN,
        internalState: InternalMovementState.FAILED_TEMPORARY,
        lastError: "cleanup: stale pending",
      },
    });
  }

  let deletedQaUsers = 0;
  const qaEmailDomain = opts.qaEmailDomain?.trim().toLowerCase();
  if (qaEmailDomain) {
    const suffix = qaEmailDomain.startsWith("@") ? qaEmailDomain : `@${qaEmailDomain}`;
    const users = await prisma.user.findMany({
      where: { email: { endsWith: suffix, mode: "insensitive" } },
      select: { id: true },
    });

    for (const u of users) {
      const companies = await deleteQaUser(prisma, u.id);
      companies.forEach((id) => affectedCompanyIds.add(id));
    }

    deletedQaUsers = users.length;
  }

  const recomputedCompanies = await recomputeBalancesForCompanies(
    prisma,
    Array.from(affectedCompanyIds)
  );

  return {
    processedStuck: stuck.length,
    pendingOld: pendingOld.length,
    deletedQaUsers,
    recomputedCompanies,
  };
}
