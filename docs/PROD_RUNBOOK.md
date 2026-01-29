# PROD_RUNBOOK

Scope: production operations for Kapa21 (Vercel + Supabase + Buda + Twilio).

## 1) Environment variables (Vercel)

Reference: docs/ENV_MAP.md

Minimum required in Vercel Production:
- Database: DATABASE_URL, DIRECT_URL (for scripts)
- Auth: NEXTAUTH_URL, NEXTAUTH_SECRET
- Public URLs: NEXT_PUBLIC_SITE_URL (verify-email links)
- Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Resend: RESEND_API_KEY, EMAIL_FROM
- Buda: BUDA_API_KEY, BUDA_API_SECRET (BUDA_API_BASE optional)
- Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, ADMIN_WHATSAPP_TO
- Cron: CRON_SECRET (CRON_RETRY_BATCH optional)

Notes:
- NEXT_PUBLIC_BASE_URL is used by /api/cron/sync-trades to call /api/market/sync-trades.
- NEXT_PUBLIC_APP_URL is used as a fallback for links (WhatsApp + verify email).

## 2) Deploy / redeploy

- Push to main (or release branch) triggers Vercel build/deploy.
- Ensure prisma migrate status is clean before deploy.
- After deploy, run a manual system wallet sync (see below).

## 3) Cron jobs (Vercel)

This repo exposes endpoints, but scheduling config is not in repo.

Endpoints:
- /api/cron/sync-trades (GET)
  - Auth: Authorization: Bearer <CRON_SECRET>
  - Calls /api/market/sync-trades
- /api/cron/retry-pending (POST)
  - Auth: x-cron-secret: <CRON_SECRET>
  - Runs system wallet sync and retries pending trades

If using Vercel Cron, schedule these with the correct headers.

## 4) System wallet sync

Endpoint:
- POST /api/treasury/sync-wallet

Effect:
- Calls syncSystemWalletAndRetry -> recompute system wallet balances from Buda and retry pending liquidity trades.

## 4.1) DB-only retry trigger (no Buda sync)

Endpoint:
- POST /api/treasury/retry-pending-db

Effect:
- Claims PENDING trades with internalReason=INSUFFICIENT_LIQUIDITY and internalState=WAITING_LIQUIDITY.
- Calls approveMovementAsSystem(skipSync: true) for each claimed movement.
- Does NOT call syncSystemWalletFromBuda as part of the trigger.

## 5) Debugging a deposit with receipt (CLP)

Checklist:
1) Create deposit via UI (CLP with receipt) -> POST /api/treasury/movements.
2) Confirm TreasuryMovement:
   - status should be APPROVED for CLP deposits (auto-approve).
   - attachmentUrl should exist (local path or storage URL).
3) Confirm DepositSlip:
   - deposit_slips record created with file_path (Supabase storage path).
   - notes includes movementId:<movementId>.
4) WhatsApp:
   - Check logs for send attempt/ok/error (tags: whatsapp:send_attempt, whatsapp:send_ok, whatsapp:send_error).
   - If WhatsApp fails, movement should still be APPROVED (best-effort behavior).
5) If admin approval is used:
   - Reply via WhatsApp: "aprobar <slipId> [monto]".
   - Check movement status and TreasuryAccount balance update.

## 6) Trade retry behavior

- Pending trades with internalReason=INSUFFICIENT_LIQUIDITY are retried after system wallet sync.
- Manual trigger: POST /api/treasury/sync-wallet or /api/cron/retry-pending.

## 7) Common production checks

- Supabase Storage buckets exist: kyc, deposit-slips.
- Twilio inbound webhook configured to /api/webhooks/twilio/whatsapp.
- Resend domain verified for EMAIL_FROM.
- Buda API keys valid and allowed by IP (if restricted).
