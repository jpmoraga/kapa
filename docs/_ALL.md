# SYSTEM_MAP

## Index
1) Summary
2) Repo map
3) Endpoints (Next.js API)
4) Jobs / cron
5) Scripts
6) Production checklist
7) References to other docs
8) NO ENCONTRADO / gaps

## Summary
This document maps repo structure, API endpoints, jobs/cron, and scripts. Detailed DB, storage, env, and flows live in:
- docs/DB_SCHEMA.md
- docs/STORAGE_MAP.md
- docs/ENV_MAP.md
- docs/FLOWS.md

## Repo map
Tree (max depth 5, excludes node_modules/.next/dist/build):

```
/Users/juanpablomoraga/Desktop/TesoreriaBTC/kapa
├── .env
├── .env.example
├── .env.local
├── .gitignore
├── ENV_AUDIT.md
├── README.md
├── _archive
│   └── DashboardBonito.ui.tsx.bak
├── app
│   ├── api
│   │   ├── _debug
│   │   │   └── buda
│   │   │       └── route.ts
│   │   ├── auth
│   │   │   ├── [...nextauth]
│   │   │   │   └── route.ts
│   │   │   ├── active-company
│   │   │   │   └── route.ts
│   │   │   ├── register
│   │   │   │   └── route.ts
│   │   │   ├── resend-verification
│   │   │   │   └── route.ts
│   │   │   └── verify-email
│   │   │       └── route.ts
│   │   ├── buda
│   │   │   ├── orders
│   │   │   │   └── route.ts
│   │   │   ├── quote-buy
│   │   │   │   └── route.ts
│   │   │   └── ticker
│   │   │       └── route.ts
│   │   ├── company
│   │   │   └── activate
│   │   │       └── route.ts
│   │   ├── cron
│   │   │   ├── retry-pending
│   │   │   │   └── route.ts
│   │   │   └── sync-trades
│   │   │       └── route.ts
│   │   ├── debug
│   │   │   └── email
│   │   │       └── route.ts
│   │   ├── dev
│   │   │   └── reset-ledger
│   │   │       └── route.ts
│   │   ├── internal
│   │   │   └── deposit-slip
│   │   │       ├── process
│   │   │       │   └── route.ts
│   │   │       ├── reset
│   │   │       │   └── route.ts
│   │   │       └── set-manual
│   │   │           └── route.ts
│   │   ├── market
│   │   │   ├── candles
│   │   │   │   └── route.ts
│   │   │   ├── line
│   │   │   │   └── route.ts
│   │   │   └── sync-trades
│   │   │       └── route.ts
│   │   ├── onboarding
│   │   │   ├── accept-terms
│   │   │   │   └── route.ts
│   │   │   ├── bank
│   │   │   │   └── route.ts
│   │   │   ├── deposit-slip
│   │   │   │   └── route.ts
│   │   │   ├── id-document
│   │   │   │   └── route.ts
│   │   │   ├── ocr
│   │   │   │   └── route.ts
│   │   │   ├── personal
│   │   │   │   └── route.ts
│   │   │   └── profile
│   │   │       └── route.ts
│   │   ├── prices
│   │   │   ├── current
│   │   │   │   └── route.ts
│   │   │   └── manual
│   │   │       └── route.ts
│   │   ├── treasury
│   │   │   ├── movements
│   │   │   │   ├── [id]
│   │   │   │   ├── pending
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── summary
│   │   │   │   └── route.ts
│   │   │   └── sync-wallet
│   │   │       └── route.ts
│   │   └── webhooks
│   │       └── twilio
│   │           └── whatsapp
│   │               └── route.ts
│   ├── auth
│   ├── components
│   ├── dashboard
│   ├── demo
│   ├── onboarding
│   ├── treasury
│   └── verify-email
├── components
├── docs
├── lib
├── prisma
├── public
├── scripts
└── types
```

