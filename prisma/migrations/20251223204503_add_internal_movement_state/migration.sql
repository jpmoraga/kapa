-- CreateEnum
CREATE TYPE "InternalMovementState" AS ENUM ('NONE', 'WAITING_LIQUIDITY', 'WAITING_BANK_TOPUP', 'WAITING_MIN_SIZE_AGGREGATION', 'RETRYING_BUDA', 'MANUAL_REVIEW', 'FAILED_TEMPORARY');

-- CreateEnum
CREATE TYPE "InternalMovementReason" AS ENUM ('NONE', 'BELOW_BUDA_MIN', 'BUDA_INSUFFICIENT_FUNDS', 'BUDA_API_ERROR', 'PRICE_MISSING', 'UNKNOWN');

-- AlterTable
ALTER TABLE "TreasuryMovement" ADD COLUMN     "internalNote" TEXT,
ADD COLUMN     "internalReason" "InternalMovementReason" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "internalState" "InternalMovementState" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;
