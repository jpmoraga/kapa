-- Add idempotencyKey to TreasuryMovement (safe for production)
ALTER TABLE "TreasuryMovement"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "TreasuryMovement_companyId_idempotencyKey_key"
  ON "TreasuryMovement"("companyId", "idempotencyKey");

CREATE INDEX IF NOT EXISTS "TreasuryMovement_idempotencyKey_idx"
  ON "TreasuryMovement"("idempotencyKey");
