-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "companyRut" TEXT,
ADD COLUMN     "fundsDeclAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacyAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);
