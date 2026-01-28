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
