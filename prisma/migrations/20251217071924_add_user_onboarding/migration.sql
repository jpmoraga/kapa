-- CreateTable
CREATE TABLE "user_onboarding" (
    "userId" TEXT NOT NULL,
    "termsAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "user_onboarding" ADD CONSTRAINT "user_onboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
