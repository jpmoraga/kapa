/*
  Warnings:

  - A unique constraint covering the columns `[personalOwnerId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CompanyKind" AS ENUM ('PERSONAL', 'BUSINESS');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "kind" "CompanyKind" NOT NULL DEFAULT 'BUSINESS',
ADD COLUMN     "personalOwnerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Company_personalOwnerId_key" ON "Company"("personalOwnerId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_personalOwnerId_fkey" FOREIGN KEY ("personalOwnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
