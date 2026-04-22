-- CreateEnum
CREATE TYPE "CompanyReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'OBSERVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CompanyReviewSource" AS ENUM ('CLIENT', 'ADMIN');

-- CreateTable
CREATE TABLE "CompanyReview" (
    "companyId" TEXT NOT NULL,
    "status" "CompanyReviewStatus" NOT NULL DEFAULT 'PENDING',
    "source" "CompanyReviewSource" NOT NULL,
    "submittedByUserId" TEXT,
    "submittedByEmail" TEXT,
    "submittedByName" TEXT,
    "submissionNote" TEXT,
    "reviewedByAdminUserId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyReview_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "uploadedByUserId" TEXT,
    "uploadedByAdminUserId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'company_support',
    "storageBucket" TEXT,
    "filePath" TEXT,
    "fileName" TEXT,
    "fileMime" TEXT,
    "fileSizeBytes" BIGINT,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyReview_status_updatedAt_idx" ON "CompanyReview"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "CompanyReview_source_createdAt_idx" ON "CompanyReview"("source", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyReview_submittedByUserId_idx" ON "CompanyReview"("submittedByUserId");

-- CreateIndex
CREATE INDEX "CompanyReview_reviewedByAdminUserId_idx" ON "CompanyReview"("reviewedByAdminUserId");

-- CreateIndex
CREATE INDEX "CompanyDocument_companyId_createdAt_idx" ON "CompanyDocument"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyDocument_uploadedByUserId_idx" ON "CompanyDocument"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "CompanyDocument_uploadedByAdminUserId_idx" ON "CompanyDocument"("uploadedByAdminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_createdAt_idx" ON "PasswordResetToken"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "CompanyReview" ADD CONSTRAINT "CompanyReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyReview" ADD CONSTRAINT "CompanyReview_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyReview" ADD CONSTRAINT "CompanyReview_reviewedByAdminUserId_fkey" FOREIGN KEY ("reviewedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_uploadedByAdminUserId_fkey" FOREIGN KEY ("uploadedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
