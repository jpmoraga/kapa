-- CreateTable
CREATE TABLE "TreasuryMovement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TreasuryMovement_companyId_createdAt_idx" ON "TreasuryMovement"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "TreasuryMovement" ADD CONSTRAINT "TreasuryMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
