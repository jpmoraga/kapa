import "server-only";

import {
  MiningInterestType,
  MiningProspectSource,
  MiningProspectStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const MINING_SOURCE_OPTIONS: ReadonlyArray<{
  value: MiningProspectSource;
  label: string;
}> = [
  { value: MiningProspectSource.WHATSAPP, label: "WhatsApp" },
  { value: MiningProspectSource.INSTAGRAM, label: "Instagram" },
  { value: MiningProspectSource.LINKEDIN, label: "LinkedIn" },
  { value: MiningProspectSource.X, label: "X / Twitter" },
  { value: MiningProspectSource.WEB, label: "Web" },
  { value: MiningProspectSource.REFERRAL, label: "Referido" },
  { value: MiningProspectSource.PERSONAL, label: "Contacto personal" },
  { value: MiningProspectSource.OTHER, label: "Otro" },
] as const;

export const MINING_INTEREST_TYPE_OPTIONS: ReadonlyArray<{
  value: MiningInterestType;
  label: string;
}> = [
  { value: MiningInterestType.FRACTIONAL_MINING, label: "Minería fraccionada" },
  { value: MiningInterestType.TOKENIZED_MINING, label: "Minería tokenizada" },
  { value: MiningInterestType.ASIC_PURCHASE, label: "Compra de ASIC" },
  { value: MiningInterestType.UNDEFINED, label: "No definido" },
] as const;

export const MINING_STATUS_OPTIONS: ReadonlyArray<{
  value: MiningProspectStatus;
  label: string;
}> = [
  { value: MiningProspectStatus.NEW_INTEREST, label: "Nuevo interés" },
  { value: MiningProspectStatus.MEETING_SCHEDULED, label: "Reunión agendada" },
  { value: MiningProspectStatus.MEETING_DONE, label: "Reunión realizada" },
  { value: MiningProspectStatus.FOLLOW_UP, label: "Seguimiento" },
  { value: MiningProspectStatus.READY_FOR_CONTRACT, label: "Listo para contrato" },
  { value: MiningProspectStatus.DORMANT, label: "Dormido" },
  { value: MiningProspectStatus.DISCARDED, label: "Descartado" },
] as const;

export const MINING_ACTION_FILTER_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Con acción pendiente" },
  { value: "due-now", label: "Vence ahora" },
  { value: "manual", label: "Con próxima acción manual" },
] as const;

export type MiningActionFilter = (typeof MINING_ACTION_FILTER_OPTIONS)[number]["value"];

export type MiningProspectFilters = {
  source?: string | null;
  interestType?: string | null;
  status?: string | null;
  country?: string | null;
  actionFilter?: string | null;
};

const miningProspectSelect = {
  id: true,
  name: true,
  companyName: true,
  country: true,
  whatsapp: true,
  instagramUrl: true,
  linkedinUrl: true,
  xUrl: true,
  email: true,
  source: true,
  interestType: true,
  estimatedAmountUsd: true,
  status: true,
  firstContactAt: true,
  meetingScheduledAt: true,
  meetingDoneAt: true,
  followUpAt: true,
  readyForContractAt: true,
  dormantAt: true,
  discardedAt: true,
  nextAction: true,
  nextActionAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
  createdBy: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
} satisfies Prisma.MiningProspectSelect;

type MiningProspectRecord = Prisma.MiningProspectGetPayload<{
  select: typeof miningProspectSelect;
}>;

type MiningProspectDateFields = {
  firstContactAt: Date | null;
  meetingScheduledAt: Date | null;
  meetingDoneAt: Date | null;
  followUpAt: Date | null;
  readyForContractAt: Date | null;
  dormantAt: Date | null;
  discardedAt: Date | null;
};

type ProspectTimestampPatch = Partial<MiningProspectDateFields>;

const STATUS_TIMESTAMP_FIELD: Record<
  MiningProspectStatus,
  keyof MiningProspectDateFields
