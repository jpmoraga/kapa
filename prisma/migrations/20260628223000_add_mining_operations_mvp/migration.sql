DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MiningOperationProductType') THEN
    CREATE TYPE "MiningOperationProductType" AS ENUM (
      'FRACTIONAL_MINING',
      'TOKENIZED_MINING',
      'ASIC_HOSTING',
      'HOSTING_ONLY',
      'OTHER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MiningMoneyCurrency') THEN
    CREATE TYPE "MiningMoneyCurrency" AS ENUM (
      'USD',
      'CLP',
      'BTC'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MiningCommercialStatus') THEN
    CREATE TYPE "MiningCommercialStatus" AS ENUM (
      'CONTRACT_PREPARATION',
      'CONTRACT_SENT',
      'CONTRACT_SIGNED',
      'PAYMENT_PENDING',
      'PAYMENT_RECEIVED',
      'PAYMENT_PROOF_UPLOADED',
      'CANCELLED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MiningOperationalStatus') THEN
    CREATE TYPE "MiningOperationalStatus" AS ENUM (
      'NOT_SHARED',
      'READY_FOR_ANDES',
      'RECEIVED_BY_ANDES',
      'ACTIVATION_PENDING',
      'ACTIVE',
      'INCIDENT',
      'CLOSED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MiningPartnerLevel') THEN
    CREATE TYPE "MiningPartnerLevel" AS ENUM (
      'BRONZE',
      'SILVER',
      'GOLD'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MiningCommissionStatus') THEN
    CREATE TYPE "MiningCommissionStatus" AS ENUM (
      'NOT_APPLICABLE',
      'PENDING_CALCULATION',
      'CALCULATED',
      'INVOICED',
      'PAID',
      'RECEIVED',
      'DISPUTED'
    );
  END IF;
END
$$;

CREATE TABLE "MiningOperation" (
  "id" TEXT NOT NULL,
  "prospectId" TEXT,
  "clientName" TEXT NOT NULL,
  "clientCompanyName" TEXT,
  "country" TEXT NOT NULL DEFAULT 'Chile',
  "whatsapp" TEXT,
  "email" TEXT,
  "instagramUrl" TEXT,
  "linkedinUrl" TEXT,
  "xUrl" TEXT,
  "productType" "MiningOperationProductType" NOT NULL DEFAULT 'OTHER',
  "productDescription" TEXT,
  "asicModel" TEXT,
  "quantity" INTEGER,
  "grossSaleAmount" DECIMAL(18,8),
  "grossSaleCurrency" "MiningMoneyCurrency" NOT NULL DEFAULT 'USD',
  "paymentCurrency" "MiningMoneyCurrency" NOT NULL DEFAULT 'USD',
  "grossSaleAmountClp" DECIMAL(18,2),
  "grossSaleAmountBtc" DECIMAL(18,8),
  "commercialStatus" "MiningCommercialStatus" NOT NULL DEFAULT 'CONTRACT_PREPARATION',
  "contractPreparationAt" TIMESTAMP(3),
  "contractSentAt" TIMESTAMP(3),
  "contractSignedAt" TIMESTAMP(3),
  "paymentPendingAt" TIMESTAMP(3),
  "paymentReceivedAt" TIMESTAMP(3),
  "paymentProofUploadedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "docusignUrl" TEXT,
  "signedContractUrl" TEXT,
  "paymentProofUrl" TEXT,
  "operationalStatus" "MiningOperationalStatus" NOT NULL DEFAULT 'NOT_SHARED',
  "sharedWithPartnerAt" TIMESTAMP(3),
  "receivedByAndesAt" TIMESTAMP(3),
  "activationPendingAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "incidentAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "andesOperationalNotes" TEXT,
  "partnerLevel" "MiningPartnerLevel" NOT NULL DEFAULT 'BRONZE',
  "salesCommissionRate" DECIMAL(7,4),
  "salesCommissionAmount" DECIMAL(18,8),
  "salesCommissionCurrency" "MiningMoneyCurrency" NOT NULL DEFAULT 'USD',
  "commissionStatus" "MiningCommissionStatus" NOT NULL DEFAULT 'PENDING_CALCULATION',
  "commissionDueAt" TIMESTAMP(3),
  "commissionPaidAt" TIMESTAMP(3),
  "commissionReceivedAt" TIMESTAMP(3),
  "commissionPaymentProofUrl" TEXT,
  "monthlyHostingAmount" DECIMAL(18,8),
  "monthlyHostingCurrency" "MiningMoneyCurrency" NOT NULL DEFAULT 'USD',
  "monthlyHostingCommissionRate" DECIMAL(7,4),
  "monthlyHostingCommissionAmount" DECIMAL(18,8),
  "hostingCommissionActive" BOOLEAN NOT NULL DEFAULT false,
  "commissionNotes" TEXT,
  "nextAction" TEXT,
  "nextActionAt" TIMESTAMP(3),
  "internalNotes" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MiningOperation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MiningOperation_prospectId_key" ON "MiningOperation"("prospectId");
CREATE INDEX "MiningOperation_productType_updatedAt_idx" ON "MiningOperation"("productType", "updatedAt");
CREATE INDEX "MiningOperation_commercialStatus_updatedAt_idx" ON "MiningOperation"("commercialStatus", "updatedAt");
CREATE INDEX "MiningOperation_operationalStatus_updatedAt_idx" ON "MiningOperation"("operationalStatus", "updatedAt");
CREATE INDEX "MiningOperation_commissionStatus_updatedAt_idx" ON "MiningOperation"("commissionStatus", "updatedAt");
CREATE INDEX "MiningOperation_grossSaleCurrency_updatedAt_idx" ON "MiningOperation"("grossSaleCurrency", "updatedAt");
CREATE INDEX "MiningOperation_country_updatedAt_idx" ON "MiningOperation"("country", "updatedAt");
CREATE INDEX "MiningOperation_partnerLevel_updatedAt_idx" ON "MiningOperation"("partnerLevel", "updatedAt");
CREATE INDEX "MiningOperation_nextActionAt_idx" ON "MiningOperation"("nextActionAt");
CREATE INDEX "MiningOperation_createdById_idx" ON "MiningOperation"("createdById");
CREATE INDEX "MiningOperation_updatedById_idx" ON "MiningOperation"("updatedById");

ALTER TABLE "MiningOperation"
ADD CONSTRAINT "MiningOperation_prospectId_fkey"
FOREIGN KEY ("prospectId") REFERENCES "MiningProspect"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "MiningOperation"
ADD CONSTRAINT "MiningOperation_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "BackofficeUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "MiningOperation"
ADD CONSTRAINT "MiningOperation_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "BackofficeUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
