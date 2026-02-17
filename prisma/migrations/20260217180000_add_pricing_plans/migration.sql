-- CreateTable
CREATE TABLE "PricingPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlanRule" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueDecimal" DECIMAL(65,30),
    "valueInt" INTEGER,
    "valueJson" JSONB,
    "currency" "LoanCurrency",
    "assetCode" "AssetCode",
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingPlanRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyPricing" (
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyPricing_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "UserPricing" (
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPricing_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "PricingPlan_isDefault_idx" ON "PricingPlan"("isDefault");

-- CreateIndex
CREATE INDEX "PricingPlanRule_planId_key_idx" ON "PricingPlanRule"("planId", "key");

-- CreateIndex
CREATE INDEX "CompanyPricing_planId_idx" ON "CompanyPricing"("planId");

-- CreateIndex
CREATE INDEX "UserPricing_planId_idx" ON "UserPricing"("planId");

-- AddForeignKey
ALTER TABLE "PricingPlanRule" ADD CONSTRAINT "PricingPlanRule_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPricing" ADD CONSTRAINT "CompanyPricing_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPricing" ADD CONSTRAINT "CompanyPricing_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPricing" ADD CONSTRAINT "UserPricing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPricing" ADD CONSTRAINT "UserPricing_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PricingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