Key folders:
- app/api: Next.js route handlers (REST API)
- app/onboarding, app/treasury, app/dashboard: UI flows
- lib: service logic (buda, treasury, system wallet, onboarding)
- prisma: schema + migrations
- scripts: operational scripts (audit, purge, wipe)
- public/uploads: local file receipts (see storage section in docs/STORAGE_MAP.md)

## Endpoints (Next.js API)
Format: Route | Methods | File | Primary handler

- /api/_debug/buda | GET | app/api/_debug/buda/route.ts | GET
- /api/auth/[...nextauth] | GET, POST | app/api/auth/[...nextauth]/route.ts | handler (NextAuth)
- /api/auth/active-company | POST | app/api/auth/active-company/route.ts | POST
- /api/auth/register | POST | app/api/auth/register/route.ts | POST
- /api/auth/resend-verification | POST | app/api/auth/resend-verification/route.ts | POST
- /api/auth/verify-email | GET, POST | app/api/auth/verify-email/route.ts | GET/POST
- /api/buda/orders | POST | app/api/buda/orders/route.ts | POST
- /api/buda/quote-buy | POST | app/api/buda/quote-buy/route.ts | POST
- /api/buda/ticker | GET | app/api/buda/ticker/route.ts | GET
- /api/company/activate | GET | app/api/company/activate/route.ts | GET
- /api/cron/retry-pending | POST | app/api/cron/retry-pending/route.ts | POST
- /api/cron/sync-trades | GET | app/api/cron/sync-trades/route.ts | GET
- /api/debug/email | GET | app/api/debug/email/route.ts | GET
- /api/dev/reset-ledger | POST | app/api/dev/reset-ledger/route.ts | POST
- /api/internal/deposit-slip/process | POST | app/api/internal/deposit-slip/process/route.ts | POST
- /api/internal/deposit-slip/reset | POST | app/api/internal/deposit-slip/reset/route.ts | POST
- /api/internal/deposit-slip/set-manual | POST | app/api/internal/deposit-slip/set-manual/route.ts | POST
- /api/market/candles | GET | app/api/market/candles/route.ts | GET
- /api/market/line | GET | app/api/market/line/route.ts | GET
- /api/market/sync-trades | GET | app/api/market/sync-trades/route.ts | GET
- /api/onboarding/accept-terms | POST | app/api/onboarding/accept-terms/route.ts | POST
- /api/onboarding/bank | GET, POST | app/api/onboarding/bank/route.ts | GET/POST
- /api/onboarding/deposit-slip | POST | app/api/onboarding/deposit-slip/route.ts | POST
- /api/onboarding/id-document | POST | app/api/onboarding/id-document/route.ts | POST
- /api/onboarding/ocr | POST | app/api/onboarding/ocr/route.ts | POST
- /api/onboarding/personal | POST | app/api/onboarding/personal/route.ts | POST
- /api/onboarding/profile | GET, POST | app/api/onboarding/profile/route.ts | GET/POST
- /api/prices/current | GET | app/api/prices/current/route.ts | GET
- /api/prices/manual | POST | app/api/prices/manual/route.ts | POST
- /api/treasury/movements | POST | app/api/treasury/movements/route.ts | POST
- /api/treasury/movements/pending | GET | app/api/treasury/movements/pending/route.ts | GET
- /api/treasury/movements/[id]/approve | POST | app/api/treasury/movements/[id]/approve/route.ts | POST
- /api/treasury/movements/[id]/paid | POST | app/api/treasury/movements/[id]/paid/route.ts | POST
- /api/treasury/movements/[id]/receipt | GET | app/api/treasury/movements/[id]/receipt/route.ts | GET
- /api/treasury/movements/[id]/reconcile | POST | app/api/treasury/movements/[id]/reconcile/route.ts | POST
- /api/treasury/movements/[id]/reject | POST | app/api/treasury/movements/[id]/reject/route.ts | POST
- /api/treasury/summary | GET | app/api/treasury/summary/route.ts | GET
- /api/treasury/sync-wallet | POST | app/api/treasury/sync-wallet/route.ts | POST
- /api/webhooks/twilio/whatsapp | POST | app/api/webhooks/twilio/whatsapp/route.ts | POST

