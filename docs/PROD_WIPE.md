# Production Wipe (Safe)

Goal: wipe all **non-market** data (users + app data + storage files) while preserving **market history** tables.

## Preserved tables (DO NOT WIPE)
- `MarketTrade` (trade history used by BTC/CLP chart)
- `PriceSnapshot` (price history)

## Wiped tables (app/user data)
- `TreasuryMovement`
- `TreasuryAccount`
- `CompanyUser`
- `Company`
- `DepositSlip`
- `UserOnboarding`
- `PersonProfile`
- `BankAccount`
- `Session`
- `EmailVerificationToken`
- `CronRun`
- `User` (unless `--keep-email` is provided)

## Storage buckets (objects removed)
- `kyc`
- `deposit-slips`

## Supabase Auth
- All auth users are deleted by default.
- Optional: `--keep-email founder@...` skips deletion of that auth user.

## Safety checks
The script refuses to execute unless **both** conditions are met:
1. Confirmation string is exactly `WIPE_PROD`
2. `SUPABASE_PROJECT_REF` **or** `NEXT_PUBLIC_SITE_URL` contains `"prod"`

## Required env vars
- `DATABASE_URL` (Prisma)
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF` **or** `NEXT_PUBLIC_SITE_URL` (must contain `prod` for execute)

## Dry run (safe)
```bash
node scripts/wipe_prod.js --dry-run
```

## Execute (dangerous)
```bash
node scripts/wipe_prod.js --execute WIPE_PROD
```

Optional keep:
```bash
node scripts/wipe_prod.js --execute WIPE_PROD --keep-email founder@yourdomain.com
```

## Notes / rollback
- This is **not** reversible.
- Run dry-run first and confirm counts.
- If you need a rollback, restore from DB backup + re-upload storage objects.
