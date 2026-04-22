import { Prisma, TreasuryMovementStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminHubSummary = {
  pendingMovements: number;
  processingMovements: number;
  pendingCompanies: number;
  totalUsers: number;
  totalCompanies: number;
  latestSystemSnapshotAt: string | null;
  latestSystemSnapshotCreatedAt: string | null;
  latestSystemBalances: {
    CLP: string | null;
    BTC: string | null;
    USD: string | null;
  } | null;
};

function readJsonObject(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, Prisma.JsonValue>;
}

function readSnapshotBalance(value: Prisma.JsonValue | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

export async function getAdminHubSummary(): Promise<AdminHubSummary> {
  const [pendingMovements, processingMovements, pendingCompanies, totalUsers, totalCompanies, latestSnapshot] =
    await Promise.all([
      prisma.treasuryMovement.count({
        where: { status: TreasuryMovementStatus.PENDING },
      }),
      prisma.treasuryMovement.count({
        where: { status: TreasuryMovementStatus.PROCESSING },
      }),
      prisma.companyReview.count({
        where: { status: "PENDING" },
      }),
      prisma.user.count(),
      prisma.company.count({
        where: { name: { not: "__SYSTEM_WALLET__" } },
      }),
      prisma.systemWalletSnapshot.findFirst({
        orderBy: { createdAt: "desc" },
        select: { at: true, createdAt: true, payload: true },
      }),
    ]);

  const payload = readJsonObject(latestSnapshot?.payload);
  const systemSection = readJsonObject(payload?.system);

  return {
    pendingMovements,
    processingMovements,
    pendingCompanies,
    totalUsers,
    totalCompanies,
    latestSystemSnapshotAt: latestSnapshot?.at?.toISOString() ?? null,
    latestSystemSnapshotCreatedAt: latestSnapshot?.createdAt?.toISOString() ?? null,
    latestSystemBalances: systemSection
      ? {
          CLP: readSnapshotBalance(systemSection.clp),
          BTC: readSnapshotBalance(systemSection.btc),
          USD: readSnapshotBalance(systemSection.usd),
        }
      : null,
  };
}
