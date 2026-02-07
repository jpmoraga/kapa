import { Prisma } from "@prisma/client";
import { syncSystemWalletFromBudaBalances } from "@/lib/syncSystemWallet";

export async function resetLedgerFromBuda(
  tx: Prisma.TransactionClient,
  balances: { byCurrency: Record<string, string>; raw?: any }
) {
  // SystemWallet = buda_balance(asset) - sum(client balances)
  // Usa solo Buda + TreasuryAccount (no movimientos).
  return syncSystemWalletFromBudaBalances(tx, balances);
}
