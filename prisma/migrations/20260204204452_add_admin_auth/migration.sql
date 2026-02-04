/*
  Warnings:

  - You are about to drop the column `idempotencyKey` on the `TreasuryMovement` table. All the data in the column will be lost.
  - You are about to drop the `AdminSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AdminUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AdminSession" DROP CONSTRAINT "AdminSession_adminUserId_fkey";

-- DropIndex
DROP INDEX "TreasuryMovement_companyId_idempotencyKey_key";

-- DropIndex
DROP INDEX "TreasuryMovement_idempotencyKey_idx";

-- AlterTable
ALTER TABLE "TreasuryMovement" DROP COLUMN "idempotencyKey";

-- DropTable
DROP TABLE "AdminSession";

-- DropTable
DROP TABLE "AdminUser";

-- DropEnum
DROP TYPE "AdminRole";
