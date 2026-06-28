DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultingBusinessLine') THEN
    CREATE TYPE "ConsultingBusinessLine" AS ENUM (
      'FLEXIBLE_FUNDING',
      'OPERATING_TREASURY'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultingEmailStatus') THEN
    CREATE TYPE "ConsultingEmailStatus" AS ENUM (
      'UNKNOWN',
      'VALID',
      'INVALID',
      'NOT_FOUND'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultingContactStatus') THEN
    CREATE TYPE "ConsultingContactStatus" AS ENUM (
      'NEW',
      'LINKEDIN_INVITE_SENT',
      'LINKEDIN_ACCEPTED',
      'LINKEDIN_MESSAGE_SENT',
      'EMAIL_SENT',
      'RESPONDED',
      'MEETING_SCHEDULED',
      'MEETING_DONE',
      'FOLLOW_UP_1_SENT',
      'FOLLOW_UP_2_SENT',
      'DORMANT',
      'DISCARDED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultingPipelineStage') THEN
    CREATE TYPE "ConsultingPipelineStage" AS ENUM (
      'PROSPECTING',
      'CONTACTED',
      'CONVERSATION_OPEN',
      'MEETING_SCHEDULED',
      'MEETING_DONE',
      'PROPOSAL_SENT',
      'DIAGNOSIS_NEGOTIATION',
      'DIAGNOSIS_WON',
      'LOST',
      'PAUSED'
    );
  END IF;
END
$$;

CREATE TABLE "ConsultingProspect" (
  "id" TEXT NOT NULL,
  "businessLine" "ConsultingBusinessLine" NOT NULL,
  "country" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactRole" TEXT NOT NULL,
  "linkedinUrl" TEXT,
  "email" TEXT,
  "emailStatus" "ConsultingEmailStatus" NOT NULL DEFAULT 'UNKNOWN',
  "source" TEXT,
  "contactStatus" "ConsultingContactStatus" NOT NULL DEFAULT 'LINKEDIN_INVITE_SENT',
  "pipelineStage" "ConsultingPipelineStage" NOT NULL DEFAULT 'PROSPECTING',
  "linkedinInviteSentAt" TIMESTAMP(3),
  "linkedinAcceptedAt" TIMESTAMP(3),
  "linkedinMessageSentAt" TIMESTAMP(3),
  "emailSentAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "meetingScheduledAt" TIMESTAMP(3),
  "meetingDoneAt" TIMESTAMP(3),
  "followUp1SentAt" TIMESTAMP(3),
  "followUp2SentAt" TIMESTAMP(3),
  "nextAction" TEXT,
  "nextActionAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ConsultingProspect_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConsultingProspect_businessLine_updatedAt_idx" ON "ConsultingProspect"("businessLine", "updatedAt");
CREATE INDEX "ConsultingProspect_country_updatedAt_idx" ON "ConsultingProspect"("country", "updatedAt");
CREATE INDEX "ConsultingProspect_contactStatus_updatedAt_idx" ON "ConsultingProspect"("contactStatus", "updatedAt");
CREATE INDEX "ConsultingProspect_pipelineStage_updatedAt_idx" ON "ConsultingProspect"("pipelineStage", "updatedAt");
CREATE INDEX "ConsultingProspect_nextActionAt_idx" ON "ConsultingProspect"("nextActionAt");
CREATE INDEX "ConsultingProspect_createdById_idx" ON "ConsultingProspect"("createdById");
CREATE INDEX "ConsultingProspect_updatedById_idx" ON "ConsultingProspect"("updatedById");

ALTER TABLE "ConsultingProspect"
ADD CONSTRAINT "ConsultingProspect_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "BackofficeUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ConsultingProspect"
ADD CONSTRAINT "ConsultingProspect_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "BackofficeUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
