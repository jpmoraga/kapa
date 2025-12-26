-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "assetCode" "AssetCode" NOT NULL,
    "quoteCode" "AssetCode" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceSnapshot_assetCode_quoteCode_createdAt_idx" ON "PriceSnapshot"("assetCode", "quoteCode", "createdAt");
