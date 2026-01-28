import { Prisma } from "@prisma/client";
import { syncSystemWalletFromBuda } from "@/lib/syncSystemWallet";

export async function resetLedgerFromBuda(tx: Prisma.TransactionClient) {
  // SystemWallet = buda_balance(asset) - sum(client balances)
  // Usa solo Buda + TreasuryAccount (no movimientos).
  return syncSystemWalletFromBuda(tx);
}
