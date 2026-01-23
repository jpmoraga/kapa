-- Baseline for email verification + user emailVerifiedAt + deposit_slips FK
-- Idempotent and safe to apply on existing DB without data changes.

CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_token_key"
  ON "EmailVerificationToken"("token");

CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_userId_key"
  ON "EmailVerificationToken"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.conrelid = '"EmailVerificationToken"'::regclass
      AND c.confrelid = '"User"'::regclass
  ) THEN
    ALTER TABLE "EmailVerificationToken"
      ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(6);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.conrelid = 'deposit_slips'::regclass
      AND c.confrelid = '"User"'::regclass
  ) THEN
    ALTER TABLE "deposit_slips"
      ADD CONSTRAINT "deposit_slips_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;
