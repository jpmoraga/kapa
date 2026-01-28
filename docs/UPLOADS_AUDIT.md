# UPLOADS_AUDIT

Scope: filesystem writes, Supabase Storage usage, and attachment exposure.
Sources: rg "fs", "writeFile", "public/uploads", "deposit-slips", "storage.from".

## Findings (filesystem)

| File:Line | What it does | Runs on Vercel? | Risk | Correct replacement |
| --- | --- | --- | --- | --- |
| app/api/treasury/movements/route.ts:72-91 | saveReceiptLocal writes receipt to `public/uploads/treasury/<companyId>/<movementId>.<ext>` via fs.mkdir + fs.writeFile | Yes (API route) | Vercel filesystem is ephemeral; files may vanish across deploys or scale-out | Store receipt in Supabase Storage and serve via signed URL; if temporary, use `/tmp` only during request |
| scripts/purgeUser.ts:105-112 | fs.rm removes `public/uploads/treasury/<companyId>` | No (local script) | Only local cleanup, not applicable to Vercel | Keep; aligns with local files created by saveReceiptLocal |

## Findings (Supabase Storage)

| File:Line | Bucket | What it does | Runs on Vercel? | Notes |
| --- | --- | --- | --- | --- |
| app/api/onboarding/id-document/route.ts:41-58 | kyc | Upload front/back ID images to Storage | Yes (API route) | Paths stored in user_onboarding.idDocumentFrontPath/idDocumentBackPath |
| app/api/onboarding/ocr/route.ts:117-129 | kyc | Download front/back ID images for OCR | Yes (API route) | Requires service role key (lib/supabaseServer.ts) |
| app/api/onboarding/deposit-slip/route.ts:50-70 | deposit-slips | Upload deposit slip file | Yes (API route) | Creates DepositSlip row with filePath |
| app/api/treasury/movements/route.ts:44-69 | deposit-slips | Upload receipt to Storage for CLP deposits | Yes (API route) | Also creates DepositSlip and links movementId in notes |
| scripts/purgeUser.ts:90-100 | kyc, deposit-slips | Remove user files from Storage | No (local script) | Cleanup only; logs errors and continues |
| scripts/wipe_prod.js:173-211 | kyc, deposit-slips | Lists/removes objects (guarded by flags) | No (manual script) | Storage wipe is disabled by default |

## Findings (attachment exposure in UI)

| File:Line | What it does | Runs on Vercel? | Risk | Correct replacement |
| --- | --- | --- | --- | --- |
| app/api/treasury/movements/pending/route.ts:40-55 | Returns `attachmentUrl` in pending list | Yes (API route) | If attachmentUrl is a local path, it may 404 on Vercel | Serve signed Storage URLs or proxy via API |
| app/dashboard/DashboardV2Client.tsx:946-955 | Renders link to `attachmentUrl` | Client | Works only if URL is publicly accessible | Use signed URLs for Storage or proxy endpoint |

## Summary
- Only filesystem write: `saveReceiptLocal` in app/api/treasury/movements/route.ts.
- Supabase Storage buckets used: `kyc`, `deposit-slips`.
- Attachment URLs are currently assumed to be direct links, which is fragile if the file is stored locally on Vercel.

## Recommended replacement targets
- Replace local receipt storage with Supabase Storage and serve via signed URL.
- Avoid writing into `public/` at runtime on Vercel.
- If temporary file is needed for processing, use `/tmp` and delete after use.
