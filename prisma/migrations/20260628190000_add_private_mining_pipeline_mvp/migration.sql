DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MiningProspectSource') THEN
    CREATE TYPE "MiningProspectSource" AS ENUM (
      'WHATSAPP',
      'INSTAGRAM',
      'LINKEDIN',
      'X',
      'WEB',
      'REFERRAL',
      'PERSONAL',
      'OTHER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MiningInterestType') THEN
    CREATE TYPE "MiningInterestType" AS ENUM (
      'FRACTIONAL_MINING',
      'TOKENIZED_MINING',
      'ASIC_PURCHASE',
      'UNDEFINED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MiningProspectStatus') THEN
    CREATE TYPE "MiningProspectStatus" AS ENUM (
      'NEW_INTEREST',
      'MEETING_SCHEDULED',
      'MEETING_DONE',
      'FOLLOW_UP',
      'READY_FOR_CONTRACT',
      'DORMANT',
      'DISCARDED'
    );
  END IF;
END
$$;

CREATE TABLE "MiningProspect" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "companyName" TEXT,
  "country" TEXT NOT NULL DEFAULT 'Chile',
  "whatsapp" TEXT,
  "instagramUrl" TEXT,
  "linkedinUrl" TEXT,
  "xUrl" TEXT,
  "email" TEXT,
  "source" "MiningProspectSource" NOT NULL DEFAULT 'OTHER',
  "interestType" "MiningInterestType" NOT NULL DEFAULT 'UNDEFINED',
  "estimatedAmountUsd" DECIMAL(18,2),
  "status" "MiningProspectStatus" NOT NULL DEFAULT 'NEW_INTEREST',
  "firstContactAt" TIMESTAMP(3),
  "meetingScheduledAt" TIMESTAMP(3),
  "meetingDoneAt" TIMESTAMP(3),
  "followUpAt" TIMESTAMP(3),
  "readyForContractAt" TIMESTAMP(3),
  "dormantAt" TIMESTAMP(3),
  "discardedAt" TIMESTAMP(3),
  "nextAction" TEXT,
  "nextActionAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MiningProspect_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MiningProspect_source_updatedAt_idx" ON "MiningProspect"("source", "updatedAt");
CREATE INDEX "MiningProspect_interestType_updatedAt_idx" ON "MiningProspect"("interestType", "updatedAt");
CREATE INDEX "MiningProspect_status_updatedAt_idx" ON "MiningProspect"("status", "updatedAt");
CREATE INDEX "MiningProspect_country_updatedAt_idx" ON "MiningProspect"("country", "updatedAt");
CREATE INDEX "MiningProspect_nextActionAt_idx" ON "MiningProspect"("nextActionAt");
CREATE INDEX "MiningProspect_createdById_idx" ON "MiningProspect"("createdById");
CREATE INDEX "MiningProspect_updatedById_idx" ON "MiningProspect"("updatedById");

ALTER TABLE "MiningProspect"
ADD CONSTRAINT "MiningProspect_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "BackofficeUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "MiningProspect"
ADD CONSTRAINT "MiningProspect_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "BackofficeUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
