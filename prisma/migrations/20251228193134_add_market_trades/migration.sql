-- CreateTable
CREATE TABLE "MarketTrade" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "timeMs" BIGINT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketTrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketTrade_marketId_timeMs_idx" ON "MarketTrade"("marketId", "timeMs");

-- CreateIndex
CREATE UNIQUE INDEX "MarketTrade_marketId_timeMs_price_amount_direction_key" ON "MarketTrade"("marketId", "timeMs", "price", "amount", "direction");
