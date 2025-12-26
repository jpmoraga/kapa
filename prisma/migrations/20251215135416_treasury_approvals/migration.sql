-- CreateEnum
CREATE TYPE "TreasuryMovementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "TreasuryMovement" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByUserId" TEXT,
ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "status" "TreasuryMovementStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "TreasuryMovement_companyId_status_createdAt_idx" ON "TreasuryMovement"("companyId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "TreasuryMovement" ADD CONSTRAINT "TreasuryMovement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryMovement" ADD CONSTRAINT "TreasuryMovement_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
