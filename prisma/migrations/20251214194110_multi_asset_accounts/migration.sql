/*
  Warnings:

  - A unique constraint covering the columns `[companyId,assetCode]` on the table `TreasuryAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AssetCode" AS ENUM ('BTC', 'CLP', 'USD');

-- DropIndex
DROP INDEX "TreasuryAccount_companyId_key";

-- AlterTable
ALTER TABLE "TreasuryAccount" ADD COLUMN     "assetCode" "AssetCode" NOT NULL DEFAULT 'BTC';

-- AlterTable
ALTER TABLE "TreasuryMovement" ADD COLUMN     "assetCode" "AssetCode" NOT NULL DEFAULT 'BTC';

-- CreateIndex
CREATE INDEX "TreasuryAccount_companyId_idx" ON "TreasuryAccount"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "TreasuryAccount_companyId_assetCode_key" ON "TreasuryAccount"("companyId", "assetCode");

-- CreateIndex
CREATE INDEX "TreasuryMovement_companyId_assetCode_createdAt_idx" ON "TreasuryMovement"("companyId", "assetCode", "createdAt");
