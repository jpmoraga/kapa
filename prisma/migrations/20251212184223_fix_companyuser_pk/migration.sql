/*
  Warnings:

  - You are about to drop the column `id` on the `CompanyUser` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CompanyUser" DROP CONSTRAINT "CompanyUser_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyUser" DROP CONSTRAINT "CompanyUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "TreasuryAccount" DROP CONSTRAINT "TreasuryAccount_companyId_fkey";

-- AlterTable
ALTER TABLE "CompanyUser" DROP COLUMN "id";

-- AddForeignKey
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryAccount" ADD CONSTRAINT "TreasuryAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
