/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `BankAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BankAccount" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "PersonProfile" ADD COLUMN     "birthDate" TEXT,
ADD COLUMN     "documentSerial" TEXT,
ADD COLUMN     "idDocumentImagePath" TEXT,
ADD COLUMN     "nationality" TEXT;