> = {
  [MiningProspectStatus.NEW_INTEREST]: "firstContactAt",
  [MiningProspectStatus.MEETING_SCHEDULED]: "meetingScheduledAt",
  [MiningProspectStatus.MEETING_DONE]: "meetingDoneAt",
  [MiningProspectStatus.FOLLOW_UP]: "followUpAt",
  [MiningProspectStatus.READY_FOR_CONTRACT]: "readyForContractAt",
  [MiningProspectStatus.DORMANT]: "dormantAt",
  [MiningProspectStatus.DISCARDED]: "discardedAt",
};

export type MiningSuggestedAction = {
  text: string;
  at: string | null;
  hasPendingAction: boolean;
  isDueNow: boolean;
};

export type MiningProspectListItem = {
  id: string;
  name: string;
  companyName: string | null;
  country: string;
  whatsapp: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  email: string | null;
  source: MiningProspectSource;
  sourceLabel: string;
  interestType: MiningInterestType;
  interestTypeLabel: string;
  estimatedAmountUsd: string | null;
  status: MiningProspectStatus;
  statusLabel: string;
  nextActionManual: string | null;
  nextActionAt: string | null;
  isNextActionDueNow: boolean;
  suggestedAction: MiningSuggestedAction;
  effectiveNextAction: string;
  primaryContactLabel: string;
  primaryContactValue: string;
  lastActivityAt: string;
  updatedAt: string;
};

export type MiningMetrics = {
  totalProspects: number;
  newInterest: number;
  meetingsScheduled: number;
  meetingsDone: number;
  followUp: number;
  readyForContract: number;
  dormant: number;
  discarded: number;
};

export type MiningPendingActionItem = {
  id: string;
  name: string;
  primaryContactLabel: string;
  primaryContactValue: string;
  sourceLabel: string;
  interestTypeLabel: string;
  statusLabel: string;
  actionText: string;
  actionAt: string | null;
  isDueNow: boolean;
  isManual: boolean;
};

export type MiningPageData = {
  filters: {
    source: string;
    interestType: string;
    status: string;
    country: string;
    actionFilter: MiningActionFilter;
  };
  rows: MiningProspectListItem[];
  metrics: MiningMetrics;
  pendingActions: MiningPendingActionItem[];
  countryOptions: string[];
};

export type MiningProspectDetail = {
  id: string;
  name: string;
  companyName: string;
  country: string;
  whatsapp: string;
  instagramUrl: string;
  linkedinUrl: string;
  xUrl: string;
  email: string;
  source: MiningProspectSource;
  interestType: MiningInterestType;
  estimatedAmountUsd: string;
  status: MiningProspectStatus;
  nextAction: string;
  nextActionAt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  automaticDates: Record<string, string | null>;
  suggestedAction: MiningSuggestedAction;
  primaryContactLabel: string;
  primaryContactValue: string;
};

type MiningProspectMutationInput = {
  name: string;
  companyName?: string | null;
  country?: string | null;
  whatsapp?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  email?: string | null;
  source?: string | null;
  interestType?: string | null;
  estimatedAmountUsd?: string | null;
  status?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  notes?: string | null;
};

function optionLabel<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function normalizeText(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

function normalizeRequiredText(value: string | null | undefined, field: string) {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new Error(`${field}_required`);
  }
  return normalized;
}

function normalizeCountry(value: string | null | undefined) {
  return normalizeText(value) ?? "Chile";
}

function normalizeOptionalEmail(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : null;
}

function normalizeOptionalUrl(value: string | null | undefined) {
  return normalizeText(value) ?? null;
}

function normalizeSource(value: string | null | undefined) {
  const normalized = String(value ?? MiningProspectSource.OTHER)
    .trim()
    .toUpperCase();
  if (Object.values(MiningProspectSource).includes(normalized as MiningProspectSource)) {
    return normalized as MiningProspectSource;
  }
  throw new Error("invalid_source");
}

function normalizeInterestType(value: string | null | undefined) {
  const normalized = String(value ?? MiningInterestType.UNDEFINED)
    .trim()
    .toUpperCase();
  if (Object.values(MiningInterestType).includes(normalized as MiningInterestType)) {
    return normalized as MiningInterestType;
  }
  throw new Error("invalid_interest_type");
}

