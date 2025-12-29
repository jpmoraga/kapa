-- CreateTable
CREATE TABLE "CronRun" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "inserted" INTEGER NOT NULL,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CronRun_job_createdAt_idx" ON "CronRun"("job", "createdAt");

-- CreateIndex
CREATE INDEX "CronRun_marketId_createdAt_idx" ON "CronRun"("marketId", "createdAt");
