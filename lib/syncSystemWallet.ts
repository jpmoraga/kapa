import { Prisma, AssetCode, InternalMovementReason, InternalMovementState, TreasuryMovementStatus } from "@prisma/client";
import { budaGetBalances } from "@/lib/buda";
import { ensureSystemWallet } from "@/lib/systemWallet";
import { prisma } from "@/lib/prisma";

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
  //    SystemWallet = buda_balance(asset) - sum(client balances)
  const sums = await tx.treasuryAccount.groupBy({
    by: ["assetCode"],
    where: {
      companyId: { not: systemCompanyId },
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

export async function syncSystemWalletAndRetry() {
  const snapshot = await prisma.$transaction(async (tx) => syncSystemWalletFromBuda(tx));
  await retryPendingLiquidityTrades();
  return snapshot;
}

async function retryPendingLiquidityTrades() {
  const pendings = await prisma.treasuryMovement.findMany({
    where: {
      status: TreasuryMovementStatus.PENDING,
      internalReason: InternalMovementReason.INSUFFICIENT_LIQUIDITY,
      internalState: InternalMovementState.WAITING_LIQUIDITY,
      assetCode: { in: [AssetCode.BTC, AssetCode.USD] },
      OR: [{ type: "deposit" }, { type: "withdraw" }],
    },
    select: { id: true, companyId: true, createdByUserId: true },
    take: 25,
  });

  if (!pendings.length) return;

  const mod = await import("@/lib/treasury/approveMovement");

  for (const m of pendings) {
    const claimed = await prisma.treasuryMovement.updateMany({
      where: {
        id: m.id,
        status: TreasuryMovementStatus.PENDING,
        internalState: InternalMovementState.WAITING_LIQUIDITY,
      },
      data: { internalState: InternalMovementState.RETRYING_BUDA },
    });

    if (!claimed.count) continue;

    try {
      await mod.approveMovementAsSystem({
        movementId: m.id,
        companyId: m.companyId,
        actorUserId: m.createdByUserId ?? null,
        skipSync: true,
      });
    } catch (e: any) {
      await prisma.treasuryMovement.update({
        where: { id: m.id },
        data: {
          internalState: InternalMovementState.WAITING_LIQUIDITY,
          lastError: String(e?.message ?? "RETRY_ERROR"),
        },
      });
    }
  }
}
