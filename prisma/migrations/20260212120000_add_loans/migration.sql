-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('CREATED', 'APPROVED', 'DISBURSED', 'CLOSED', 'LIQUIDATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanEventType" AS ENUM ('CREATED', 'APPROVED', 'DISBURSED', 'INTEREST_PAID', 'PRINCIPAL_PAID', 'MARGIN_CALL', 'LIQUIDATION', 'COLLATERAL_ADDED', 'COLLATERAL_RELEASED');

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" "AssetCode" NOT NULL DEFAULT 'CLP',
    "principalClp" DECIMAL(65,30) NOT NULL,
    "interestApr" DECIMAL(65,30) NOT NULL,
    "ltvTarget" DECIMAL(65,30) NOT NULL,
    "ltvMax" DECIMAL(65,30) NOT NULL,
    "liquidationLtv" DECIMAL(65,30) NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanCollateral" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "assetCode" "AssetCode" NOT NULL DEFAULT 'BTC',
    "amountSats" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoanCollateral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanEvent" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "type" "LoanEventType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "LoanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Loan_companyId_createdAt_idx" ON "Loan"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "Loan_companyId_status_createdAt_idx" ON "Loan"("companyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Loan_userId_createdAt_idx" ON "Loan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LoanCollateral_loanId_createdAt_idx" ON "LoanCollateral"("loanId", "createdAt");

-- CreateIndex
CREATE INDEX "LoanEvent_loanId_createdAt_idx" ON "LoanEvent"("loanId", "createdAt");

-- CreateIndex
CREATE INDEX "LoanEvent_loanId_type_createdAt_idx" ON "LoanEvent"("loanId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanCollateral" ADD CONSTRAINT "LoanCollateral_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanEvent" ADD CONSTRAINT "LoanEvent_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanEvent" ADD CONSTRAINT "LoanEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
