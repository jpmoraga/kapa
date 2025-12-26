import { Prisma, AssetCode } from "@prisma/client";
import { budaGetBalances } from "@/lib/buda";
import { ensureSystemWallet } from "@/lib/systemWallet";

export async function resetLedgerFromBuda(tx: Prisma.TransactionClient) {
  // 1) leer saldos reales desde Buda
  const { byCurrency } = await budaGetBalances();

  const budaClp = new Prisma.Decimal(byCurrency["CLP"] ?? "0");
  const budaBtc = new Prisma.Decimal(byCurrency["BTC"] ?? "0");
  const budaUsd = new Prisma.Decimal(byCurrency["USDT"] ?? "0");

  // 2) asegurar system wallet
  const { companyId: systemCompanyId } = await ensureSystemWallet(tx);

  // 3) poner en 0 TODAS las cuentas excepto system
  await tx.treasuryAccount.updateMany({
    where: {
      companyId: { not: systemCompanyId },
    },
    data: { balance: new Prisma.Decimal(0) },
  });

  // 4) setear system wallet = Buda
  const upsert = async (assetCode: AssetCode, balance: Prisma.Decimal) =>
    tx.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId: systemCompanyId, assetCode } },
      update: { balance },
      create: { companyId: systemCompanyId, assetCode, balance },
    });

  await upsert(AssetCode.CLP, budaClp);
  await upsert(AssetCode.BTC, budaBtc);
  await upsert(AssetCode.USD, budaUsd);

  return {
    system: {
      clp: budaClp.toString(),
      btc: budaBtc.toString(),
      usd: budaUsd.toString(),
    },
  };
}