function normalizeStatus(value: string | null | undefined) {
  const normalized = String(value ?? MiningProspectStatus.NEW_INTEREST)
    .trim()
    .toUpperCase();
  if (Object.values(MiningProspectStatus).includes(normalized as MiningProspectStatus)) {
    return normalized as MiningProspectStatus;
  }
  throw new Error("invalid_status");
}

function normalizeActionFilter(value: string | null | undefined): MiningActionFilter {
  const normalized = String(value ?? "all").trim().toLowerCase();
  return MINING_ACTION_FILTER_OPTIONS.some((option) => option.value === normalized)
    ? (normalized as MiningActionFilter)
    : "all";
}

function parseNullableDate(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_next_action_at");
  }
  return date;
}

function parseNullableDecimal(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const sanitized = normalized.replace(/\$/g, "").replace(/\s+/g, "").replace(/,/g, "");
  let decimal: Prisma.Decimal;

  try {
    decimal = new Prisma.Decimal(sanitized);
  } catch {
    throw new Error("invalid_estimated_amount_usd");
  }

  if (decimal.lt(0)) {
    throw new Error("invalid_estimated_amount_usd");
  }

  return decimal;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function toDecimalString(value: Prisma.Decimal | null | undefined) {
  return value ? value.toString() : null;
}

function maxDate(values: Array<Date | null | undefined>) {
  const filtered = values.filter((value): value is Date => Boolean(value));
  if (!filtered.length) return null;
  return filtered.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest
  );
}

function normalizeEnumFilter<T extends string>(value: string | null | undefined, allowed: T[]) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return allowed.includes(normalized as T) ? (normalized as T) : "";
}

function readProspectDates(
  prospect: Pick<MiningProspectRecord, keyof MiningProspectDateFields>
): MiningProspectDateFields {
  return {
    firstContactAt: prospect.firstContactAt,
    meetingScheduledAt: prospect.meetingScheduledAt,
    meetingDoneAt: prospect.meetingDoneAt,
    followUpAt: prospect.followUpAt,
    readyForContractAt: prospect.readyForContractAt,
    dormantAt: prospect.dormantAt,
    discardedAt: prospect.discardedAt,
  };
}

function pickAutomaticTimestampPatch(
  status: MiningProspectStatus,
  currentDates: MiningProspectDateFields
) {
  const field = STATUS_TIMESTAMP_FIELD[status];
  if (currentDates[field]) return {};
  return { [field]: new Date() } satisfies ProspectTimestampPatch;
}

function pickPrimaryContact(
  prospect: Pick<
    MiningProspectRecord,
    "whatsapp" | "email" | "instagramUrl" | "linkedinUrl" | "xUrl"
  >
) {
  if (prospect.whatsapp) {
    return { label: "WhatsApp", value: prospect.whatsapp };
  }
  if (prospect.email) {
    return { label: "Email", value: prospect.email };
  }
  if (prospect.instagramUrl) {
    return { label: "Instagram", value: prospect.instagramUrl };
  }
  if (prospect.linkedinUrl) {
    return { label: "LinkedIn", value: prospect.linkedinUrl };
  }
  if (prospect.xUrl) {
    return { label: "X / Twitter", value: prospect.xUrl };
  }
  return { label: "Contacto", value: "Sin canal definido" };
}

