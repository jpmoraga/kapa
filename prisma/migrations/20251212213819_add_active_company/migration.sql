-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeCompanyId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeCompanyId_fkey" FOREIGN KEY ("activeCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
