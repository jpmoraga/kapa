# Runbook: purge QA user + recompute balances

## Dry run (safe by default)
```
npx tsx -r dotenv/config scripts/purge_qa_user.ts --email jorge.mendez.fredes@gmail.com
```

## Execute (requires explicit flag)
```
npx tsx -r dotenv/config scripts/purge_qa_user.ts --email jorge.mendez.fredes@gmail.com --execute
```

## Optional flags
- `--delete-company` (only if the company has no other users)
- `--since YYYY-MM-DD` (limit deletions to recent movements)

## Recompute balances only
```
npx tsx -r dotenv/config scripts/recompute_balances.ts --companyId <id> --execute
```

## What it does
- Deletes user‑owned data (sessions, profile, onboarding, slips, movements created by user).
- Keeps shared companies intact unless `--delete-company` and safe.
- Recomputes balances for affected companies from APPROVED movements.
- Attempts system wallet sync if BUDA keys are present.

## Safety
- DRY RUN by default.
- Prints connected DB host/database before any write.
- Idempotent: running twice should report nothing to do.