## Jobs / cron
- app/api/cron/sync-trades/route.ts (GET): proxy/trigger for /api/market/sync-trades (requires CRON_SECRET header).
- app/api/cron/retry-pending/route.ts (POST): sync system wallet and retry pending movements (requires CRON_SECRET header).

Cron scheduling config:
- NO ENCONTRADO: vercel.json or other cron scheduler config in repo. Searched: repo root for vercel.json and rg "cron".

## Scripts
- scripts/audit_market_trades.js: audits MarketTrade history and duplicates.
- scripts/audit_trades.js: similar audit for MarketTrade.
- scripts/dev-add-second-company.js / .ts: create a second company for a user.
- scripts/dev-reset-active.js: reset activeCompanyId for a user.
- scripts/fix-clp-deposits.ts / v2: fix CLP deposit movements from slips.
- scripts/purgeUser.ts: remove a user and related data; cleans storage + local uploads.
- scripts/test_deposit_whatsapp.js: smoke test for deposit flow + WhatsApp failure.
- scripts/twilio_whatsapp_test.js: Twilio WhatsApp send test.
- scripts/wipe_prod.js: production wipe (DB only by default; storage/auth manual).
- scripts/_prisma.ts: helper to create Prisma client for scripts.

## Production checklist
Deploy-dependent:
- Code changes deployed to Vercel.
- Prisma migrations applied (prisma migrate status).
- Vercel env vars set (see docs/ENV_MAP.md).
- Supabase Storage buckets exist: kyc, deposit-slips (see docs/STORAGE_MAP.md).
- Cron configured to call /api/cron/sync-trades and /api/cron/retry-pending with CRON_SECRET.

Non-deploy/manual data:
- System wallet sync run at least once after go-live (POST /api/treasury/sync-wallet).
- If WhatsApp is required, verify Twilio numbers and inbound webhook settings.

Smoke tests:
- Upload CLP deposit slip (POST /api/treasury/movements with receipt) and confirm movement status + WhatsApp logs.
- Create BTC/USDT trade (POST /api/treasury/movements) and verify receipt endpoint returns data.
- Call /api/treasury/sync-wallet and confirm balances update.

## References to other docs
- docs/DB_SCHEMA.md
- docs/STORAGE_MAP.md
- docs/ENV_MAP.md
- docs/FLOWS.md

## NO ENCONTRADO / gaps
- Vercel cron schedule config (vercel.json) or GitHub Actions workflow for cron.
- Supabase storage bucket policies/migrations (no SQL policies found in repo).
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
# ENV_MAP

Sources:
- process.env usage in repo (rg)
- .env, .env.local, .env.example (keys only)

## Env vars used in code

