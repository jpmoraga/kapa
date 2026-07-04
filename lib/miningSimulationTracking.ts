export const MINING_SIMULATION_INTERACTION_DEBOUNCE_MS = 900;

const MINING_SIMULATION_SESSION_STORAGE_KEY = "kapa21_mining_session_id";
const MINING_SIMULATION_SOURCE_PATH = "/mining";

let fallbackSessionId: string | null = null;

type MiningSimulationEventType = "SIMULATION_INTERACTION" | "CTA_CLICKED";
type MiningFractionalPlan = "PLAN_15_MONTHS" | "PLAN_27_MONTHS";

type MiningSimulationBasePayload = {
  eventType: MiningSimulationEventType;
  sourcePath?: string;
};

export type MiningFractionalSimulationTrackingPayload =
  MiningSimulationBasePayload & {
    simulatorType: "FRACTIONAL";
    fractionalPlan: MiningFractionalPlan;
    activationAmountUsd: number;
    estimatedThs: number;
    hostingMonthlyUsd: number;
    hostingTotalUsd: number;
    totalEstimatedUsd: number;
  };

export type MiningAsicSimulationTrackingPayload = MiningSimulationBasePayload & {
  simulatorType: "ASIC";
  asicModel: string;
  asicQuantity: number;
  hashrateTotalThs: number;
  consumptionTotalW: number;
  equipmentPriceUsd: number;
  hostingMonthlyUsd: number;
  guaranteeUsd: number;
  initialCostUsd: number;
};

export type MiningSimulationTrackingPayload =
  | MiningFractionalSimulationTrackingPayload
  | MiningAsicSimulationTrackingPayload;

type TrackMiningSimulationEventOptions = {
  keepalive?: boolean;
};

function createAnonymousSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `ms_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function roundMiningSimulationValue(value: number) {
  return Number(value.toFixed(2));
}

export function getMiningSimulationEventSignature(
  payload: MiningSimulationTrackingPayload,
) {
  return JSON.stringify(payload);
}

export function getMiningSimulationSessionId() {
  if (fallbackSessionId) {
    return fallbackSessionId;
  }

  const nextSessionId = createAnonymousSessionId();

  if (typeof window === "undefined") {
    fallbackSessionId = nextSessionId;
    return fallbackSessionId;
  }

  try {
    const existingSessionId = window.localStorage.getItem(
      MINING_SIMULATION_SESSION_STORAGE_KEY,
    );

    if (existingSessionId?.trim()) {
      fallbackSessionId = existingSessionId.trim();
      return fallbackSessionId;
    }

    window.localStorage.setItem(
      MINING_SIMULATION_SESSION_STORAGE_KEY,
      nextSessionId,
    );
  } catch {
    fallbackSessionId = nextSessionId;
    return fallbackSessionId;
  }

  fallbackSessionId = nextSessionId;
  return fallbackSessionId;
}

export async function trackMiningSimulationEvent(
  payload: MiningSimulationTrackingPayload,
  options?: TrackMiningSimulationEventOptions,
) {
  if (typeof window === "undefined") {
    return false;
  }

  const body = {
    ...payload,
    sessionId: getMiningSimulationSessionId(),
    sourcePath: payload.sourcePath ?? MINING_SIMULATION_SOURCE_PATH,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent || undefined,
  };

  try {
    const response = await fetch("/api/mining/simulations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      keepalive: options?.keepalive === true,
      cache: "no-store",
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to track mining simulation event", response.status);
      }

      return false;
    }

    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to track mining simulation event", error);
    }

    return false;
  }
}
