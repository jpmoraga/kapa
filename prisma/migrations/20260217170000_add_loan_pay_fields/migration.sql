-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Loan" ADD COLUMN "interestChargedClp" DECIMAL(65,30);
ALTER TABLE "Loan" ADD COLUMN "chargedDays" INTEGER;

-- AlterTable
ALTER TABLE "TreasuryMovement" ADD COLUMN "loanId" TEXT;

-- CreateIndex
CREATE INDEX "TreasuryMovement_loanId_idx" ON "TreasuryMovement"("loanId");

-- AddForeignKey
ALTER TABLE "TreasuryMovement" ADD CONSTRAINT "TreasuryMovement_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
