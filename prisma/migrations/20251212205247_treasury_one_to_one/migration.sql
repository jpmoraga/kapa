/*
  Warnings:

  - A unique constraint covering the columns `[companyId]` on the table `TreasuryAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TreasuryAccount_companyId_key" ON "TreasuryAccount"("companyId");
