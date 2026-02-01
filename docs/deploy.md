# Deploy steps (production)

## 1) Env vars (Vercel)

### Required (server)
- `DATABASE_URL`
- `DIRECT_URL` (recommended for scripts)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BUDA_API_KEY`
- `BUDA_API_SECRET`
- `STRICT_SYSTEM_WALLET=true`

### Optional (features)
- `FEATURE_WHATSAPP_APPROVAL=true`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `WHATSAPP_ADMIN_ALLOWLIST=+56...,+56...`
- `TWILIO_WEBHOOK_TOKEN`

### Safety flags (must be disabled in prod)
- `AUTO_APPROVE_DEPOSITS=false`
- `AUTO_APPROVE_MAX_CLP=0`

### Admin safeguard
- `ADMIN_SECRET=<shared secret>` (used by admin approve/reject endpoints)

## 2) Migrations
```
npx prisma migrate deploy
```

## 3) Preflight (before/after deploy)
```
npx tsx -r dotenv/config scripts/preflight_prod.ts
```

## 4) Twilio webhook
Set the webhook URL to:
```
https://<your-domain>/api/webhooks/twilio/whatsapp?token=<TWILIO_WEBHOOK_TOKEN>
```
Note: allowlisted numbers must be included in `WHATSAPP_ADMIN_ALLOWLIST`.

## 5) Smoke tests (post-deploy)
1) **CLP deposit with slip** → stays `PENDING`, no balance credit.
2) **Admin approve**:
   - `POST /api/admin/movements/<movementId>/approve`
   - Header: `X-ADMIN-SECRET: <ADMIN_SECRET>`
   - Balance increases once.
3) **Buy BTC with insufficient system wallet** → remains `PENDING` with `INSUFFICIENT_LIQUIDITY`.

