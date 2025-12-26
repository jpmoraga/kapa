-- CreateTable
CREATE TABLE "PersonProfile" (
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "rut" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "PersonProfile_rut_idx" ON "PersonProfile"("rut");

-- AddForeignKey
ALTER TABLE "PersonProfile" ADD CONSTRAINT "PersonProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
