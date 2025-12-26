-- AlterTable
ALTER TABLE "TreasuryMovement" ADD COLUMN     "executedBaseAmount" DECIMAL(65,30),
ADD COLUMN     "executedFeeAmount" DECIMAL(65,30),
ADD COLUMN     "executedFeeCode" "AssetCode",
ADD COLUMN     "executedQuoteAmount" DECIMAL(65,30),
ADD COLUMN     "externalOrderId" TEXT,
ADD COLUMN     "externalVenue" TEXT;
