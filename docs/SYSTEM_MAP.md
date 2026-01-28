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
