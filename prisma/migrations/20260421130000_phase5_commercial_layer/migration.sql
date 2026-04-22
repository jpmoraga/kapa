-- CreateEnum
CREATE TYPE "CommercialStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'RESTRICTED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CompanySubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CompanySubscriptionPlan" AS ENUM ('BASE', 'FREE_TEMP', 'CUSTOM_FIXED_USD');

-- CreateEnum
CREATE TYPE "CommercialAuditType" AS ENUM (
  'COMMERCIAL_STATUS_UPDATED',
  'SUBSCRIPTION_UPDATED',
  'COMPANY_PRICING_UPDATED',
  'PRICING_PLAN_UPDATED'
);

-- CreateTable
CREATE TABLE "CompanyCommercialProfile" (
    "companyId" TEXT NOT NULL,
    "status" "CommercialStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "specialTermsNote" TEXT,
    "updatedByAdminUserId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyCommercialProfile_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "CompanySubscription" (
    "companyId" TEXT NOT NULL,
    "status" "CompanySubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
    "plan" "CompanySubscriptionPlan" NOT NULL DEFAULT 'BASE',
    "customAmountUsd" DECIMAL(65,30),
    "startedAt" TIMESTAMPTZ(6),
    "endsAt" TIMESTAMPTZ(6),
    "note" TEXT,
    "updatedByAdminUserId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanySubscription_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "CompanyPricingOverride" (
    "companyId" TEXT NOT NULL,
    "buyBtcFeePct" DECIMAL(65,30),
    "sellBtcFeePct" DECIMAL(65,30),
    "loanAprStandard" DECIMAL(65,30),
    "loanAprSubscriber" DECIMAL(65,30),
    "note" TEXT,
    "updatedByAdminUserId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyPricingOverride_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "CommercialAuditLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "pricingPlanId" TEXT,
    "actorAdminUserId" TEXT,
    "type" "CommercialAuditType" NOT NULL,
    "note" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommercialAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyCommercialProfile_status_updatedAt_idx" ON "CompanyCommercialProfile"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "CompanyCommercialProfile_updatedByAdminUserId_idx" ON "CompanyCommercialProfile"("updatedByAdminUserId");

-- CreateIndex
CREATE INDEX "CompanySubscription_status_updatedAt_idx" ON "CompanySubscription"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "CompanySubscription_updatedByAdminUserId_idx" ON "CompanySubscription"("updatedByAdminUserId");

-- CreateIndex
CREATE INDEX "CompanyPricingOverride_updatedByAdminUserId_idx" ON "CompanyPricingOverride"("updatedByAdminUserId");

-- CreateIndex
CREATE INDEX "CommercialAuditLog_companyId_createdAt_idx" ON "CommercialAuditLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "CommercialAuditLog_pricingPlanId_createdAt_idx" ON "CommercialAuditLog"("pricingPlanId", "createdAt");

-- CreateIndex
CREATE INDEX "CommercialAuditLog_actorAdminUserId_createdAt_idx" ON "CommercialAuditLog"("actorAdminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "CommercialAuditLog_type_createdAt_idx" ON "CommercialAuditLog"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "CompanyCommercialProfile" ADD CONSTRAINT "CompanyCommercialProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyCommercialProfile" ADD CONSTRAINT "CompanyCommercialProfile_updatedByAdminUserId_fkey" FOREIGN KEY ("updatedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_updatedByAdminUserId_fkey" FOREIGN KEY ("updatedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPricingOverride" ADD CONSTRAINT "CompanyPricingOverride_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPricingOverride" ADD CONSTRAINT "CompanyPricingOverride_updatedByAdminUserId_fkey" FOREIGN KEY ("updatedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialAuditLog" ADD CONSTRAINT "CommercialAuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialAuditLog" ADD CONSTRAINT "CommercialAuditLog_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES "PricingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialAuditLog" ADD CONSTRAINT "CommercialAuditLog_actorAdminUserId_fkey" FOREIGN KEY ("actorAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
