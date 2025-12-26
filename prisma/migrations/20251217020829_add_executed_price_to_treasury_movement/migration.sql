-- AlterTable
ALTER TABLE "TreasuryMovement" ADD COLUMN     "executedAt" TIMESTAMP(3),
ADD COLUMN     "executedPrice" DECIMAL(65,30),
ADD COLUMN     "executedQuoteCode" "AssetCode",
ADD COLUMN     "executedSource" TEXT;