export function suggestMiningNextAction(
  prospect: Pick<MiningProspectRecord, "status">
): MiningSuggestedAction {
  switch (prospect.status) {
    case MiningProspectStatus.NEW_INTEREST:
      return {
        text: "Contactar y calificar interés",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningProspectStatus.MEETING_SCHEDULED:
      return {
        text: "Preparar reunión",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningProspectStatus.MEETING_DONE:
      return {
        text: "Enviar información o definir modalidad",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningProspectStatus.FOLLOW_UP:
      return {
        text: "Hacer seguimiento",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningProspectStatus.READY_FOR_CONTRACT:
      return {
        text: "Preparar datos y enviar contrato",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningProspectStatus.DORMANT:
    case MiningProspectStatus.DISCARDED:
      return {
        text: "Sin acción inmediata",
        at: null,
        hasPendingAction: false,
        isDueNow: false,
      };
  }

  return {
    text: "Sin acción inmediata",
    at: null,
    hasPendingAction: false,
    isDueNow: false,
  };
}

function mapListItem(prospect: MiningProspectRecord): MiningProspectListItem {
  const suggestedAction = suggestMiningNextAction(prospect);
  const primaryContact = pickPrimaryContact(prospect);
  const isNextActionDueNow = prospect.nextActionAt
    ? prospect.nextActionAt.getTime() <= Date.now()
    : false;
  const lastActivityAt =
    maxDate([
      prospect.firstContactAt,
      prospect.meetingScheduledAt,
      prospect.meetingDoneAt,
      prospect.followUpAt,
      prospect.readyForContractAt,
      prospect.dormantAt,
      prospect.discardedAt,
      prospect.updatedAt,
      prospect.createdAt,
    ]) ?? prospect.updatedAt;

  return {
    id: prospect.id,
    name: prospect.name,
    companyName: prospect.companyName ?? null,
    country: prospect.country,
    whatsapp: prospect.whatsapp ?? null,
    instagramUrl: prospect.instagramUrl ?? null,
    linkedinUrl: prospect.linkedinUrl ?? null,
    xUrl: prospect.xUrl ?? null,
    email: prospect.email ?? null,
    source: prospect.source,
    sourceLabel: optionLabel(MINING_SOURCE_OPTIONS, prospect.source),
    interestType: prospect.interestType,
    interestTypeLabel: optionLabel(MINING_INTEREST_TYPE_OPTIONS, prospect.interestType),
    estimatedAmountUsd: toDecimalString(prospect.estimatedAmountUsd),
    status: prospect.status,
    statusLabel: optionLabel(MINING_STATUS_OPTIONS, prospect.status),
    nextActionManual: prospect.nextAction ?? null,
    nextActionAt: toIso(prospect.nextActionAt),
    isNextActionDueNow,
    suggestedAction,
    effectiveNextAction: prospect.nextAction ?? suggestedAction.text,
    primaryContactLabel: primaryContact.label,
    primaryContactValue: primaryContact.value,
    lastActivityAt: lastActivityAt.toISOString(),
    updatedAt: prospect.updatedAt.toISOString(),
  };
}

function filterByAction(row: MiningProspectListItem, actionFilter: MiningActionFilter) {
  if (actionFilter === "all") return true;
  if (actionFilter === "manual") return Boolean(row.nextActionManual);
  if (actionFilter === "due-now") {
    if (row.nextActionAt) return row.isNextActionDueNow;
    return row.suggestedAction.isDueNow;
  }
  if (actionFilter === "pending") {
    return Boolean(row.nextActionManual) || row.suggestedAction.hasPendingAction;
  }
  return true;
}

function buildWhere(filters: MiningProspectFilters): Prisma.MiningProspectWhereInput {
  const source = normalizeEnumFilter(filters.source, Object.values(MiningProspectSource));
  const interestType = normalizeEnumFilter(
    filters.interestType,
    Object.values(MiningInterestType)
  );
  const status = normalizeEnumFilter(filters.status, Object.values(MiningProspectStatus));
  const country = String(filters.country ?? "").trim();

  return {
    ...(source ? { source } : {}),
    ...(interestType ? { interestType } : {}),
    ...(status ? { status } : {}),
    ...(country ? { country: { equals: country, mode: "insensitive" } } : {}),
  };
}

async function fetchProspects(where: Prisma.MiningProspectWhereInput = {}) {
  return prisma.miningProspect.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: miningProspectSelect,
  });
}

export async function getMiningPageData(
  filters: MiningProspectFilters = {}
): Promise<MiningPageData> {
  const actionFilter = normalizeActionFilter(filters.actionFilter);
  const where = buildWhere(filters);
  const [filteredProspects, allProspects] = await Promise.all([
    fetchProspects(where),
    fetchProspects(),
  ]);

  const rows = filteredProspects.map(mapListItem).filter((row) => filterByAction(row, actionFilter));
  const pendingActions = rows
    .filter((row) => Boolean(row.nextActionManual) || row.suggestedAction.hasPendingAction)
    .map<MiningPendingActionItem>((row) => ({
      id: row.id,
      name: row.name,
      primaryContactLabel: row.primaryContactLabel,
      primaryContactValue: row.primaryContactValue,
      sourceLabel: row.sourceLabel,
      interestTypeLabel: row.interestTypeLabel,
      statusLabel: row.statusLabel,
      actionText: row.nextActionManual ?? row.suggestedAction.text,
      actionAt: row.nextActionAt ?? row.suggestedAction.at,
      isDueNow: row.nextActionAt ? row.isNextActionDueNow : row.suggestedAction.isDueNow,
      isManual: Boolean(row.nextActionManual),
    }))
    .sort((a, b) => {
      if (a.isDueNow !== b.isDueNow) return a.isDueNow ? -1 : 1;
      const aAt = a.actionAt ? new Date(a.actionAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bAt = b.actionAt ? new Date(b.actionAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aAt - bAt;
    })
    .slice(0, 8);

  const metricsRows = allProspects.map(mapListItem);
  const metrics: MiningMetrics = {
    totalProspects: metricsRows.length,
    newInterest: metricsRows.filter((row) => row.status === MiningProspectStatus.NEW_INTEREST)
      .length,
    meetingsScheduled: metricsRows.filter(
      (row) => row.status === MiningProspectStatus.MEETING_SCHEDULED
    ).length,
    meetingsDone: metricsRows.filter((row) => row.status === MiningProspectStatus.MEETING_DONE)
      .length,
    followUp: metricsRows.filter((row) => row.status === MiningProspectStatus.FOLLOW_UP).length,
    readyForContract: metricsRows.filter(
      (row) => row.status === MiningProspectStatus.READY_FOR_CONTRACT
    ).length,
    dormant: metricsRows.filter((row) => row.status === MiningProspectStatus.DORMANT).length,
    discarded: metricsRows.filter((row) => row.status === MiningProspectStatus.DISCARDED).length,
  };

  const countryOptions = Array.from(
    new Set(allProspects.map((prospect) => prospect.country.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "es"));

  return {
    filters: {
      source: normalizeEnumFilter(filters.source, Object.values(MiningProspectSource)),
      interestType: normalizeEnumFilter(
        filters.interestType,
        Object.values(MiningInterestType)
      ),
      status: normalizeEnumFilter(filters.status, Object.values(MiningProspectStatus)),
      country: String(filters.country ?? "").trim(),
      actionFilter,
    },
    rows,
    metrics,
    pendingActions,
    countryOptions,
  };
}

export async function getMiningMetrics() {
  const data = await getMiningPageData();
  return data.metrics;
}

export async function getMiningProspectById(
  prospectId: string
): Promise<MiningProspectDetail | null> {
  const normalized = normalizeText(prospectId);
  if (!normalized) return null;

  const prospect = await prisma.miningProspect.findUnique({
    where: { id: normalized },
    select: miningProspectSelect,
  });

  if (!prospect) return null;

  const primaryContact = pickPrimaryContact(prospect);

  return {
    id: prospect.id,
    name: prospect.name,
    companyName: prospect.companyName ?? "",
    country: prospect.country,
    whatsapp: prospect.whatsapp ?? "",
    instagramUrl: prospect.instagramUrl ?? "",
    linkedinUrl: prospect.linkedinUrl ?? "",
    xUrl: prospect.xUrl ?? "",
    email: prospect.email ?? "",
    source: prospect.source,
    interestType: prospect.interestType,
    estimatedAmountUsd: toDecimalString(prospect.estimatedAmountUsd) ?? "",
    status: prospect.status,
    nextAction: prospect.nextAction ?? "",
    nextActionAt: toDateInput(prospect.nextActionAt),
    notes: prospect.notes ?? "",
    createdAt: prospect.createdAt.toISOString(),
    updatedAt: prospect.updatedAt.toISOString(),
    automaticDates: {
      firstContactAt: toIso(prospect.firstContactAt),
      meetingScheduledAt: toIso(prospect.meetingScheduledAt),
      meetingDoneAt: toIso(prospect.meetingDoneAt),
      followUpAt: toIso(prospect.followUpAt),
      readyForContractAt: toIso(prospect.readyForContractAt),
      dormantAt: toIso(prospect.dormantAt),
      discardedAt: toIso(prospect.discardedAt),
    },
    suggestedAction: suggestMiningNextAction(prospect),
    primaryContactLabel: primaryContact.label,
    primaryContactValue: primaryContact.value,
  };
}

function buildCreateData(
  input: MiningProspectMutationInput,
  actorUserId: string
): Prisma.MiningProspectCreateInput {
  const status = normalizeStatus(input.status ?? MiningProspectStatus.NEW_INTEREST);
  const automaticDates = pickAutomaticTimestampPatch(status, {
    firstContactAt: null,
    meetingScheduledAt: null,
    meetingDoneAt: null,
    followUpAt: null,
    readyForContractAt: null,
    dormantAt: null,
    discardedAt: null,
  });

  return {
    name: normalizeRequiredText(input.name, "name"),
    companyName: normalizeText(input.companyName),
    country: normalizeCountry(input.country),
    whatsapp: normalizeText(input.whatsapp),
    instagramUrl: normalizeOptionalUrl(input.instagramUrl),
    linkedinUrl: normalizeOptionalUrl(input.linkedinUrl),
    xUrl: normalizeOptionalUrl(input.xUrl),
    email: normalizeOptionalEmail(input.email),
    source: normalizeSource(input.source),
    interestType: normalizeInterestType(input.interestType),
    estimatedAmountUsd: parseNullableDecimal(input.estimatedAmountUsd),
    status,
    nextAction: normalizeText(input.nextAction),
    nextActionAt: parseNullableDate(input.nextActionAt),
    notes: normalizeText(input.notes),
    createdBy: {
      connect: { id: actorUserId },
    },
    updatedBy: {
      connect: { id: actorUserId },
    },
    ...automaticDates,
  };
}

function buildUpdateData(
  current: MiningProspectRecord,
  input: MiningProspectMutationInput,
  actorUserId: string
): Prisma.MiningProspectUpdateInput {
  const status = normalizeStatus(input.status ?? current.status);
  const automaticDates = pickAutomaticTimestampPatch(status, readProspectDates(current));

  return {
    name: normalizeRequiredText(input.name, "name"),
    companyName: normalizeText(input.companyName),
    country: normalizeCountry(input.country ?? current.country),
    whatsapp: normalizeText(input.whatsapp),
    instagramUrl: normalizeOptionalUrl(input.instagramUrl),
    linkedinUrl: normalizeOptionalUrl(input.linkedinUrl),
    xUrl: normalizeOptionalUrl(input.xUrl),
    email: normalizeOptionalEmail(input.email),
    source: normalizeSource(input.source),
    interestType: normalizeInterestType(input.interestType),
    estimatedAmountUsd: parseNullableDecimal(input.estimatedAmountUsd),
    status,
    nextAction: normalizeText(input.nextAction),
    nextActionAt: parseNullableDate(input.nextActionAt),
    notes: normalizeText(input.notes),
    updatedBy: {
      connect: { id: actorUserId },
    },
    ...automaticDates,
  };
}

export async function createMiningProspect(
  input: MiningProspectMutationInput,
  actorUserId: string
) {
  const created = await prisma.miningProspect.create({
    data: buildCreateData(input, actorUserId),
    select: { id: true },
  });

  return created;
}

export async function updateMiningProspect(
  prospectId: string,
  input: MiningProspectMutationInput,
  actorUserId: string
) {
  const normalized = normalizeText(prospectId);
  if (!normalized) {
    throw new Error("prospect_not_found");
  }

  const current = await prisma.miningProspect.findUnique({
    where: { id: normalized },
    select: miningProspectSelect,
  });

  if (!current) {
    throw new Error("prospect_not_found");
  }

  const updated = await prisma.miningProspect.update({
    where: { id: normalized },
    data: buildUpdateData(current, input, actorUserId),
    select: { id: true },
  });

  return updated;
}
