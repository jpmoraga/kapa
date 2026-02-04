-- Restore admin auth tables (AdminUser + AdminSession)
-- Idempotent and safe to apply on existing DB.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminRole') THEN
    CREATE TYPE "AdminRole" AS ENUM ('ADMIN');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "AdminUser" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key"
  ON "AdminUser"("email");

CREATE TABLE IF NOT EXISTS "AdminSession" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminSession_token_key"
  ON "AdminSession"("token");

CREATE INDEX IF NOT EXISTS "AdminSession_adminUserId_idx"
  ON "AdminSession"("adminUserId");

CREATE INDEX IF NOT EXISTS "AdminSession_expiresAt_idx"
  ON "AdminSession"("expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.contype = 'f'
      AND c.conrelid = '"AdminSession"'::regclass
      AND c.confrelid = '"AdminUser"'::regclass
  ) THEN
    ALTER TABLE "AdminSession"
      ADD CONSTRAINT "AdminSession_adminUserId_fkey"
      FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