| ENV | Scope | Where used (path:line) | Required | Purpose |
| --- | --- | --- | --- | --- |
| DATABASE_URL | server | scripts/dev-add-second-company.js:10; scripts/dev-reset-active.js:8 | required for Prisma | Postgres connection (app + scripts) |
| DIRECT_URL | server/scripts | scripts/_prisma.ts:5; scripts/test_deposit_whatsapp.js:15 | required for scripts | Direct (non-pooler) Postgres connection for scripts |
| NEXTAUTH_URL | server | lib/whatsapp.ts:119 | optional (fallback) | Base URL fallback for WhatsApp links |
| NEXTAUTH_SECRET | server | auth.ts:37; lib/authOptions.ts:82 | required for NextAuth | NextAuth signing secret |
| NEXT_PUBLIC_SITE_URL | client+server | app/api/auth/verify-email/route.ts:6; lib/sendVerificationEmail.ts:11 | required for email links (prod) | Base URL for verification links |
| NEXT_PUBLIC_APP_URL | client+server | app/auth/verify-email/route.ts:5; lib/whatsapp.ts:119 | optional (fallback) | Base URL fallback for verify/WhatsApp links |
| NEXT_PUBLIC_BASE_URL | client+server | app/api/cron/sync-trades/route.ts:17 | required for cron proxy | Base URL used by cron to call internal sync endpoint |
| NEXT_PUBLIC_SUPABASE_URL | client+server | lib/supabaseClient.ts:4; lib/supabaseServer.ts:4 | required | Supabase project URL (public) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | client | lib/supabaseClient.ts:5 | required for client auth | Supabase anon key |
| SUPABASE_URL | server | lib/supabaseServer.ts:4; scripts/wipe_prod.js:64 | required for server storage | Supabase project URL (server) |
| SUPABASE_SERVICE_ROLE_KEY | server | lib/supabaseServer.ts:6; scripts/wipe_prod.js:65 | required for server storage | Supabase service role key |
| RESEND_API_KEY | server | lib/resend.ts:3; lib/sendVerificationEmail.ts:4 | required for email | Resend API key |
| EMAIL_FROM | server | lib/sendVerificationEmail.ts:12; lib/email/sendVerificationEmail.ts:13 | required for email | From address for verification emails |
| BUDA_API_BASE | server | lib/buda.ts:4; app/api/prices/current/route.ts:50 | optional | Override base URL for Buda API |
| BUDA_API_KEY | server | lib/buda.ts:5 | required for Buda | API key for private Buda endpoints |
| BUDA_API_SECRET | server | lib/buda.ts:6 | required for Buda | API secret for private Buda endpoints |
| BUDA_MIN_BTC | server | lib/treasury/approveMovement.ts:296 | optional (default) | Min BTC amount to place Buda orders |
| BUDA_MIN_USDT | server | lib/treasury/approveMovement.ts:297 | optional (default) | Min USDT amount to place Buda orders |
| TWILIO_ACCOUNT_SID | server | lib/whatsapp.ts:31; app/api/treasury/movements/route.ts:95 | required for WhatsApp | Twilio account SID |
| TWILIO_AUTH_TOKEN | server | lib/whatsapp.ts:32; app/api/webhooks/twilio/whatsapp/route.ts:35 | required for WhatsApp | Twilio auth token |
| TWILIO_WHATSAPP_FROM | server | lib/whatsapp.ts:33; app/api/treasury/movements/route.ts:97 | required for WhatsApp | Twilio WhatsApp sender number |
| TWILIO_FROM | server | lib/whatsapp.ts:34 | optional (fallback) | Alternate Twilio sender |
| ADMIN_WHATSAPP_TO | server | lib/whatsapp.ts:35; app/api/webhooks/twilio/whatsapp/route.ts:37 | required for WhatsApp | Admin WhatsApp recipient |
| WHATSAPP_ADMIN_TO | server | lib/whatsapp.ts:36 | optional (fallback) | Alternate admin WhatsApp recipient |
| CRON_SECRET | server | app/api/cron/sync-trades/route.ts:6; app/api/cron/retry-pending/route.ts:13 | required for cron | Auth for cron endpoints |
| CRON_RETRY_BATCH | server | app/api/cron/retry-pending/route.ts:21 | optional (default) | Batch size for retry-pending |
| DEBUG_PERF | server | app/onboarding/page.tsx:14; lib/onboardingStatus.ts:23 | optional | Enable server perf logs |
| NEXT_PUBLIC_DEBUG_PERF | client | app/onboarding/OnboardingClient.tsx:18 | optional | Enable client perf logs |
| NEXT_PUBLIC_SHOW_ONBOARDING_DEBUG | client | app/onboarding/OnboardingClient.tsx:19 | optional | Show onboarding debug nav |
| NEXT_RUNTIME | server | lib/whatsapp.ts:37 | optional | Log runtime for diagnostics |
| NODE_ENV | server | lib/prisma.ts:13; app/api/dev/reset-ledger/route.ts:6 | platform | Node environment |
| VERCEL_ENV | server | lib/sendVerificationEmail.ts:14; app/api/auth/verify-email/route.ts:8 | platform | Vercel environment |
| BASE_URL | script | scripts/test_deposit_whatsapp.js:5 | optional | Base URL for deposit WhatsApp test |
| AMOUNT | script | scripts/test_deposit_whatsapp.js:7 | optional | Amount for deposit WhatsApp test |
| SESSION_COOKIE | script | scripts/test_deposit_whatsapp.js:6 | required for test | Session cookie for test script |
| DOTENV_CONFIG_PATH | script | scripts/test_deposit_whatsapp.js:1 | optional | dotenv file path for test script |
| WIPE_CONFIRM | script | scripts/wipe_prod.js:53 | required for wipe | Safety code for destructive wipe |

