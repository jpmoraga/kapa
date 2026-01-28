# FLOWS

Sources:
- app/api/treasury/movements/route.ts
- app/api/webhooks/twilio/whatsapp/route.ts
- app/api/treasury/movements/[id]/approve/route.ts
- app/api/treasury/movements/[id]/reconcile/route.ts
- app/api/treasury/movements/[id]/receipt/route.ts
- app/api/treasury/movements/[id]/paid/route.ts
- app/api/treasury/sync-wallet/route.ts
- app/api/cron/retry-pending/route.ts
- lib/treasury/approveMovement.ts
- lib/syncSystemWallet.ts
- lib/fees.ts
- app/api/onboarding/deposit-slip/route.ts
- app/api/internal/deposit-slip/*

## Deposit with receipt (CLP) via TreasuryMovement

1) UI submits deposit (multipart) with receipt:
- UI: app/treasury/_components/MovementForm.tsx (POST /api/treasury/movements)
- CLP deposit without receipt is rejected in app/api/treasury/movements/route.ts

2) Create movement + store receipt + create DepositSlip:
- app/api/treasury/movements/route.ts
  - creates TreasuryMovement (status=PENDING)
  - saveReceiptLocal -> public/uploads/treasury/<companyId>/<movementId>.<ext>
  - uploadReceiptToSupabase -> bucket deposit-slips
  - create DepositSlip with notes "movementId:<id>"

3) Auto-approve movement (CLP):
- app/api/treasury/movements/route.ts -> approveMovementAsSystem(..., skipSync: true)
- lib/treasury/approveMovement.ts updates TreasuryAccount and marks movement APPROVED

4) Notify admin via WhatsApp (best effort):
- app/api/treasury/movements/route.ts -> sendDepositSlipWhatsApp()
- lib/whatsapp.ts sends message and logs
- On send failure: route updates TreasuryMovement.lastError, nextRetryAt (+10m), retryCount (cap 5)

5) Admin approval via WhatsApp (optional override/manual):
- app/api/webhooks/twilio/whatsapp/route.ts
  - command "aprobar <slipId> [monto]" updates DepositSlip and TreasuryMovement
  - credits TreasuryAccount CLP and sets movement APPROVED

## Deposit slip only (onboarding flow)

1) Upload slip only (no movement):
- app/api/onboarding/deposit-slip/route.ts
  - upload to bucket deposit-slips
  - create DepositSlip (status=received)
  - sendDepositSlipWhatsApp()

2) Manual or internal processing:
- app/api/internal/deposit-slip/process/route.ts -> ocrStatus=pending_manual
- app/api/internal/deposit-slip/set-manual/route.ts -> set parsedAmountClp + status
- app/api/internal/deposit-slip/reset/route.ts -> reset slip to received

## Withdraw CLP

1) User requests withdraw:
- app/api/treasury/movements/route.ts (type=withdraw, assetCode=CLP)
  - requires BankAccount
  - checks CLP TreasuryAccount balance
  - subtracts balance immediately (reserve)
  - sets movement status=PROCESSING, executedQuoteAmount
  - sends WhatsApp to admin (notifyAdminWhatsApp)

2) Admin confirms payout:
- app/api/treasury/movements/[id]/paid/route.ts
  - marks paidOut=true, paidOutAt, status=APPROVED

## Trade buy/sell (BTC/USD vs CLP)

1) Create movement:
- app/api/treasury/movements/route.ts
  - type=deposit (buy) or type=withdraw (sell)
  - assetCode BTC or USD
  - movement status=PENDING

2) Auto-approve (system wallet or Buda order):
- lib/treasury/approveMovement.ts
  - gets price snapshot (PriceSnapshot)
  - computes fee via lib/fees.ts
  - checks client TreasuryAccount balances
  - tries internal system wallet (TreasuryAccount for __SYSTEM_WALLET__)
    - if possible: updates balances and marks APPROVED
  - else: creates Buda market order
    - if error: movement stays PENDING with internalReason
    - if order created: movement PROCESSING with externalOrderId

3) Reconcile Buda orders:
- app/api/treasury/movements/[id]/reconcile/route.ts
  - calls budaGetOrder
  - updates executedPrice / executedBaseAmount / executedQuoteAmount / executedFeeAmount
  - adjusts TreasuryAccount deltas and marks APPROVED

4) Receipt endpoint:
- app/api/treasury/movements/[id]/receipt/route.ts
  - returns executed amounts if available, otherwise estimates

## Balance source of truth

- Balances are stored in TreasuryAccount, not derived from summing TreasuryMovement.
- Evidence:
  - app/api/treasury/summary/route.ts reads TreasuryAccount balances.
  - lib/treasury/approveMovement.ts updates TreasuryAccount on approve/execution.

## System wallet sync (source of truth)

Definition: system_wallet = buda_balance(asset) - SUM(client TreasuryAccount balances)

Evidence (lib/syncSystemWallet.ts):
```
const sums = await tx.treasuryAccount.groupBy({
  by: ["assetCode"],
  where: {
    companyId: { not: systemCompanyId },
    assetCode: { in: [AssetCode.CLP, AssetCode.BTC, AssetCode.USD] },
  },
  _sum: { balance: true },
});
const sysClp = Prisma.Decimal.max(budaClp.minus(clientsClp), new Prisma.Decimal(0));
```

Sync entry points:
- app/api/treasury/sync-wallet/route.ts
- app/api/cron/retry-pending/route.ts (calls syncSystemWalletAndRetry)

## Retry logic (insufficient liquidity)

- lib/syncSystemWallet.ts: retryPendingLiquidityTrades()
  - selects PENDING movements with internalReason=INSUFFICIENT_LIQUIDITY
  - updates internalState to RETRYING_BUDA, then re-calls approveMovementAsSystem
- app/api/cron/retry-pending/route.ts triggers syncSystemWalletAndRetry and a batch approve

## Market trade ingestion (chart data)

- app/api/market/line/route.ts
  - best-effort fetch from Buda trades
  - inserts MarketTrade (skipDuplicates)
  - returns points from DB
- app/api/market/sync-trades/route.ts
  - fetches Buda trades and inserts MarketTrade
- app/api/cron/sync-trades/route.ts
  - cron proxy to call /api/market/sync-trades

## WhatsApp failure behavior

- sendDepositSlipWhatsApp() returns ok=false on error; caller logs and updates TreasuryMovement error fields.
- Withdraw WhatsApp notify is best-effort (errors only logged).
- Twilio inbound webhook always returns 200 to Twilio even on errors.
