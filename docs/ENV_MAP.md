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
