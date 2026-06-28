DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BackofficeRole') THEN
    CREATE TYPE "BackofficeRole" AS ENUM (
      'OWNER',
      'CONSULTING_ADMIN',
      'MINING_ADMIN',
      'MINING_PARTNER'
    );
  END IF;
END
$$;

CREATE TABLE "BackofficeUser" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "passwordHash" TEXT NOT NULL,
  "role" "BackofficeRole" NOT NULL DEFAULT 'OWNER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BackofficeUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BackofficeSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BackofficeSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BackofficeUser_email_key" ON "BackofficeUser"("email");
CREATE UNIQUE INDEX "BackofficeSession_tokenHash_key" ON "BackofficeSession"("tokenHash");
CREATE INDEX "BackofficeSession_userId_idx" ON "BackofficeSession"("userId");
CREATE INDEX "BackofficeSession_expiresAt_idx" ON "BackofficeSession"("expiresAt");

ALTER TABLE "BackofficeSession"
ADD CONSTRAINT "BackofficeSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "BackofficeUser"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
