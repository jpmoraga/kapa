/*
  Warnings:

  - You are about to drop the column `idDocumentImagePath` on the `PersonProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PersonProfile" DROP COLUMN "idDocumentImagePath",
ADD COLUMN     "idDocumentBackPath" TEXT,
ADD COLUMN     "idDocumentFrontPath" TEXT;
