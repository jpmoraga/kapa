import { Prisma, AssetCode } from "@prisma/client";

export async function ensureSystemWallet(tx: Prisma.TransactionClient) {
  // 1) crea Company __SYSTEM_WALLET__ si no existe
  const existing = await tx.company.findFirst({
    where: { name: "__SYSTEM_WALLET__" },
    select: { id: true },
  });

  const companyId =
    existing?.id ??
    (
      await tx.company.create({
        data: { name: "__SYSTEM_WALLET__", kind: "BUSINESS" as any },
        select: { id: true },
      })
    ).id;

  // 2) asegura cuentas por asset
  await tx.treasuryAccount.upsert({
    where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
    update: {},
    create: { companyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
  });

  await tx.treasuryAccount.upsert({
    where: { companyId_assetCode: { companyId, assetCode: AssetCode.BTC } },
    update: {},
    create: { companyId, assetCode: AssetCode.BTC, balance: new Prisma.Decimal(0) },
  });

  await tx.treasuryAccount.upsert({
    where: { companyId_assetCode: { companyId, assetCode: AssetCode.USD } },
    update: {},
    create: { companyId, assetCode: AssetCode.USD, balance: new Prisma.Decimal(0) },
  });

  return { companyId };
}