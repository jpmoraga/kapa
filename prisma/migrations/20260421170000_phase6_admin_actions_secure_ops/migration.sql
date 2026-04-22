-- AlterTable
ALTER TABLE "CompanySubscription"
ADD COLUMN "baseAmountUsd" DECIMAL(65,30);

-- CreateEnum
CREATE TYPE "AdminActionType" AS ENUM (
  'SUBSCRIPTION_CHARGE_MANUAL',
  'CLIENT_BUY_BTC',
  'CLIENT_SELL_BTC',
  'CLIENT_ASSIGN_BTC_EXTERNAL'
);

-- CreateEnum
CREATE TYPE "AdminActionStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED'
);

-- CreateEnum
CREATE TYPE "AdminActionEffectType" AS ENUM (
  'TREASURY_MOVEMENT',
  'SUBSCRIPTION_CHARGE',
  'EXTERNAL_BTC_ASSIGNMENT'
);

-- CreateEnum
CREATE TYPE "SubscriptionChargeStatus" AS ENUM (
  'PENDING',
  'SUCCEEDED',
  'FAILED'
);

-- CreateEnum
CREATE TYPE "AdminExternalBtcAssignmentStatus" AS ENUM (
  'PENDING',
  'SUCCEEDED',
  'FAILED'
);

-- Extend existing enum
ALTER TYPE "InternalMovementReason" ADD VALUE IF NOT EXISTS 'ADMIN_TRADE';
ALTER TYPE "InternalMovementReason" ADD VALUE IF NOT EXISTS 'ADMIN_SUBSCRIPTION_CHARGE';
ALTER TYPE "InternalMovementReason" ADD VALUE IF NOT EXISTS 'ADMIN_MANUAL_ASSIGNMENT';

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "type" "AdminActionType" NOT NULL,
    "status" "AdminActionStatus" NOT NULL DEFAULT 'PENDING',
    "actorAdminUserId" TEXT NOT NULL,
    "targetCompanyId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "validatedContext" JSONB,
    "reason" TEXT,
    "resultPayload" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActionEffect" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "effectType" "AdminActionEffectType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "label" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionCharge" (
    "id" TEXT NOT NULL,
    "adminActionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "SubscriptionChargeStatus" NOT NULL DEFAULT 'PENDING',
    "referenceAmountUsd" DECIMAL(65,30) NOT NULL,
    "debitAssetCode" "AssetCode" NOT NULL,
    "debitAmount" DECIMAL(65,30),
    "clpPerUsd" DECIMAL(65,30),
    "btcClpPrice" DECIMAL(65,30),
    "note" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "chargedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientMovementId" TEXT,
    "systemMovementId" TEXT,

    CONSTRAINT "SubscriptionCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminExternalBtcAssignment" (
    "id" TEXT NOT NULL,
    "adminActionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "AdminExternalBtcAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "amountBtc" DECIMAL(65,30) NOT NULL,
    "provider" TEXT,
    "externalReference" TEXT,
    "referencePriceClp" DECIMAL(65,30),
    "referenceFeeClp" DECIMAL(65,30),
    "note" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "assignedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientMovementId" TEXT,
    "systemMovementId" TEXT,

    CONSTRAINT "AdminExternalBtcAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminAction_idempotencyKey_key" ON "AdminAction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AdminAction_targetCompanyId_createdAt_idx" ON "AdminAction"("targetCompanyId", "createdAt");
CREATE INDEX "AdminAction_actorAdminUserId_createdAt_idx" ON "AdminAction"("actorAdminUserId", "createdAt");
CREATE INDEX "AdminAction_type_status_createdAt_idx" ON "AdminAction"("type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminActionEffect_actionId_createdAt_idx" ON "AdminActionEffect"("actionId", "createdAt");
CREATE INDEX "AdminActionEffect_effectType_entityId_idx" ON "AdminActionEffect"("effectType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCharge_adminActionId_key" ON "SubscriptionCharge"("adminActionId");
CREATE INDEX "SubscriptionCharge_companyId_createdAt_idx" ON "SubscriptionCharge"("companyId", "createdAt");
CREATE INDEX "SubscriptionCharge_status_createdAt_idx" ON "SubscriptionCharge"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminExternalBtcAssignment_adminActionId_key" ON "AdminExternalBtcAssignment"("adminActionId");
CREATE INDEX "AdminExternalBtcAssignment_companyId_createdAt_idx" ON "AdminExternalBtcAssignment"("companyId", "createdAt");
CREATE INDEX "AdminExternalBtcAssignment_status_createdAt_idx" ON "AdminExternalBtcAssignment"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminAction"
ADD CONSTRAINT "AdminAction_actorAdminUserId_fkey"
FOREIGN KEY ("actorAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminAction"
ADD CONSTRAINT "AdminAction_targetCompanyId_fkey"
FOREIGN KEY ("targetCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminAction"
ADD CONSTRAINT "AdminAction_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminActionEffect"
ADD CONSTRAINT "AdminActionEffect_actionId_fkey"
FOREIGN KEY ("actionId") REFERENCES "AdminAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubscriptionCharge"
ADD CONSTRAINT "SubscriptionCharge_adminActionId_fkey"
FOREIGN KEY ("adminActionId") REFERENCES "AdminAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubscriptionCharge"
ADD CONSTRAINT "SubscriptionCharge_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SubscriptionCharge"
ADD CONSTRAINT "SubscriptionCharge_clientMovementId_fkey"
FOREIGN KEY ("clientMovementId") REFERENCES "TreasuryMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SubscriptionCharge"
ADD CONSTRAINT "SubscriptionCharge_systemMovementId_fkey"
FOREIGN KEY ("systemMovementId") REFERENCES "TreasuryMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminExternalBtcAssignment"
ADD CONSTRAINT "AdminExternalBtcAssignment_adminActionId_fkey"
FOREIGN KEY ("adminActionId") REFERENCES "AdminAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminExternalBtcAssignment"
ADD CONSTRAINT "AdminExternalBtcAssignment_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminExternalBtcAssignment"
ADD CONSTRAINT "AdminExternalBtcAssignment_clientMovementId_fkey"
FOREIGN KEY ("clientMovementId") REFERENCES "TreasuryMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminExternalBtcAssignment"
ADD CONSTRAINT "AdminExternalBtcAssignment_systemMovementId_fkey"
FOREIGN KEY ("systemMovementId") REFERENCES "TreasuryMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