## NO ENCONTRADO / gaps
Variables present in .env / .env.example but not referenced in code (search: rg process.env):
- PRISMA_CLIENT_ENGINE_TYPE
- PUBLIC_BASE_URL
- BUDA_API_BASE_URL
- TWILIO_WEBHOOK_TOKEN
- OCR_SPACE_API_KEY

Notes:
- If a variable is required only for a feature, it is marked "required for <feature>".
- Client-only vars must be prefixed with NEXT_PUBLIC_*.
# STORAGE_MAP

Sources:
- app/api/onboarding/id-document/route.ts
- app/api/onboarding/ocr/route.ts
- app/api/onboarding/deposit-slip/route.ts
- app/api/treasury/movements/route.ts
- app/api/internal/deposit-slip/process/route.ts
- lib/supabaseServer.ts
- scripts/purgeUser.ts
- scripts/wipe_prod.js

## Supabase Storage buckets

Buckets found in code: kyc, deposit-slips. No other bucket names found in repo search.

### Bucket: kyc
- Purpose: ID document images (front/back) for onboarding OCR.
- Upload: app/api/onboarding/id-document/route.ts (POST)
  - path format: `user/<userId>/id-front-<timestamp>.<ext>` or `id-back-...`
- Download: app/api/onboarding/ocr/route.ts (POST)
- DB references: user_onboarding.idDocumentFrontPath, user_onboarding.idDocumentBackPath
- Client used: lib/supabaseServer.ts (service role key)

### Bucket: deposit-slips
- Purpose: CLP deposit slip files (images/PDF).
- Upload:
  - app/api/onboarding/deposit-slip/route.ts (POST)
  - app/api/treasury/movements/route.ts (POST, for CLP deposits)
  - path format: `user/<userId>/deposit-slip-<timestamp>.<ext>`
- Download:
  - app/api/internal/deposit-slip/process/route.ts (POST)
- DB references: deposit_slips.file_path (see docs/DB_SCHEMA.md)
- Client used: lib/supabaseServer.ts (service role key)

## Local filesystem storage (non-Supabase)

### public/uploads/treasury
- Purpose: CLP deposit receipts stored locally for dashboard access.
- Writer: app/api/treasury/movements/route.ts -> saveReceiptLocal()
- Path format: `public/uploads/treasury/<companyId>/<movementId>.<ext>`
- DB reference: TreasuryMovement.attachmentUrl
- Risk: Vercel filesystem is ephemeral; files stored under public/ are not guaranteed to persist across deployments.
- Recommendation: store receipts only in Supabase Storage and serve via signed URLs.

## Storage policies
- NO ENCONTRADO: no SQL policies or Supabase storage policies in repo.
  Search performed: rg "policy" / "storage" / "bucket" in repo.

## Cleanup scripts
- scripts/purgeUser.ts removes objects from buckets "kyc" and "deposit-slips".
- scripts/wipe_prod.js can list/remove bucket objects, but is disabled by default (manual storage wipe).
