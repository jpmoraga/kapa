# Env Audit (local vs production)

## Summary
- .env keys: 8
- .env.local keys: 19
- Both (same key): 6
- Differences (same key, different values): 5

## Keys in both but with different values (name only)
- DATABASE_URL
- DIRECT_URL
- NEXT_PUBLIC_APP_URL
- PRISMA_CLIENT_ENGINE_TYPE
- SUPABASE_SERVICE_ROLE_KEY

## Only in .env
- EMAIL_FROM
- RESEND_API_KEY

## Only in .env.local
- ADMIN_WHATSAPP_TO
- BUDA_API_BASE_URL
- BUDA_API_KEY
- BUDA_API_SECRET
- NEXTAUTH_URL
- NEXT_PUBLIC_SUPABASE_URL
- OCR_SPACE_API_KEY
- PUBLIC_BASE_URL
- SUPABASE_URL
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_WEBHOOK_TOKEN
- TWILIO_WHATSAPP_FROM

## Suspicious / cleanup candidates
- DIRECT_URL equals DATABASE_URL in both .env and .env.local (should be direct connection, not pooler).
- BUDA_API_BASE_URL exists in .env.local but code uses BUDA_API_BASE (mismatch).

## Code-referenced keys missing from env files
These are referenced in code but do not appear in .env or .env.local:
- BUDA_API_BASE
- BUDA_MIN_BTC
- BUDA_MIN_USDT
- CRON_RETRY_BATCH
- CRON_SECRET
- NEXT_PUBLIC_BASE_URL
- NEXT_PUBLIC_SHOW_ONBOARDING_DEBUG
- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_RUNTIME (runtime-provided)
- NODE_ENV (runtime-provided)
- TWILIO_FROM
- VERCEL_ENV (runtime-provided)
- WHATSAPP_ADMIN_TO
- WIPE_CONFIRM (script-only)

## Recommended convention
- .env.example: committed template with all keys and empty placeholders.
- .env: safe placeholder file (no secrets).
- .env.local: local secrets only; never committed.
- Vercel: use Environment Variables dashboard as the single source of truth for production.

## Vercel Environment Variables checklist

### Server-only
- ADMIN_WHATSAPP_TO
- BUDA_API_BASE
- BUDA_API_KEY
- BUDA_API_SECRET
- BUDA_MIN_BTC
- BUDA_MIN_USDT
- CRON_RETRY_BATCH
- CRON_SECRET
- DATABASE_URL
- DIRECT_URL (optional; scripts only)
- EMAIL_FROM
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- OCR_SPACE_API_KEY
- PRISMA_CLIENT_ENGINE_TYPE (optional)
- RESEND_API_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_URL
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM (legacy)
- TWILIO_WEBHOOK_TOKEN
- TWILIO_WHATSAPP_FROM
- WHATSAPP_ADMIN_TO (legacy)
- WIPE_CONFIRM (script-only)
- PUBLIC_BASE_URL (legacy)

### NEXT_PUBLIC_*
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_BASE_URL
- NEXT_PUBLIC_SHOW_ONBOARDING_DEBUG
- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SUPABASE_URL

### Platform-provided (no need to set)
- NODE_ENV
- VERCEL_ENV
- NEXT_RUNTIME
