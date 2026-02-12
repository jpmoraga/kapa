-- CreateEnum
CREATE TYPE "LoanCurrency" AS ENUM ('CLP');

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "disbursementMovementId" TEXT;

-- AlterTable
ALTER TABLE "Loan" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "Loan" ALTER COLUMN "currency" TYPE "LoanCurrency" USING ("currency"::text::"LoanCurrency");
ALTER TABLE "Loan" ALTER COLUMN "currency" SET DEFAULT 'CLP';

-- CreateIndex
CREATE INDEX "Loan_companyId_disbursementMovementId_idx" ON "Loan"("companyId", "disbursementMovementId");
