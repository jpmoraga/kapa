-- CreateEnum
CREATE TYPE "MiningSimulationEventType" AS ENUM ('SIMULATION_INTERACTION', 'CTA_CLICKED');

-- CreateEnum
CREATE TYPE "MiningSimulatorType" AS ENUM ('FRACTIONAL', 'ASIC');

-- CreateEnum
CREATE TYPE "MiningFractionalPlan" AS ENUM ('PLAN_15_MONTHS', 'PLAN_27_MONTHS');

-- CreateTable
CREATE TABLE "MiningSimulationEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "eventType" "MiningSimulationEventType" NOT NULL,
    "simulatorType" "MiningSimulatorType" NOT NULL,
    "sourcePath" TEXT DEFAULT '/mining',
    "referrer" TEXT,
    "userAgent" TEXT,
    "fractionalPlan" "MiningFractionalPlan",
    "activationAmountUsd" DECIMAL(12,2),
    "estimatedThs" DECIMAL(12,2),
    "hostingMonthlyUsd" DECIMAL(12,2),
    "hostingTotalUsd" DECIMAL(12,2),
    "totalEstimatedUsd" DECIMAL(12,2),
    "asicModel" TEXT,
    "asicQuantity" INTEGER,
    "hashrateTotalThs" DECIMAL(12,2),
    "consumptionTotalW" DECIMAL(12,2),
    "equipmentPriceUsd" DECIMAL(12,2),
    "guaranteeUsd" DECIMAL(12,2),
    "initialCostUsd" DECIMAL(12,2),
    "metadata" JSONB,

    CONSTRAINT "MiningSimulationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MiningSimulationEvent_createdAt_idx" ON "MiningSimulationEvent"("createdAt");

-- CreateIndex
CREATE INDEX "MiningSimulationEvent_sessionId_idx" ON "MiningSimulationEvent"("sessionId");

-- CreateIndex
CREATE INDEX "MiningSimulationEvent_eventType_idx" ON "MiningSimulationEvent"("eventType");

-- CreateIndex
CREATE INDEX "MiningSimulationEvent_simulatorType_idx" ON "MiningSimulationEvent"("simulatorType");

-- CreateIndex
CREATE INDEX "MiningSimulationEvent_fractionalPlan_idx" ON "MiningSimulationEvent"("fractionalPlan");

-- CreateIndex
CREATE INDEX "MiningSimulationEvent_asicModel_idx" ON "MiningSimulationEvent"("asicModel");
