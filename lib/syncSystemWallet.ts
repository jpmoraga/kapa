import { Prisma, AssetCode } from "@prisma/client";
import { budaGetBalances } from "@/lib/buda";
import { ensureSystemWallet } from "@/lib/systemWallet";

/**
 * ✅ Sync "System Wallet" desde Buda
 * SystemWallet = (saldo real en Buda) - (suma de saldos de clientes)
 *
 * Esto mantiene el "remanente" como caja de la empresa.
 */
export async function syncSystemWalletFromBuda(tx: Prisma.TransactionClient) {
  // 0) asegurar company + cuentas
  const { companyId: systemCompanyId } = await ensureSystemWallet(tx);

  // 1) leer saldos en Buda
  const { byCurrency, raw } = await budaGetBalances();

  // En Buda "USD" en realidad suele ser "USDT".
  const budaClp = new Prisma.Decimal(byCurrency["CLP"] ?? "0");
  const budaBtc = new Prisma.Decimal(byCurrency["BTC"] ?? "0");
  const budaUsdt = new Prisma.Decimal(byCurrency["USDT"] ?? byCurrency["USD"] ?? "0");

  // 2) sumar saldos de TODOS los clientes (todas las companies menos __SYSTEM_WALLET__)
  //    (si tienes companies "business" que también son clientes, igual cuentan como clientes)
  const sums = await tx.treasuryAccount.groupBy({
    by: ["assetCode"],
    where: {
      company: { name: { not: "__SYSTEM_WALLET__" } },
      assetCode: { in: [AssetCode.CLP, AssetCode.BTC, AssetCode.USD] },
    },
    _sum: { balance: true },
  });

  const sumClient = (a: AssetCode) => {
    const row = sums.find((x) => x.assetCode === a);
    return new Prisma.Decimal((row?._sum?.balance as any) ?? 0);
  };

  const clientsClp = sumClient(AssetCode.CLP);
  const clientsBtc = sumClient(AssetCode.BTC);
  const clientsUsd = sumClient(AssetCode.USD);

  // 3) system = buda - clients
  //    Si da negativo, lo clamp a 0 (MVP) para no romper compras.
  const sysClp = Prisma.Decimal.max(budaClp.minus(clientsClp), new Prisma.Decimal(0));
  const sysBtc = Prisma.Decimal.max(budaBtc.minus(clientsBtc), new Prisma.Decimal(0));
  const sysUsd = Prisma.Decimal.max(budaUsdt.minus(clientsUsd), new Prisma.Decimal(0));

  // 4) escribir en DB (cuentas del system wallet)
  await tx.treasuryAccount.update({
    where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
    data: { balance: sysClp },
  });
  await tx.treasuryAccount.update({
    where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.BTC } },
    data: { balance: sysBtc },
  });
  await tx.treasuryAccount.update({
    where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.USD } },
    data: { balance: sysUsd },
  });

  return {
    systemCompanyId,
    buda: { clp: budaClp, btc: budaBtc, usd: budaUsdt },
    clients: { clp: clientsClp, btc: clientsBtc, usd: clientsUsd },
    system: { clp: sysClp, btc: sysBtc, usd: sysUsd },
    raw, // por si quieres log
  };
}