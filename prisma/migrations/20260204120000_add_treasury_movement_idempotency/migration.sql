-- Add idempotencyKey to TreasuryMovement
-- Idempotent and safe to apply on existing DB.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'TreasuryMovement'
      AND column_name = 'idempotencyKey'
  ) THEN
    ALTER TABLE "TreasuryMovement" ADD COLUMN "idempotencyKey" TEXT;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "TreasuryMovement_companyId_idempotencyKey_key"
  ON "TreasuryMovement"("companyId", "idempotencyKey");
