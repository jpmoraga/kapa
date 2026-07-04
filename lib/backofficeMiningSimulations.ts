import "server-only";

import {
  MiningFractionalPlan,
  MiningSimulationEventType,
  MiningSimulatorType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const MINING_SIMULATION_RANGE_OPTIONS = [
  { value: "7d", label: "7 días" },
  { value: "30d", label: "30 días" },
  { value: "all", label: "Todo" },
] as const;

export const MINING_SIMULATION_TYPE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "fractional", label: "Fraccionada" },
  { value: "asic", label: "ASIC" },
] as const;

export const MINING_SIMULATION_EVENT_FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "interaction", label: "Interacción" },
  { value: "cta", label: "CTA" },
] as const;

type MiningSimulationRange = (typeof MINING_SIMULATION_RANGE_OPTIONS)[number]["value"];
type MiningSimulationTypeFilter = (typeof MINING_SIMULATION_TYPE_OPTIONS)[number]["value"];
type MiningSimulationEventFilter =
  (typeof MINING_SIMULATION_EVENT_FILTER_OPTIONS)[number]["value"];

export type MiningSimulationReportFilters = {
  range?: string | null;
  type?: string | null;
  event?: string | null;
};

export type MiningSimulationReportMetricLeader = {
  label: string;
  count: number;
} | null;

export type MiningSimulationReportRow = {
  id: string;
  createdAtLabel: string;
  sessionIdShort: string;
  eventTypeLabel: string;
  simulatorTypeLabel: string;
  planOrAsicLabel: string;
  primaryAmountLabel: string;
  thsLabel: string;
  hostingMonthlyLabel: string;
  totalOrInitialLabel: string;
};

export type MiningSimulationReportData = {
  filters: {
    range: MiningSimulationRange;
    type: MiningSimulationTypeFilter;
    event: MiningSimulationEventFilter;
  };
  metrics: {
    totalEvents: number;
    uniqueSessions: number;
    ctaClicks: number;
    interactions: number;
    topFractionalPlan: MiningSimulationReportMetricLeader;
    topAsic: MiningSimulationReportMetricLeader;
  };
  rows: MiningSimulationReportRow[];
  rowLimit: number;
};

const DEFAULT_RANGE: MiningSimulationRange = "30d";
const DEFAULT_TYPE: MiningSimulationTypeFilter = "all";
const DEFAULT_EVENT: MiningSimulationEventFilter = "all";
const REPORT_ROW_LIMIT = 100;

const miningSimulationSelect = {
  id: true,
  createdAt: true,
  sessionId: true,
  eventType: true,
  simulatorType: true,
  fractionalPlan: true,
  activationAmountUsd: true,
  estimatedThs: true,
  hostingMonthlyUsd: true,
  totalEstimatedUsd: true,
  asicModel: true,
  equipmentPriceUsd: true,
  hashrateTotalThs: true,
  initialCostUsd: true,
} satisfies Prisma.MiningSimulationEventSelect;

type MiningSimulationEventRecord = Prisma.MiningSimulationEventGetPayload<{
  select: typeof miningSimulationSelect;
}>;

function normalizeOption<T extends string>(value: string | null | undefined, options: readonly T[], fallback: T) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase() as T;

  return options.includes(normalized) ? normalized : fallback;
}

function buildRangeDate(range: MiningSimulationRange) {
  if (range === "all") {
    return null;
  }

  const days = range === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function buildWhere(filters: {
  range: MiningSimulationRange;
  type: MiningSimulationTypeFilter;
  event: MiningSimulationEventFilter;
}): Prisma.MiningSimulationEventWhereInput {
  const where: Prisma.MiningSimulationEventWhereInput = {};
  const rangeDate = buildRangeDate(filters.range);

  if (rangeDate) {
    where.createdAt = {
      gte: rangeDate,
    };
  }

  if (filters.type === "fractional") {
    where.simulatorType = MiningSimulatorType.FRACTIONAL;
  } else if (filters.type === "asic") {
    where.simulatorType = MiningSimulatorType.ASIC;
  }

  if (filters.event === "interaction") {
    where.eventType = MiningSimulationEventType.SIMULATION_INTERACTION;
  } else if (filters.event === "cta") {
    where.eventType = MiningSimulationEventType.CTA_CLICKED;
  }

  return where;
}

function eventTypeLabel(value: MiningSimulationEventType) {
  return value === MiningSimulationEventType.CTA_CLICKED ? "CTA" : "Interacción";
}

function simulatorTypeLabel(value: MiningSimulatorType) {
  return value === MiningSimulatorType.ASIC ? "ASIC" : "Fraccionada";
}

function fractionalPlanLabel(value: MiningFractionalPlan | null) {
  if (value === MiningFractionalPlan.PLAN_15_MONTHS) {
    return "Plan 15 meses";
  }

  if (value === MiningFractionalPlan.PLAN_27_MONTHS) {
    return "Plan 27 meses";
  }

  return "Sin datos";
}

function formatDateTime(value: Date) {
  const formatter = new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formatter.format(value).replace(",", "");
}

function formatUsd(value: Prisma.Decimal | null) {
  if (!value) {
    return "Sin datos";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `USD ${value.toString()}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatThs(value: Prisma.Decimal | null) {
  if (!value) {
    return "Sin datos";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${value.toString()} TH/s`;
  }

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} TH/s`;
}

function truncateSessionId(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 5)}...${value.slice(-4)}`;
}

