-- Add SystemWalletSnapshot table for persisted system wallet snapshots

CREATE TABLE IF NOT EXISTS "SystemWalletSnapshot" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "at" TIMESTAMP(3) NOT NULL,
  "payload" JSONB NOT NULL,
  CONSTRAINT "SystemWalletSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SystemWalletSnapshot_createdAt_idx"
  ON "SystemWalletSnapshot"("createdAt");
