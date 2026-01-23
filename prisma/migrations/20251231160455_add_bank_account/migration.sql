-- CreateTable
CREATE TABLE "BankAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountType" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "holderRut" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "BankAccount_userId_key" ON "BankAccount"("userId");
CREATE INDEX "BankAccount_holderRut_idx" ON "BankAccount"("holderRut");

-- Foreign key
ALTER TABLE "BankAccount"
ADD CONSTRAINT "BankAccount_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;