function rowFromRecord(record: MiningSimulationEventRecord): MiningSimulationReportRow {
  const isFractional = record.simulatorType === MiningSimulatorType.FRACTIONAL;

  return {
    id: record.id,
    createdAtLabel: formatDateTime(record.createdAt),
    sessionIdShort: truncateSessionId(record.sessionId),
    eventTypeLabel: eventTypeLabel(record.eventType),
    simulatorTypeLabel: simulatorTypeLabel(record.simulatorType),
    planOrAsicLabel: isFractional
      ? fractionalPlanLabel(record.fractionalPlan)
      : record.asicModel?.trim() || "Sin datos",
    primaryAmountLabel: isFractional
      ? formatUsd(record.activationAmountUsd)
      : formatUsd(record.equipmentPriceUsd),
    thsLabel: isFractional ? formatThs(record.estimatedThs) : formatThs(record.hashrateTotalThs),
    hostingMonthlyLabel: formatUsd(record.hostingMonthlyUsd),
    totalOrInitialLabel: isFractional
      ? formatUsd(record.totalEstimatedUsd)
      : formatUsd(record.initialCostUsd),
  };
}

async function getTopFractionalPlan(
  filters: {
    type: MiningSimulationTypeFilter;
  },
  where: Prisma.MiningSimulationEventWhereInput,
): Promise<MiningSimulationReportMetricLeader> {
  if (filters.type === "asic") {
    return null;
  }

  const result = await prisma.miningSimulationEvent.groupBy({
    by: ["fractionalPlan"],
    where: {
      ...where,
      simulatorType: MiningSimulatorType.FRACTIONAL,
      fractionalPlan: {
        not: null,
      },
    },
    _count: {
      fractionalPlan: true,
    },
    orderBy: {
      _count: {
        fractionalPlan: "desc",
      },
    },
    take: 1,
  });

  const leader = result[0];
  if (!leader?.fractionalPlan) {
    return null;
  }

  return {
    label: fractionalPlanLabel(leader.fractionalPlan),
    count: leader._count.fractionalPlan,
  };
}

async function getTopAsicModel(
  filters: {
    type: MiningSimulationTypeFilter;
    event: MiningSimulationEventFilter;
  },
  where: Prisma.MiningSimulationEventWhereInput,
): Promise<MiningSimulationReportMetricLeader> {
  if (filters.type === "fractional") {
    return null;
  }

  const asicWhere: Prisma.MiningSimulationEventWhereInput = {
    ...where,
    simulatorType: MiningSimulatorType.ASIC,
    asicModel: {
      not: null,
    },
  };

  const ctaPriority = filters.event === "all"
    ? await prisma.miningSimulationEvent.groupBy({
        by: ["asicModel"],
        where: {
          ...asicWhere,
          eventType: MiningSimulationEventType.CTA_CLICKED,
        },
        _count: {
          asicModel: true,
        },
        orderBy: {
          _count: {
            asicModel: "desc",
          },
        },
        take: 1,
      })
    : [];

  const fallback = await prisma.miningSimulationEvent.groupBy({
    by: ["asicModel"],
    where: asicWhere,
    _count: {
      asicModel: true,
    },
    orderBy: {
      _count: {
        asicModel: "desc",
      },
    },
    take: 1,
  });

  const leader = ctaPriority[0] ?? fallback[0];
  if (!leader?.asicModel) {
    return null;
  }

  return {
    label: leader.asicModel,
    count: leader._count.asicModel,
  };
}

export async function getMiningSimulationReportData(
  input: MiningSimulationReportFilters,
): Promise<MiningSimulationReportData> {
  const filters = {
    range: normalizeOption(
      input.range,
      MINING_SIMULATION_RANGE_OPTIONS.map((option) => option.value),
      DEFAULT_RANGE,
    ),
    type: normalizeOption(
      input.type,
      MINING_SIMULATION_TYPE_OPTIONS.map((option) => option.value),
      DEFAULT_TYPE,
    ),
    event: normalizeOption(
      input.event,
      MINING_SIMULATION_EVENT_FILTER_OPTIONS.map((option) => option.value),
      DEFAULT_EVENT,
    ),
  };

  const where = buildWhere(filters);

  const [
    totalEvents,
    ctaClicks,
    interactions,
    uniqueSessions,
    topFractionalPlan,
    topAsic,
    rows,
  ] = await Promise.all([
    prisma.miningSimulationEvent.count({ where }),
    prisma.miningSimulationEvent.count({
      where: {
        ...where,
        eventType: MiningSimulationEventType.CTA_CLICKED,
      },
    }),
    prisma.miningSimulationEvent.count({
      where: {
        ...where,
        eventType: MiningSimulationEventType.SIMULATION_INTERACTION,
      },
    }),
    prisma.miningSimulationEvent.groupBy({
      by: ["sessionId"],
      where,
    }),
    getTopFractionalPlan(filters, where),
    getTopAsicModel(filters, where),
    prisma.miningSimulationEvent.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: REPORT_ROW_LIMIT,
      select: miningSimulationSelect,
    }),
  ]);

  return {
    filters,
    metrics: {
      totalEvents,
      uniqueSessions: uniqueSessions.length,
      ctaClicks,
      interactions,
      topFractionalPlan,
      topAsic,
    },
    rows: rows.map(rowFromRecord),
    rowLimit: REPORT_ROW_LIMIT,
  };
}
