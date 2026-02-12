-- CreateEnum
CREATE TYPE "LoanRepaymentType" AS ENUM ('BULLET');

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "termMonths" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Loan" ADD COLUMN "repaymentType" "LoanRepaymentType" NOT NULL DEFAULT 'BULLET';

-- CreateIndex
CREATE INDEX "Loan_companyId_userId_status_createdAt_idx" ON "Loan"("companyId", "userId", "status", "createdAt");
