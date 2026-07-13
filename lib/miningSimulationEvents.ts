import {
  MiningSimulationEventType,
  MiningSimulatorType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const MAX_MINING_SIMULATION_REQUEST_BYTES = 16_384;

const MAX_SESSION_ID_LENGTH = 128;
const MAX_SOURCE_PATH_LENGTH = 255;
const MAX_REFERRER_LENGTH = 1_024;
const MAX_USER_AGENT_LENGTH = 512;
const MAX_METADATA_BYTES = 4_096;

const SIMULATION_EVENT_TYPES = [
  MiningSimulationEventType.SIMULATION_INTERACTION,
  MiningSimulationEventType.CTA_CLICKED,
] as const;

const SIMULATOR_TYPES = [
  MiningSimulatorType.FRACTIONAL,
  MiningSimulatorType.ASIC,
] as const;

const FRACTIONAL_PLAN_CODES = [
  "PLAN_1_YEAR",
  "PLAN_2_YEARS",
  "PLAN_3_YEARS",
] as const;

const FRACTIONAL_PLAN_CONFIG = {
  PLAN_1_YEAR: {
    label: "Plan 1 año",
    pricePerThUsd: 20,
  },
  PLAN_2_YEARS: {
    label: "Plan 2 años",
    pricePerThUsd: 39,
  },
  PLAN_3_YEARS: {
    label: "Plan 3 años",
    pricePerThUsd: 58,
  },
} as const;

type MiningSimulationEventCreateData =
  Prisma.MiningSimulationEventUncheckedCreateInput;

export class MiningSimulationEventValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MiningSimulationEventValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptionalString(
  value: unknown,
  maxLength: number,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function parseRequiredString(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  const normalized = normalizeOptionalString(value, maxLength);

  if (!normalized) {
    throw new MiningSimulationEventValidationError(`${label} es requerido.`);
  }

  return normalized;
}

function parseEnumValue<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  label: string,
): T {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new MiningSimulationEventValidationError(`${label} inválido.`);
  }

  return value as T;
}

function parsePositiveDecimal(
  value: unknown,
  label: string,
  minimum?: number,
): Prisma.Decimal {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new MiningSimulationEventValidationError(
      `${label} debe ser un número positivo.`,
    );
  }

  if (typeof minimum === "number" && parsedValue < minimum) {
    throw new MiningSimulationEventValidationError(
      `${label} debe ser mayor o igual a ${minimum}.`,
    );
  }

  return new Prisma.Decimal(parsedValue);
}

function parsePositiveInteger(value: unknown, label: string, minimum = 1): number {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;

  if (!Number.isInteger(parsedValue) || parsedValue < minimum) {
    throw new MiningSimulationEventValidationError(
      `${label} debe ser un entero mayor o igual a ${minimum}.`,
    );
  }

  return parsedValue;
}

function parseMetadata(value: unknown): Prisma.JsonObject | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const serialized = JSON.stringify(value);

  if (Buffer.byteLength(serialized, "utf8") > MAX_METADATA_BYTES) {
    return undefined;
  }

  return value as Prisma.JsonObject;
}

export function validateMiningSimulationEventPayload(
  payload: unknown,
): MiningSimulationEventCreateData {
  if (!isRecord(payload)) {
    throw new MiningSimulationEventValidationError("Payload inválido.");
  }

  const sessionId = parseRequiredString(
    payload.sessionId,
    "sessionId",
    MAX_SESSION_ID_LENGTH,
  );
  const eventType = parseEnumValue(
    payload.eventType,
    SIMULATION_EVENT_TYPES,
    "eventType",
  );
  const simulatorType = parseEnumValue(
    payload.simulatorType,
    SIMULATOR_TYPES,
    "simulatorType",
  );
  const sourcePath =
    normalizeOptionalString(payload.sourcePath, MAX_SOURCE_PATH_LENGTH) ?? "/mining";
  const referrer = normalizeOptionalString(payload.referrer, MAX_REFERRER_LENGTH);
  const userAgent = normalizeOptionalString(payload.userAgent, MAX_USER_AGENT_LENGTH);
  const metadata = parseMetadata(payload.metadata);

  const commonData: MiningSimulationEventCreateData = {
    sessionId,
    eventType,
    simulatorType,
    sourcePath,
    referrer,
    userAgent,
    metadata,
  };

  if (simulatorType === MiningSimulatorType.FRACTIONAL) {
    const fractionalPlan = parseEnumValue(
      payload.fractionalPlan,
      FRACTIONAL_PLAN_CODES,
      "fractionalPlan",
    );
    const estimatedThs = parsePositiveDecimal(payload.estimatedThs, "estimatedThs");
    const planConfig = FRACTIONAL_PLAN_CONFIG[fractionalPlan];
    const mergedMetadata: Prisma.JsonObject = {
      ...(metadata ?? {}),
      billingModel: "single_upfront_hosting_included",
      fractionalPlanCode: fractionalPlan,
      fractionalPlanLabel: planConfig.label,
      hostingIncluded: true,
      paymentModel: "single_upfront",
      pricePerThUsd: planConfig.pricePerThUsd,
    };
    const totalEstimatedUsd = new Prisma.Decimal(
      Number(estimatedThs) * planConfig.pricePerThUsd,
    );

    return {
      ...commonData,
      metadata: mergedMetadata,
      activationAmountUsd: new Prisma.Decimal(planConfig.pricePerThUsd),
      estimatedThs,
      totalEstimatedUsd,
    };
  }

  return {
    ...commonData,
    asicModel: parseRequiredString(payload.asicModel, "asicModel", 255),
    asicQuantity: parsePositiveInteger(payload.asicQuantity, "asicQuantity"),
    hashrateTotalThs: parsePositiveDecimal(
      payload.hashrateTotalThs,
      "hashrateTotalThs",
    ),
    consumptionTotalW: parsePositiveDecimal(
      payload.consumptionTotalW,
      "consumptionTotalW",
    ),
    equipmentPriceUsd: parsePositiveDecimal(
      payload.equipmentPriceUsd,
      "equipmentPriceUsd",
    ),
    hostingMonthlyUsd: parsePositiveDecimal(
      payload.hostingMonthlyUsd,
      "hostingMonthlyUsd",
    ),
    guaranteeUsd: parsePositiveDecimal(payload.guaranteeUsd, "guaranteeUsd"),
    initialCostUsd: parsePositiveDecimal(payload.initialCostUsd, "initialCostUsd"),
  };
}

// The public simulators should call this only after explicit user interaction or CTA clicks.
export async function createMiningSimulationEvent(payload: unknown) {
  const data = validateMiningSimulationEventPayload(payload);

  return prisma.miningSimulationEvent.create({
    data,
    select: {
      id: true,
    },
  });
}
