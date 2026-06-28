import "server-only";

import {
  MiningCommercialStatus,
  MiningCommissionStatus,
  MiningInterestType,
  MiningMoneyCurrency,
  MiningOperationalStatus,
  MiningOperationProductType,
  MiningPartnerLevel,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const MINING_OPERATION_PRODUCT_OPTIONS: ReadonlyArray<{
  value: MiningOperationProductType;
  label: string;
}> = [
  { value: MiningOperationProductType.FRACTIONAL_MINING, label: "Minería fraccionada" },
  { value: MiningOperationProductType.TOKENIZED_MINING, label: "Minería tokenizada" },
  { value: MiningOperationProductType.ASIC_HOSTING, label: "ASIC + Hosting" },
  { value: MiningOperationProductType.HOSTING_ONLY, label: "Sólo Hosting" },
  { value: MiningOperationProductType.OTHER, label: "Otro / por definir" },
] as const;

export const MINING_MONEY_CURRENCY_OPTIONS: ReadonlyArray<{
  value: MiningMoneyCurrency;
  label: string;
}> = [
  { value: MiningMoneyCurrency.USD, label: "USD" },
  { value: MiningMoneyCurrency.CLP, label: "CLP" },
  { value: MiningMoneyCurrency.BTC, label: "BTC" },
] as const;

export const MINING_COMMERCIAL_STATUS_OPTIONS: ReadonlyArray<{
  value: MiningCommercialStatus;
  label: string;
}> = [
  { value: MiningCommercialStatus.CONTRACT_PREPARATION, label: "Preparando contrato" },
  { value: MiningCommercialStatus.CONTRACT_SENT, label: "Contrato enviado" },
  { value: MiningCommercialStatus.CONTRACT_SIGNED, label: "Contrato firmado" },
  { value: MiningCommercialStatus.PAYMENT_PENDING, label: "Pago pendiente" },
  { value: MiningCommercialStatus.PAYMENT_RECEIVED, label: "Pago recibido" },
  { value: MiningCommercialStatus.PAYMENT_PROOF_UPLOADED, label: "Comprobante cargado" },
  { value: MiningCommercialStatus.CANCELLED, label: "Cancelada" },
] as const;

export const MINING_OPERATIONAL_STATUS_OPTIONS: ReadonlyArray<{
  value: MiningOperationalStatus;
  label: string;
}> = [
  { value: MiningOperationalStatus.NOT_SHARED, label: "No compartida" },
  { value: MiningOperationalStatus.READY_FOR_ANDES, label: "Lista para Andes" },
  { value: MiningOperationalStatus.RECEIVED_BY_ANDES, label: "Recibida por Andes" },
  { value: MiningOperationalStatus.ACTIVATION_PENDING, label: "Activación pendiente" },
  { value: MiningOperationalStatus.ACTIVE, label: "Activa" },
  { value: MiningOperationalStatus.INCIDENT, label: "Incidencia" },
  { value: MiningOperationalStatus.CLOSED, label: "Cerrada" },
] as const;

export const MINING_PARTNER_LEVEL_OPTIONS: ReadonlyArray<{
  value: MiningPartnerLevel;
  label: string;
}> = [
  { value: MiningPartnerLevel.BRONZE, label: "Bronce" },
  { value: MiningPartnerLevel.SILVER, label: "Plata" },
  { value: MiningPartnerLevel.GOLD, label: "Oro" },
] as const;

export const MINING_COMMISSION_STATUS_OPTIONS: ReadonlyArray<{
  value: MiningCommissionStatus;
  label: string;
}> = [
  { value: MiningCommissionStatus.NOT_APPLICABLE, label: "No aplica" },
  { value: MiningCommissionStatus.PENDING_CALCULATION, label: "Pendiente de cálculo" },
  { value: MiningCommissionStatus.CALCULATED, label: "Calculada" },
  { value: MiningCommissionStatus.INVOICED, label: "Facturada" },
  { value: MiningCommissionStatus.PAID, label: "Pagada" },
  { value: MiningCommissionStatus.RECEIVED, label: "Recibida" },
  { value: MiningCommissionStatus.DISPUTED, label: "En disputa" },
] as const;

export const MINING_OPERATION_ACTION_FILTER_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Con acción pendiente" },
  { value: "due-now", label: "Vence ahora" },
  { value: "manual", label: "Con próxima acción manual" },
] as const;

export type MiningOperationActionFilter =
  (typeof MINING_OPERATION_ACTION_FILTER_OPTIONS)[number]["value"];

export type MiningOperationFilters = {
  productType?: string | null;
  commercialStatus?: string | null;
  operationalStatus?: string | null;
  commissionStatus?: string | null;
  currency?: string | null;
  country?: string | null;
  actionFilter?: string | null;
};

export type MiningOperationSuggestedAction = {
  text: string;
  at: string | null;
  hasPendingAction: boolean;
  isDueNow: boolean;
};

export type MiningCommissionSuggestion = {
  salesRate: string | null;
  salesAmount: string | null;
  salesCurrency: MiningMoneyCurrency | null;
  monthlyHostingRate: string | null;
  monthlyHostingAmount: string | null;
  monthlyHostingCurrency: MiningMoneyCurrency | null;
  suggestedSalesRate: string | null;
  suggestedSalesAmount: string | null;
  suggestedSalesCurrency: MiningMoneyCurrency | null;
  suggestedMonthlyHostingRate: string | null;
  suggestedMonthlyHostingAmount: string | null;
  suggestedMonthlyHostingCurrency: MiningMoneyCurrency | null;
  suggestedDueAt: string | null;
  dueAt: string | null;
  saleSequence: number;
  partnerLevel: MiningPartnerLevel;
  partnerLevelLabel: string;
  isEstimated: boolean;
  explanation: string;
  needsManualCalculation: boolean;
  summary: string;
};

export type MiningCommissionPreviewSeed = {
  nextProbableSaleSequence: number;
  currentConfirmedSequence: number | null;
  agreementStartLabel: string;
  initialSuggestedDueAt: string | null;
};

export type MiningOperationListItem = {
  id: string;
  prospectId: string | null;
  clientName: string;
  clientCompanyName: string | null;
  country: string;
  whatsapp: string | null;
  email: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  productType: MiningOperationProductType;
  productTypeLabel: string;
  grossSaleAmount: string | null;
  grossSaleCurrency: MiningMoneyCurrency;
  commercialStatus: MiningCommercialStatus;
  commercialStatusLabel: string;
  operationalStatus: MiningOperationalStatus;
  operationalStatusLabel: string;
  commissionStatus: MiningCommissionStatus;
  commissionStatusLabel: string;
  nextActionManual: string | null;
  nextActionAt: string | null;
  isNextActionDueNow: boolean;
  suggestedAction: MiningOperationSuggestedAction;
  effectiveNextAction: string;
  primaryContactLabel: string;
  primaryContactValue: string;
  commission: MiningCommissionSuggestion;
  lastActivityAt: string;
  updatedAt: string;
};

export type MiningOperationMetrics = {
  totalOperations: number;
  contractsSent: number;
  contractsSigned: number;
  paymentsReceived: number;
  paymentProofsUploaded: number;
  readyForAndes: number;
  active: number;
  commissionsPending: number;
  commissionsPaidOrReceived: number;
};

export type MiningOperationPendingActionItem = {
  id: string;
  clientName: string;
  commercialStatusLabel: string;
  operationalStatusLabel: string;
  actionText: string;
  actionAt: string | null;
  isDueNow: boolean;
  isManual: boolean;
  commissionSummary: string;
};

export type MiningOperationsPageData = {
  filters: {
    productType: string;
    commercialStatus: string;
    operationalStatus: string;
    commissionStatus: string;
    currency: string;
    country: string;
    actionFilter: MiningOperationActionFilter;
  };
  rows: MiningOperationListItem[];
  metrics: MiningOperationMetrics;
  pendingActions: MiningOperationPendingActionItem[];
  countryOptions: string[];
};

export type MiningOperationDetail = {
  id: string;
  prospect: {
    id: string;
    name: string;
    statusLabel: string;
  } | null;
  clientName: string;
  clientCompanyName: string;
  country: string;
  whatsapp: string;
  email: string;
  instagramUrl: string;
  linkedinUrl: string;
  xUrl: string;
  productType: MiningOperationProductType;
  productDescription: string;
  asicModel: string;
  quantity: string;
  grossSaleAmount: string;
  grossSaleCurrency: MiningMoneyCurrency;
  paymentCurrency: MiningMoneyCurrency;
  grossSaleAmountClp: string;
  grossSaleAmountBtc: string;
  commercialStatus: MiningCommercialStatus;
  docusignUrl: string;
  signedContractUrl: string;
  paymentProofUrl: string;
  operationalStatus: MiningOperationalStatus;
  andesOperationalNotes: string;
  salesCommissionRate: string;
  salesCommissionAmount: string;
  salesCommissionCurrency: MiningMoneyCurrency;
  commissionStatus: MiningCommissionStatus;
  commissionDueAt: string;
  commissionPaidAt: string;
  commissionReceivedAt: string;
  commissionPaymentProofUrl: string;
  monthlyHostingAmount: string;
  monthlyHostingCurrency: MiningMoneyCurrency;
  monthlyHostingCommissionRate: string;
  monthlyHostingCommissionAmount: string;
  hostingCommissionActive: boolean;
  commissionNotes: string;
  nextAction: string;
  nextActionAt: string;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
  commercialDates: Record<string, string | null>;
  operationalDates: Record<string, string | null>;
  suggestedAction: MiningOperationSuggestedAction;
  primaryContactLabel: string;
  primaryContactValue: string;
  commissionSuggestion: MiningCommissionSuggestion;
  commissionPreviewSeed: MiningCommissionPreviewSeed;
};

type MiningOperationMutationInput = {
  clientName: string;
  clientCompanyName?: string | null;
  country?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  xUrl?: string | null;
  productType?: string | null;
  productDescription?: string | null;
  asicModel?: string | null;
  quantity?: string | number | null;
  grossSaleAmount?: string | null;
  grossSaleCurrency?: string | null;
  paymentCurrency?: string | null;
  grossSaleAmountClp?: string | null;
  grossSaleAmountBtc?: string | null;
  commercialStatus?: string | null;
  docusignUrl?: string | null;
  signedContractUrl?: string | null;
  paymentProofUrl?: string | null;
  operationalStatus?: string | null;
  andesOperationalNotes?: string | null;
  salesCommissionRate?: string | null;
  salesCommissionAmount?: string | null;
  salesCommissionCurrency?: string | null;
  commissionStatus?: string | null;
  commissionDueAt?: string | null;
  commissionPaidAt?: string | null;
  commissionReceivedAt?: string | null;
  commissionPaymentProofUrl?: string | null;
  monthlyHostingAmount?: string | null;
  monthlyHostingCurrency?: string | null;
  monthlyHostingCommissionRate?: string | null;
  monthlyHostingCommissionAmount?: string | null;
  hostingCommissionActive?: boolean | string | null;
  commissionNotes?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  internalNotes?: string | null;
};

const miningOperationSelect = {
  id: true,
  prospectId: true,
  clientName: true,
  clientCompanyName: true,
  country: true,
  whatsapp: true,
  email: true,
  instagramUrl: true,
  linkedinUrl: true,
  xUrl: true,
  productType: true,
  productDescription: true,
  asicModel: true,
  quantity: true,
  grossSaleAmount: true,
  grossSaleCurrency: true,
  paymentCurrency: true,
  grossSaleAmountClp: true,
  grossSaleAmountBtc: true,
  commercialStatus: true,
  contractPreparationAt: true,
  contractSentAt: true,
  contractSignedAt: true,
  paymentPendingAt: true,
  paymentReceivedAt: true,
  paymentProofUploadedAt: true,
  cancelledAt: true,
  docusignUrl: true,
  signedContractUrl: true,
  paymentProofUrl: true,
  operationalStatus: true,
  sharedWithPartnerAt: true,
  receivedByAndesAt: true,
  activationPendingAt: true,
  activatedAt: true,
  incidentAt: true,
  closedAt: true,
  andesOperationalNotes: true,
  partnerLevel: true,
  salesCommissionRate: true,
  salesCommissionAmount: true,
  salesCommissionCurrency: true,
  commissionStatus: true,
  commissionDueAt: true,
  commissionPaidAt: true,
  commissionReceivedAt: true,
  commissionPaymentProofUrl: true,
  monthlyHostingAmount: true,
  monthlyHostingCurrency: true,
  monthlyHostingCommissionRate: true,
  monthlyHostingCommissionAmount: true,
  hostingCommissionActive: true,
  commissionNotes: true,
  nextAction: true,
  nextActionAt: true,
  internalNotes: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  prospect: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
} satisfies Prisma.MiningOperationSelect;

type MiningOperationRecord = Prisma.MiningOperationGetPayload<{
  select: typeof miningOperationSelect;
}>;

type MiningCommercialDateFields = Pick<
  MiningOperationRecord,
  | "contractPreparationAt"
  | "contractSentAt"
  | "contractSignedAt"
  | "paymentPendingAt"
  | "paymentReceivedAt"
  | "paymentProofUploadedAt"
  | "cancelledAt"
>;

type MiningOperationalDateFields = Pick<
  MiningOperationRecord,
  | "sharedWithPartnerAt"
  | "receivedByAndesAt"
  | "activationPendingAt"
  | "activatedAt"
  | "incidentAt"
  | "closedAt"
>;

const miningOperationCommissionContextSelect = {
  id: true,
  commercialStatus: true,
  paymentReceivedAt: true,
  paymentProofUploadedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MiningOperationSelect;

type MiningOperationCommissionContextRecord = Prisma.MiningOperationGetPayload<{
  select: typeof miningOperationCommissionContextSelect;
}>;

type MiningConfirmedTimelineItem = MiningOperationCommissionContextRecord & {
  confirmedAt: Date;
};

type MiningPartnerSaleContext = {
  saleSequence: number;
  nextProbableSaleSequence: number;
  currentConfirmedSequence: number | null;
  partnerLevel: MiningPartnerLevel;
  partnerLevelLabel: string;
  isEstimated: boolean;
};

const COMMERCIAL_STATUS_TIMESTAMP_FIELD: Record<
  MiningCommercialStatus,
  keyof MiningCommercialDateFields
> = {
  [MiningCommercialStatus.CONTRACT_PREPARATION]: "contractPreparationAt",
  [MiningCommercialStatus.CONTRACT_SENT]: "contractSentAt",
  [MiningCommercialStatus.CONTRACT_SIGNED]: "contractSignedAt",
  [MiningCommercialStatus.PAYMENT_PENDING]: "paymentPendingAt",
  [MiningCommercialStatus.PAYMENT_RECEIVED]: "paymentReceivedAt",
  [MiningCommercialStatus.PAYMENT_PROOF_UPLOADED]: "paymentProofUploadedAt",
  [MiningCommercialStatus.CANCELLED]: "cancelledAt",
};

const OPERATIONAL_STATUS_TIMESTAMP_FIELD: Record<
  Exclude<MiningOperationalStatus, "NOT_SHARED">,
  keyof MiningOperationalDateFields
> = {
  [MiningOperationalStatus.READY_FOR_ANDES]: "sharedWithPartnerAt",
  [MiningOperationalStatus.RECEIVED_BY_ANDES]: "receivedByAndesAt",
  [MiningOperationalStatus.ACTIVATION_PENDING]: "activationPendingAt",
  [MiningOperationalStatus.ACTIVE]: "activatedAt",
  [MiningOperationalStatus.INCIDENT]: "incidentAt",
  [MiningOperationalStatus.CLOSED]: "closedAt",
};

const FRACTIONAL_SALES_RATES: Record<MiningPartnerLevel, string> = {
  [MiningPartnerLevel.BRONZE]: "0.05",
  [MiningPartnerLevel.SILVER]: "0.05",
  [MiningPartnerLevel.GOLD]: "0.07",
};

const ASIC_HOSTING_SALES_RATES: Record<MiningPartnerLevel, string> = {
  [MiningPartnerLevel.BRONZE]: "0.07",
  [MiningPartnerLevel.SILVER]: "0.08",
  [MiningPartnerLevel.GOLD]: "0.09",
};

const PARTNER_PROGRAM_START_AT = new Date("2026-07-01T00:00:00.000Z");
const PARTNER_PROGRAM_START_LABEL = "1 de julio de 2026";
const MONTHLY_HOSTING_RATE = "0.01";
const COMMISSION_DUE_IN_DAYS = 30;
const CONFIRMED_SALE_STATUSES: MiningCommercialStatus[] = [
  MiningCommercialStatus.PAYMENT_RECEIVED,
  MiningCommercialStatus.PAYMENT_PROOF_UPLOADED,
];
const PENDING_COMMISSION_STATUSES: MiningCommissionStatus[] = [
  MiningCommissionStatus.PENDING_CALCULATION,
  MiningCommissionStatus.CALCULATED,
  MiningCommissionStatus.INVOICED,
  MiningCommissionStatus.DISPUTED,
];
const PAID_OR_RECEIVED_COMMISSION_STATUSES: MiningCommissionStatus[] = [
  MiningCommissionStatus.PAID,
  MiningCommissionStatus.RECEIVED,
];

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

function normalizeEnum<T extends string>(
  value: string | null | undefined,
  fallback: T,
  allowed: readonly T[],
  errorKey: string
) {
  const normalized = String(value ?? fallback).trim().toUpperCase();
  if (allowed.includes(normalized as T)) {
    return normalized as T;
  }
  throw new Error(errorKey);
}

function normalizeEnumFilter<T extends string>(value: string | null | undefined, allowed: T[]) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return allowed.includes(normalized as T) ? (normalized as T) : "";
}

function normalizeActionFilter(value: string | null | undefined): MiningOperationActionFilter {
  const normalized = String(value ?? "all").trim().toLowerCase();
  return MINING_OPERATION_ACTION_FILTER_OPTIONS.some((option) => option.value === normalized)
    ? (normalized as MiningOperationActionFilter)
    : "all";
}

function normalizeProductType(value: string | null | undefined) {
  return normalizeEnum(
    value,
    MiningOperationProductType.OTHER,
    Object.values(MiningOperationProductType),
    "invalid_product_type"
  );
}

function normalizeMoneyCurrency(
  value: string | null | undefined,
  fallback: MiningMoneyCurrency = MiningMoneyCurrency.USD,
  errorKey = "invalid_currency"
) {
  return normalizeEnum(value, fallback, Object.values(MiningMoneyCurrency), errorKey);
}

function normalizeCommercialStatus(value: string | null | undefined) {
  return normalizeEnum(
    value,
    MiningCommercialStatus.CONTRACT_PREPARATION,
    Object.values(MiningCommercialStatus),
    "invalid_commercial_status"
  );
}

function normalizeOperationalStatus(value: string | null | undefined) {
  return normalizeEnum(
    value,
    MiningOperationalStatus.NOT_SHARED,
    Object.values(MiningOperationalStatus),
    "invalid_operational_status"
  );
}

function normalizeCommissionStatus(value: string | null | undefined) {
  return normalizeEnum(
    value,
    MiningCommissionStatus.PENDING_CALCULATION,
    Object.values(MiningCommissionStatus),
    "invalid_commission_status"
  );
}

function normalizeBoolean(value: boolean | string | null | undefined) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on";
}

function parseNullableDate(value: string | null | undefined, errorKey: string) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(errorKey);
  }
  return date;
}

function parseNullableDecimal(value: string | null | undefined, errorKey: string) {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const sanitized = normalized.replace(/\$/g, "").replace(/\s+/g, "").replace(/,/g, "");
  let decimal: Prisma.Decimal;

  try {
    decimal = new Prisma.Decimal(sanitized);
  } catch {
    throw new Error(errorKey);
  }

  if (decimal.lt(0)) {
    throw new Error(errorKey);
  }

  return decimal;
}

function parseNullableInt(value: string | number | null | undefined, errorKey: string) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(numeric) || numeric < 0) {
    throw new Error(errorKey);
  }
  return numeric;
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

function isConfirmedSaleStatus(status: MiningCommercialStatus) {
  return CONFIRMED_SALE_STATUSES.includes(status);
}

function pickConfirmedAt(
  operation: Pick<
    MiningOperationCommissionContextRecord,
    "paymentReceivedAt" | "paymentProofUploadedAt" | "updatedAt" | "createdAt"
  >
) {
  return (
    operation.paymentReceivedAt ??
    operation.paymentProofUploadedAt ??
    operation.updatedAt ??
    operation.createdAt
  );
}

function buildConfirmedSalesTimeline(
  operations: MiningOperationCommissionContextRecord[]
): MiningConfirmedTimelineItem[] {
  return operations
    .filter((operation) => isConfirmedSaleStatus(operation.commercialStatus))
    .map((operation) => ({
      ...operation,
      confirmedAt: pickConfirmedAt(operation),
    }))
    .filter((operation) => operation.confirmedAt.getTime() >= PARTNER_PROGRAM_START_AT.getTime())
    .sort((a, b) => {
      const confirmedDiff = a.confirmedAt.getTime() - b.confirmedAt.getTime();
      if (confirmedDiff !== 0) return confirmedDiff;

      const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();
      if (createdDiff !== 0) return createdDiff;

      return a.id.localeCompare(b.id);
    });
}

function partnerLevelForSaleSequence(sequence: number) {
  if (sequence >= 16) return MiningPartnerLevel.GOLD;
  if (sequence >= 6) return MiningPartnerLevel.SILVER;
  return MiningPartnerLevel.BRONZE;
}

function resolvePartnerSaleContext(
  currentOperation: Pick<
    MiningOperationCommissionContextRecord,
    "id" | "commercialStatus" | "paymentReceivedAt" | "paymentProofUploadedAt" | "createdAt" | "updatedAt"
  >,
  confirmedTimeline: MiningConfirmedTimelineItem[]
): MiningPartnerSaleContext {
  const sequenceById = new Map(
    confirmedTimeline.map((operation, index) => [operation.id, index + 1] as const)
  );
  const currentConfirmedSequence = sequenceById.get(currentOperation.id) ?? null;
  const confirmedSalesExcludingCurrent = confirmedTimeline.filter(
    (operation) => operation.id !== currentOperation.id
  ).length;
  const nextProbableSaleSequence = confirmedSalesExcludingCurrent + 1;
  const isConfirmed = isConfirmedSaleStatus(currentOperation.commercialStatus);
  const saleSequence = isConfirmed
    ? currentConfirmedSequence ?? nextProbableSaleSequence
    : nextProbableSaleSequence;
  const partnerLevel = partnerLevelForSaleSequence(saleSequence);

  return {
    saleSequence,
    nextProbableSaleSequence,
    currentConfirmedSequence,
    partnerLevel,
    partnerLevelLabel: optionLabel(MINING_PARTNER_LEVEL_OPTIONS, partnerLevel),
    isEstimated: !isConfirmed,
  };
}

function formatMoneySummary(value: string, currency: MiningMoneyCurrency) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return `${currency} ${value}`;
  }

  if (currency === MiningMoneyCurrency.CLP) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (currency === MiningMoneyCurrency.BTC) {
    return `BTC ${amount.toFixed(8)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatRateSummary(value: string | null) {
  if (!value) return null;
  const rate = Number(new Prisma.Decimal(value).mul(100).toString());
  return `${rate.toFixed(2)}%`;
}

function buildCommissionSummary(args: {
  salesRate: string | null;
  salesAmount: string | null;
  salesCurrency: MiningMoneyCurrency | null;
  monthlyHostingRate: string | null;
  monthlyHostingAmount: string | null;
  monthlyHostingCurrency: MiningMoneyCurrency | null;
  needsManualCalculation: boolean;
}) {
  const parts: string[] = [];

  if (args.salesRate || args.salesAmount) {
    const rateLabel = formatRateSummary(args.salesRate);
    const amountLabel =
      args.salesAmount && args.salesCurrency
        ? formatMoneySummary(args.salesAmount, args.salesCurrency)
        : null;

    parts.push(["Venta", rateLabel, amountLabel].filter(Boolean).join(" · "));
  }

  if (args.monthlyHostingRate || args.monthlyHostingAmount) {
    const rateLabel = formatRateSummary(args.monthlyHostingRate);
    const amountLabel =
      args.monthlyHostingAmount && args.monthlyHostingCurrency
        ? `${formatMoneySummary(args.monthlyHostingAmount, args.monthlyHostingCurrency)}/mes`
        : null;

    parts.push(["Hosting", rateLabel, amountLabel].filter(Boolean).join(" · "));
  }

  if (!parts.length) {
    return args.needsManualCalculation ? "Pendiente de cálculo" : "Sin comisión aplicable";
  }

  return parts.join(" + ");
}

function pickPrimaryContact(
  operation: Pick<
    MiningOperationRecord,
    "whatsapp" | "email" | "instagramUrl" | "linkedinUrl" | "xUrl"
  >
) {
  if (operation.whatsapp) {
    return { label: "WhatsApp", value: operation.whatsapp };
  }
  if (operation.email) {
    return { label: "Email", value: operation.email };
  }
  if (operation.instagramUrl) {
    return { label: "Instagram", value: operation.instagramUrl };
  }
  if (operation.linkedinUrl) {
    return { label: "LinkedIn", value: operation.linkedinUrl };
  }
  if (operation.xUrl) {
    return { label: "X / Twitter", value: operation.xUrl };
  }
  return { label: "Contacto", value: "Sin canal definido" };
}

function readCommercialDates(
  operation: Pick<MiningOperationRecord, keyof MiningCommercialDateFields>
): MiningCommercialDateFields {
  return {
    contractPreparationAt: operation.contractPreparationAt,
    contractSentAt: operation.contractSentAt,
    contractSignedAt: operation.contractSignedAt,
    paymentPendingAt: operation.paymentPendingAt,
    paymentReceivedAt: operation.paymentReceivedAt,
    paymentProofUploadedAt: operation.paymentProofUploadedAt,
    cancelledAt: operation.cancelledAt,
  };
}

function readOperationalDates(
  operation: Pick<MiningOperationRecord, keyof MiningOperationalDateFields>
): MiningOperationalDateFields {
  return {
    sharedWithPartnerAt: operation.sharedWithPartnerAt,
    receivedByAndesAt: operation.receivedByAndesAt,
    activationPendingAt: operation.activationPendingAt,
    activatedAt: operation.activatedAt,
    incidentAt: operation.incidentAt,
    closedAt: operation.closedAt,
  };
}

function pickCommercialTimestampPatch(
  status: MiningCommercialStatus,
  currentDates: MiningCommercialDateFields
) {
  const field = COMMERCIAL_STATUS_TIMESTAMP_FIELD[status];
  if (currentDates[field]) return {};
  return { [field]: new Date() } satisfies Partial<MiningCommercialDateFields>;
}

function pickOperationalTimestampPatch(
  status: MiningOperationalStatus,
  currentDates: MiningOperationalDateFields
) {
  if (status === MiningOperationalStatus.NOT_SHARED) return {};
  const field = OPERATIONAL_STATUS_TIMESTAMP_FIELD[status];
  if (currentDates[field]) return {};
  return { [field]: new Date() } satisfies Partial<MiningOperationalDateFields>;
}

function suggestCommercialAction(status: MiningCommercialStatus): MiningOperationSuggestedAction {
  switch (status) {
    case MiningCommercialStatus.CONTRACT_PREPARATION:
      return {
        text: "Completar datos y enviar contrato",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningCommercialStatus.CONTRACT_SENT:
      return {
        text: "Esperar firma del contrato",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningCommercialStatus.CONTRACT_SIGNED:
      return {
        text: "Enviar datos de pago y esperar transferencia",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningCommercialStatus.PAYMENT_PENDING:
      return {
        text: "Esperar pago del cliente",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningCommercialStatus.PAYMENT_RECEIVED:
      return {
        text: "Cargar comprobante y avisar a Andes",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningCommercialStatus.PAYMENT_PROOF_UPLOADED:
      return {
        text: "Marcar operación lista para Andes",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningCommercialStatus.CANCELLED:
      return {
        text: "Sin acción inmediata",
        at: null,
        hasPendingAction: false,
        isDueNow: false,
      };
  }
}

function suggestOperationalAction(status: MiningOperationalStatus): MiningOperationSuggestedAction {
  switch (status) {
    case MiningOperationalStatus.READY_FOR_ANDES:
      return {
        text: "Esperar recepción de Andes",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningOperationalStatus.RECEIVED_BY_ANDES:
      return {
        text: "Esperar activación",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningOperationalStatus.ACTIVATION_PENDING:
      return {
        text: "Dar seguimiento a activación",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningOperationalStatus.ACTIVE:
      return {
        text: "Operación activa",
        at: null,
        hasPendingAction: false,
        isDueNow: false,
      };
    case MiningOperationalStatus.INCIDENT:
      return {
        text: "Revisar incidencia",
        at: null,
        hasPendingAction: true,
        isDueNow: false,
      };
    case MiningOperationalStatus.CLOSED:
      return {
        text: "Operación cerrada",
        at: null,
        hasPendingAction: false,
        isDueNow: false,
      };
    case MiningOperationalStatus.NOT_SHARED:
      return {
        text: "Sin acción inmediata",
        at: null,
        hasPendingAction: false,
        isDueNow: false,
      };
  }
}

export function suggestMiningOperationNextAction(
  operation: Pick<MiningOperationRecord, "commercialStatus" | "operationalStatus">
) {
  if (operation.commercialStatus === MiningCommercialStatus.CANCELLED) {
    return suggestCommercialAction(operation.commercialStatus);
  }

  if (operation.operationalStatus !== MiningOperationalStatus.NOT_SHARED) {
    return suggestOperationalAction(operation.operationalStatus);
  }

  return suggestCommercialAction(operation.commercialStatus);
}

function salesRateForOperation(
  productType: MiningOperationProductType,
  partnerLevel: MiningPartnerLevel
) {
  if (
    productType === MiningOperationProductType.FRACTIONAL_MINING ||
    productType === MiningOperationProductType.TOKENIZED_MINING
  ) {
    return FRACTIONAL_SALES_RATES[partnerLevel];
  }

  if (productType === MiningOperationProductType.ASIC_HOSTING) {
    return ASIC_HOSTING_SALES_RATES[partnerLevel];
  }

  return null;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildCommissionSuggestion(
  operation: {
    productType: MiningOperationProductType;
    grossSaleAmount: Prisma.Decimal | null;
    grossSaleCurrency: MiningMoneyCurrency;
    paymentReceivedAt: Date | null;
    monthlyHostingAmount: Prisma.Decimal | null;
    monthlyHostingCurrency: MiningMoneyCurrency;
    hostingCommissionActive: boolean;
    salesCommissionRate: Prisma.Decimal | null;
    salesCommissionAmount: Prisma.Decimal | null;
    salesCommissionCurrency: MiningMoneyCurrency;
    monthlyHostingCommissionRate: Prisma.Decimal | null;
    monthlyHostingCommissionAmount: Prisma.Decimal | null;
    commissionDueAt: Date | null;
  },
  partnerSaleContext: MiningPartnerSaleContext
) {
  let suggestedSalesRate: Prisma.Decimal | null = null;
  let suggestedSalesAmount: Prisma.Decimal | null = null;
  let suggestedMonthlyHostingRate: Prisma.Decimal | null = null;
  let suggestedMonthlyHostingAmount: Prisma.Decimal | null = null;
  let needsManualCalculation = false;

  const suggestedSalesRateValue = salesRateForOperation(
    operation.productType,
    partnerSaleContext.partnerLevel
  );

  if (suggestedSalesRateValue) {
    suggestedSalesRate = new Prisma.Decimal(suggestedSalesRateValue);
    if (operation.grossSaleAmount) {
      suggestedSalesAmount = operation.grossSaleAmount
        .mul(suggestedSalesRate)
        .toDecimalPlaces(8);
    }
  } else if (operation.productType === MiningOperationProductType.OTHER) {
    needsManualCalculation = true;
  }

  if (operation.hostingCommissionActive && operation.monthlyHostingAmount) {
    suggestedMonthlyHostingRate = new Prisma.Decimal(MONTHLY_HOSTING_RATE);
    suggestedMonthlyHostingAmount = operation.monthlyHostingAmount
      .mul(suggestedMonthlyHostingRate)
      .toDecimalPlaces(8);
  } else if (
    operation.productType === MiningOperationProductType.HOSTING_ONLY &&
    !operation.monthlyHostingAmount
  ) {
    needsManualCalculation = true;
  }

  const effectiveSalesRate =
    toDecimalString(operation.salesCommissionRate) ?? toDecimalString(suggestedSalesRate);
  const effectiveSalesAmount =
    toDecimalString(operation.salesCommissionAmount) ?? toDecimalString(suggestedSalesAmount);
  const effectiveMonthlyRate =
    toDecimalString(operation.monthlyHostingCommissionRate) ??
    toDecimalString(suggestedMonthlyHostingRate);
  const effectiveMonthlyAmount =
    toDecimalString(operation.monthlyHostingCommissionAmount) ??
    toDecimalString(suggestedMonthlyHostingAmount);
  const suggestedDueAt =
    operation.paymentReceivedAt ? addDays(operation.paymentReceivedAt, COMMISSION_DUE_IN_DAYS) : null;
  const effectiveDueAt = toIso(operation.commissionDueAt) ?? toIso(suggestedDueAt);
  const hasManualSalesOverride = Boolean(
    operation.salesCommissionRate || operation.salesCommissionAmount
  );

  const summary = buildCommissionSummary({
    salesRate: effectiveSalesRate,
    salesAmount: effectiveSalesAmount,
    salesCurrency:
      effectiveSalesRate || effectiveSalesAmount
        ? hasManualSalesOverride
          ? operation.salesCommissionCurrency
          : operation.grossSaleCurrency
        : null,
    monthlyHostingRate: effectiveMonthlyRate,
    monthlyHostingAmount: effectiveMonthlyAmount,
    monthlyHostingCurrency:
      effectiveMonthlyRate || effectiveMonthlyAmount ? operation.monthlyHostingCurrency : null,
    needsManualCalculation,
  });

  return {
    salesRate: effectiveSalesRate,
    salesAmount: effectiveSalesAmount,
    salesCurrency:
      effectiveSalesRate || effectiveSalesAmount
        ? operation.salesCommissionCurrency
        : suggestedSalesRate
          ? operation.grossSaleCurrency
          : null,
    monthlyHostingRate: effectiveMonthlyRate,
    monthlyHostingAmount: effectiveMonthlyAmount,
    monthlyHostingCurrency:
      effectiveMonthlyRate || effectiveMonthlyAmount ? operation.monthlyHostingCurrency : null,
    suggestedSalesRate: toDecimalString(suggestedSalesRate),
    suggestedSalesAmount: toDecimalString(suggestedSalesAmount),
    suggestedSalesCurrency: suggestedSalesRate ? operation.grossSaleCurrency : null,
    suggestedMonthlyHostingRate: toDecimalString(suggestedMonthlyHostingRate),
    suggestedMonthlyHostingAmount: toDecimalString(suggestedMonthlyHostingAmount),
    suggestedMonthlyHostingCurrency: suggestedMonthlyHostingRate
      ? operation.monthlyHostingCurrency
      : null,
    suggestedDueAt: toIso(suggestedDueAt),
    dueAt: effectiveDueAt,
    saleSequence: partnerSaleContext.saleSequence,
    partnerLevel: partnerSaleContext.partnerLevel,
    partnerLevelLabel: partnerSaleContext.partnerLevelLabel,
    isEstimated: partnerSaleContext.isEstimated,
    explanation: `El nivel se calcula según las ventas acumuladas de Kapa21 con Andes SolarHash desde el ${PARTNER_PROGRAM_START_LABEL}.`,
    needsManualCalculation,
    summary,
  } satisfies MiningCommissionSuggestion;
}

function mapListItem(
  operation: MiningOperationRecord,
  confirmedTimeline: MiningConfirmedTimelineItem[]
): MiningOperationListItem {
  const suggestedAction = suggestMiningOperationNextAction(operation);
  const primaryContact = pickPrimaryContact(operation);
  const partnerSaleContext = resolvePartnerSaleContext(operation, confirmedTimeline);
  const isNextActionDueNow = operation.nextActionAt
    ? operation.nextActionAt.getTime() <= Date.now()
    : false;
  const lastActivityAt =
    maxDate([
      operation.contractPreparationAt,
      operation.contractSentAt,
      operation.contractSignedAt,
      operation.paymentPendingAt,
      operation.paymentReceivedAt,
      operation.paymentProofUploadedAt,
      operation.cancelledAt,
      operation.sharedWithPartnerAt,
      operation.receivedByAndesAt,
      operation.activationPendingAt,
      operation.activatedAt,
      operation.incidentAt,
      operation.closedAt,
      operation.commissionPaidAt,
      operation.commissionReceivedAt,
      operation.updatedAt,
      operation.createdAt,
    ]) ?? operation.updatedAt;

  return {
    id: operation.id,
    prospectId: operation.prospectId ?? null,
    clientName: operation.clientName,
    clientCompanyName: operation.clientCompanyName ?? null,
    country: operation.country,
    whatsapp: operation.whatsapp ?? null,
    email: operation.email ?? null,
    instagramUrl: operation.instagramUrl ?? null,
    linkedinUrl: operation.linkedinUrl ?? null,
    xUrl: operation.xUrl ?? null,
    productType: operation.productType,
    productTypeLabel: optionLabel(MINING_OPERATION_PRODUCT_OPTIONS, operation.productType),
    grossSaleAmount: toDecimalString(operation.grossSaleAmount),
    grossSaleCurrency: operation.grossSaleCurrency,
    commercialStatus: operation.commercialStatus,
    commercialStatusLabel: optionLabel(
      MINING_COMMERCIAL_STATUS_OPTIONS,
      operation.commercialStatus
    ),
    operationalStatus: operation.operationalStatus,
    operationalStatusLabel: optionLabel(
      MINING_OPERATIONAL_STATUS_OPTIONS,
      operation.operationalStatus
    ),
    commissionStatus: operation.commissionStatus,
    commissionStatusLabel: optionLabel(
      MINING_COMMISSION_STATUS_OPTIONS,
      operation.commissionStatus
    ),
    nextActionManual: operation.nextAction ?? null,
    nextActionAt: toIso(operation.nextActionAt),
    isNextActionDueNow,
    suggestedAction,
    effectiveNextAction: operation.nextAction ?? suggestedAction.text,
    primaryContactLabel: primaryContact.label,
    primaryContactValue: primaryContact.value,
    commission: buildCommissionSuggestion(operation, partnerSaleContext),
    lastActivityAt: lastActivityAt.toISOString(),
    updatedAt: operation.updatedAt.toISOString(),
  };
}

function filterByAction(row: MiningOperationListItem, actionFilter: MiningOperationActionFilter) {
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

function buildWhere(filters: MiningOperationFilters): Prisma.MiningOperationWhereInput {
  const productType = normalizeEnumFilter(
    filters.productType,
    Object.values(MiningOperationProductType)
  );
  const commercialStatus = normalizeEnumFilter(
    filters.commercialStatus,
    Object.values(MiningCommercialStatus)
  );
  const operationalStatus = normalizeEnumFilter(
    filters.operationalStatus,
    Object.values(MiningOperationalStatus)
  );
  const commissionStatus = normalizeEnumFilter(
    filters.commissionStatus,
    Object.values(MiningCommissionStatus)
  );
  const currency = normalizeEnumFilter(filters.currency, Object.values(MiningMoneyCurrency));
  const country = String(filters.country ?? "").trim();

  return {
    ...(productType ? { productType } : {}),
    ...(commercialStatus ? { commercialStatus } : {}),
    ...(operationalStatus ? { operationalStatus } : {}),
    ...(commissionStatus ? { commissionStatus } : {}),
    ...(currency ? { grossSaleCurrency: currency } : {}),
    ...(country ? { country: { equals: country, mode: "insensitive" } } : {}),
  };
}

async function fetchOperations(where: Prisma.MiningOperationWhereInput = {}) {
  return prisma.miningOperation.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: miningOperationSelect,
  });
}

export async function getMiningOperationsPageData(
  filters: MiningOperationFilters = {}
): Promise<MiningOperationsPageData> {
  const actionFilter = normalizeActionFilter(filters.actionFilter);
  const where = buildWhere(filters);
  const [filteredOperations, allOperations] = await Promise.all([
    fetchOperations(where),
    fetchOperations(),
  ]);
  const confirmedTimeline = buildConfirmedSalesTimeline(allOperations);

  const rows = filteredOperations
    .map((operation) => mapListItem(operation, confirmedTimeline))
    .filter((row) => filterByAction(row, actionFilter));
  const pendingActions = rows
    .filter((row) => Boolean(row.nextActionManual) || row.suggestedAction.hasPendingAction)
    .map<MiningOperationPendingActionItem>((row) => ({
      id: row.id,
      clientName: row.clientName,
      commercialStatusLabel: row.commercialStatusLabel,
      operationalStatusLabel: row.operationalStatusLabel,
      actionText: row.nextActionManual ?? row.suggestedAction.text,
      actionAt: row.nextActionAt ?? row.suggestedAction.at,
      isDueNow: row.nextActionAt ? row.isNextActionDueNow : row.suggestedAction.isDueNow,
      isManual: Boolean(row.nextActionManual),
      commissionSummary: row.commission.summary,
    }))
    .sort((a, b) => {
      if (a.isDueNow !== b.isDueNow) return a.isDueNow ? -1 : 1;
      const aAt = a.actionAt ? new Date(a.actionAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bAt = b.actionAt ? new Date(b.actionAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aAt - bAt;
    })
    .slice(0, 8);

  const metricsRows = allOperations.map((operation) => mapListItem(operation, confirmedTimeline));
  const metrics: MiningOperationMetrics = {
    totalOperations: metricsRows.length,
    contractsSent: metricsRows.filter(
      (row) => row.commercialStatus === MiningCommercialStatus.CONTRACT_SENT
    ).length,
    contractsSigned: metricsRows.filter(
      (row) => row.commercialStatus === MiningCommercialStatus.CONTRACT_SIGNED
    ).length,
    paymentsReceived: metricsRows.filter(
      (row) => row.commercialStatus === MiningCommercialStatus.PAYMENT_RECEIVED
    ).length,
    paymentProofsUploaded: metricsRows.filter(
      (row) => row.commercialStatus === MiningCommercialStatus.PAYMENT_PROOF_UPLOADED
    ).length,
    readyForAndes: metricsRows.filter(
      (row) => row.operationalStatus === MiningOperationalStatus.READY_FOR_ANDES
    ).length,
    active: metricsRows.filter((row) => row.operationalStatus === MiningOperationalStatus.ACTIVE)
      .length,
    commissionsPending: metricsRows.filter((row) =>
      PENDING_COMMISSION_STATUSES.includes(row.commissionStatus)
    ).length,
    commissionsPaidOrReceived: metricsRows.filter((row) =>
      PAID_OR_RECEIVED_COMMISSION_STATUSES.includes(row.commissionStatus)
    ).length,
  };

  const countryOptions = Array.from(
    new Set(allOperations.map((operation) => operation.country.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "es"));

  return {
    filters: {
      productType: normalizeEnumFilter(filters.productType, Object.values(MiningOperationProductType)),
      commercialStatus: normalizeEnumFilter(
        filters.commercialStatus,
        Object.values(MiningCommercialStatus)
      ),
      operationalStatus: normalizeEnumFilter(
        filters.operationalStatus,
        Object.values(MiningOperationalStatus)
      ),
      commissionStatus: normalizeEnumFilter(
        filters.commissionStatus,
        Object.values(MiningCommissionStatus)
      ),
      currency: normalizeEnumFilter(filters.currency, Object.values(MiningMoneyCurrency)),
      country: String(filters.country ?? "").trim(),
      actionFilter,
    },
    rows,
    metrics,
    pendingActions,
    countryOptions,
  };
}

export async function getMiningOperationCreateCommissionPreviewSeed(): Promise<MiningCommissionPreviewSeed> {
  const confirmedOperations = await prisma.miningOperation.findMany({
    where: {
      commercialStatus: { in: CONFIRMED_SALE_STATUSES },
    },
    select: miningOperationCommissionContextSelect,
  });
  const confirmedTimeline = buildConfirmedSalesTimeline(confirmedOperations);

  return {
    nextProbableSaleSequence: confirmedTimeline.length + 1,
    currentConfirmedSequence: null,
    agreementStartLabel: PARTNER_PROGRAM_START_LABEL,
    initialSuggestedDueAt: null,
  };
}

export async function getMiningOperationsMetrics() {
  const data = await getMiningOperationsPageData();
  return data.metrics;
}

export async function getMiningOperationByProspectId(prospectId: string) {
  const normalized = normalizeText(prospectId);
  if (!normalized) return null;

  const operation = await prisma.miningOperation.findUnique({
    where: { prospectId: normalized },
    select: { id: true, clientName: true },
  });

  return operation;
}

export async function getMiningOperationById(
  operationId: string
): Promise<MiningOperationDetail | null> {
  const normalized = normalizeText(operationId);
  if (!normalized) return null;

  const [operation, confirmedOperations] = await Promise.all([
    prisma.miningOperation.findUnique({
      where: { id: normalized },
      select: miningOperationSelect,
    }),
    prisma.miningOperation.findMany({
      where: {
        commercialStatus: { in: CONFIRMED_SALE_STATUSES },
      },
      select: miningOperationCommissionContextSelect,
    }),
  ]);

  if (!operation) return null;

  const primaryContact = pickPrimaryContact(operation);
  const confirmedTimeline = buildConfirmedSalesTimeline(confirmedOperations);
  const partnerSaleContext = resolvePartnerSaleContext(operation, confirmedTimeline);
  const commissionSuggestion = buildCommissionSuggestion(operation, partnerSaleContext);

  return {
    id: operation.id,
    prospect: operation.prospect
      ? {
          id: operation.prospect.id,
          name: operation.prospect.name,
          statusLabel: operation.prospect.status,
        }
      : null,
    clientName: operation.clientName,
    clientCompanyName: operation.clientCompanyName ?? "",
    country: operation.country,
    whatsapp: operation.whatsapp ?? "",
    email: operation.email ?? "",
    instagramUrl: operation.instagramUrl ?? "",
    linkedinUrl: operation.linkedinUrl ?? "",
    xUrl: operation.xUrl ?? "",
    productType: operation.productType,
    productDescription: operation.productDescription ?? "",
    asicModel: operation.asicModel ?? "",
    quantity: operation.quantity !== null ? String(operation.quantity) : "",
    grossSaleAmount: toDecimalString(operation.grossSaleAmount) ?? "",
    grossSaleCurrency: operation.grossSaleCurrency,
    paymentCurrency: operation.paymentCurrency,
    grossSaleAmountClp: toDecimalString(operation.grossSaleAmountClp) ?? "",
    grossSaleAmountBtc: toDecimalString(operation.grossSaleAmountBtc) ?? "",
    commercialStatus: operation.commercialStatus,
    docusignUrl: operation.docusignUrl ?? "",
    signedContractUrl: operation.signedContractUrl ?? "",
    paymentProofUrl: operation.paymentProofUrl ?? "",
    operationalStatus: operation.operationalStatus,
    andesOperationalNotes: operation.andesOperationalNotes ?? "",
    salesCommissionRate: toDecimalString(operation.salesCommissionRate) ?? "",
    salesCommissionAmount: toDecimalString(operation.salesCommissionAmount) ?? "",
    salesCommissionCurrency: operation.salesCommissionCurrency,
    commissionStatus: operation.commissionStatus,
    commissionDueAt: toDateInput(operation.commissionDueAt),
    commissionPaidAt: toDateInput(operation.commissionPaidAt),
    commissionReceivedAt: toDateInput(operation.commissionReceivedAt),
    commissionPaymentProofUrl: operation.commissionPaymentProofUrl ?? "",
    monthlyHostingAmount: toDecimalString(operation.monthlyHostingAmount) ?? "",
    monthlyHostingCurrency: operation.monthlyHostingCurrency,
    monthlyHostingCommissionRate: toDecimalString(operation.monthlyHostingCommissionRate) ?? "",
    monthlyHostingCommissionAmount:
      toDecimalString(operation.monthlyHostingCommissionAmount) ?? "",
    hostingCommissionActive: operation.hostingCommissionActive,
    commissionNotes: operation.commissionNotes ?? "",
    nextAction: operation.nextAction ?? "",
    nextActionAt: toDateInput(operation.nextActionAt),
    internalNotes: operation.internalNotes ?? "",
    createdAt: operation.createdAt.toISOString(),
    updatedAt: operation.updatedAt.toISOString(),
    commercialDates: {
      contractPreparationAt: toIso(operation.contractPreparationAt),
      contractSentAt: toIso(operation.contractSentAt),
      contractSignedAt: toIso(operation.contractSignedAt),
      paymentPendingAt: toIso(operation.paymentPendingAt),
      paymentReceivedAt: toIso(operation.paymentReceivedAt),
      paymentProofUploadedAt: toIso(operation.paymentProofUploadedAt),
      cancelledAt: toIso(operation.cancelledAt),
    },
    operationalDates: {
      sharedWithPartnerAt: toIso(operation.sharedWithPartnerAt),
      receivedByAndesAt: toIso(operation.receivedByAndesAt),
      activationPendingAt: toIso(operation.activationPendingAt),
      activatedAt: toIso(operation.activatedAt),
      incidentAt: toIso(operation.incidentAt),
      closedAt: toIso(operation.closedAt),
    },
    suggestedAction: suggestMiningOperationNextAction(operation),
    primaryContactLabel: primaryContact.label,
    primaryContactValue: primaryContact.value,
    commissionSuggestion,
    commissionPreviewSeed: {
      nextProbableSaleSequence: partnerSaleContext.nextProbableSaleSequence,
      currentConfirmedSequence: partnerSaleContext.currentConfirmedSequence,
      agreementStartLabel: PARTNER_PROGRAM_START_LABEL,
      initialSuggestedDueAt: commissionSuggestion.suggestedDueAt,
    },
  };
}

async function fetchConfirmedOperationsForPartnerProgram() {
  return prisma.miningOperation.findMany({
    where: {
      commercialStatus: { in: CONFIRMED_SALE_STATUSES },
    },
    select: miningOperationCommissionContextSelect,
  });
}

async function buildCreateData(
  input: MiningOperationMutationInput,
  actorUserId: string
): Promise<Prisma.MiningOperationCreateInput> {
  const productType = normalizeProductType(input.productType);
  const commercialStatus = normalizeCommercialStatus(input.commercialStatus);
  const operationalStatus = normalizeOperationalStatus(input.operationalStatus);
  const grossSaleCurrency = normalizeMoneyCurrency(
    input.grossSaleCurrency,
    MiningMoneyCurrency.USD,
    "invalid_gross_sale_currency"
  );
  const paymentCurrency = normalizeMoneyCurrency(
    input.paymentCurrency,
    grossSaleCurrency,
    "invalid_payment_currency"
  );

  const initialCommercialDates: MiningCommercialDateFields = {
    contractPreparationAt: null,
    contractSentAt: null,
    contractSignedAt: null,
    paymentPendingAt: null,
    paymentReceivedAt: null,
    paymentProofUploadedAt: null,
    cancelledAt: null,
  };

  const initialOperationalDates: MiningOperationalDateFields = {
    sharedWithPartnerAt: null,
    receivedByAndesAt: null,
    activationPendingAt: null,
    activatedAt: null,
    incidentAt: null,
    closedAt: null,
  };
  const [automaticCommercialDates, confirmedOperations] = await Promise.all([
    Promise.resolve(pickCommercialTimestampPatch(commercialStatus, initialCommercialDates)),
    fetchConfirmedOperationsForPartnerProgram(),
  ]);
  const partnerSaleContext = resolvePartnerSaleContext(
    {
      id: "__new_operation__",
      commercialStatus,
      paymentReceivedAt:
        "paymentReceivedAt" in automaticCommercialDates
          ? automaticCommercialDates.paymentReceivedAt ?? null
          : null,
      paymentProofUploadedAt:
        "paymentProofUploadedAt" in automaticCommercialDates
          ? automaticCommercialDates.paymentProofUploadedAt ?? null
          : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    buildConfirmedSalesTimeline(confirmedOperations)
  );

  return {
    clientName: normalizeRequiredText(input.clientName, "client_name"),
    clientCompanyName: normalizeText(input.clientCompanyName),
    country: normalizeCountry(input.country),
    whatsapp: normalizeText(input.whatsapp),
    email: normalizeOptionalEmail(input.email),
    instagramUrl: normalizeOptionalUrl(input.instagramUrl),
    linkedinUrl: normalizeOptionalUrl(input.linkedinUrl),
    xUrl: normalizeOptionalUrl(input.xUrl),
    productType,
    productDescription: normalizeText(input.productDescription),
    asicModel: normalizeText(input.asicModel),
    quantity: parseNullableInt(input.quantity, "invalid_quantity"),
    grossSaleAmount: parseNullableDecimal(input.grossSaleAmount, "invalid_gross_sale_amount"),
    grossSaleCurrency,
    paymentCurrency,
    grossSaleAmountClp: parseNullableDecimal(
      input.grossSaleAmountClp,
      "invalid_gross_sale_amount_clp"
    ),
    grossSaleAmountBtc: parseNullableDecimal(
      input.grossSaleAmountBtc,
      "invalid_gross_sale_amount_btc"
    ),
    commercialStatus,
    docusignUrl: normalizeOptionalUrl(input.docusignUrl),
    signedContractUrl: normalizeOptionalUrl(input.signedContractUrl),
    paymentProofUrl: normalizeOptionalUrl(input.paymentProofUrl),
    operationalStatus,
    andesOperationalNotes: normalizeText(input.andesOperationalNotes),
    partnerLevel: partnerSaleContext.partnerLevel,
    salesCommissionRate: parseNullableDecimal(
      input.salesCommissionRate,
      "invalid_sales_commission_rate"
    ),
    salesCommissionAmount: parseNullableDecimal(
      input.salesCommissionAmount,
      "invalid_sales_commission_amount"
    ),
    salesCommissionCurrency: normalizeMoneyCurrency(
      input.salesCommissionCurrency,
      grossSaleCurrency,
      "invalid_sales_commission_currency"
    ),
    commissionStatus: normalizeCommissionStatus(input.commissionStatus),
    commissionDueAt: parseNullableDate(input.commissionDueAt, "invalid_commission_due_at"),
    commissionPaidAt: parseNullableDate(input.commissionPaidAt, "invalid_commission_paid_at"),
    commissionReceivedAt: parseNullableDate(
      input.commissionReceivedAt,
      "invalid_commission_received_at"
    ),
    commissionPaymentProofUrl: normalizeOptionalUrl(input.commissionPaymentProofUrl),
    monthlyHostingAmount: parseNullableDecimal(
      input.monthlyHostingAmount,
      "invalid_monthly_hosting_amount"
    ),
    monthlyHostingCurrency: normalizeMoneyCurrency(
      input.monthlyHostingCurrency,
      paymentCurrency,
      "invalid_monthly_hosting_currency"
    ),
    monthlyHostingCommissionRate: parseNullableDecimal(
      input.monthlyHostingCommissionRate,
      "invalid_monthly_hosting_commission_rate"
    ),
    monthlyHostingCommissionAmount: parseNullableDecimal(
      input.monthlyHostingCommissionAmount,
      "invalid_monthly_hosting_commission_amount"
    ),
    hostingCommissionActive: normalizeBoolean(input.hostingCommissionActive),
    commissionNotes: normalizeText(input.commissionNotes),
    nextAction: normalizeText(input.nextAction),
    nextActionAt: parseNullableDate(input.nextActionAt, "invalid_next_action_at"),
    internalNotes: normalizeText(input.internalNotes),
    createdBy: { connect: { id: actorUserId } },
    updatedBy: { connect: { id: actorUserId } },
    ...automaticCommercialDates,
    ...pickOperationalTimestampPatch(operationalStatus, initialOperationalDates),
  };
}

async function buildUpdateData(
  current: MiningOperationRecord,
  input: MiningOperationMutationInput,
  actorUserId: string
): Promise<Prisma.MiningOperationUpdateInput> {
  const productType = normalizeProductType(input.productType ?? current.productType);
  const commercialStatus = normalizeCommercialStatus(
    input.commercialStatus ?? current.commercialStatus
  );
  const operationalStatus = normalizeOperationalStatus(
    input.operationalStatus ?? current.operationalStatus
  );
  const grossSaleCurrency = normalizeMoneyCurrency(
    input.grossSaleCurrency ?? current.grossSaleCurrency,
    current.grossSaleCurrency,
    "invalid_gross_sale_currency"
  );
  const paymentCurrency = normalizeMoneyCurrency(
    input.paymentCurrency ?? current.paymentCurrency,
    current.paymentCurrency,
    "invalid_payment_currency"
  );
  const [automaticCommercialDates, confirmedOperations] = await Promise.all([
    Promise.resolve(pickCommercialTimestampPatch(commercialStatus, readCommercialDates(current))),
    fetchConfirmedOperationsForPartnerProgram(),
  ]);
  const partnerSaleContext = resolvePartnerSaleContext(
    {
      id: current.id,
      commercialStatus,
      paymentReceivedAt:
        "paymentReceivedAt" in automaticCommercialDates
          ? automaticCommercialDates.paymentReceivedAt ?? current.paymentReceivedAt
          : current.paymentReceivedAt,
      paymentProofUploadedAt:
        "paymentProofUploadedAt" in automaticCommercialDates
          ? automaticCommercialDates.paymentProofUploadedAt ?? current.paymentProofUploadedAt
          : current.paymentProofUploadedAt,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
    },
    buildConfirmedSalesTimeline(confirmedOperations)
  );

  return {
    clientName: normalizeRequiredText(input.clientName, "client_name"),
    clientCompanyName: normalizeText(input.clientCompanyName),
    country: normalizeCountry(input.country ?? current.country),
    whatsapp: normalizeText(input.whatsapp),
    email: normalizeOptionalEmail(input.email),
    instagramUrl: normalizeOptionalUrl(input.instagramUrl),
    linkedinUrl: normalizeOptionalUrl(input.linkedinUrl),
    xUrl: normalizeOptionalUrl(input.xUrl),
    productType,
    productDescription: normalizeText(input.productDescription),
    asicModel: normalizeText(input.asicModel),
    quantity: parseNullableInt(input.quantity, "invalid_quantity"),
    grossSaleAmount: parseNullableDecimal(input.grossSaleAmount, "invalid_gross_sale_amount"),
    grossSaleCurrency,
    paymentCurrency,
    grossSaleAmountClp: parseNullableDecimal(
      input.grossSaleAmountClp,
      "invalid_gross_sale_amount_clp"
    ),
    grossSaleAmountBtc: parseNullableDecimal(
      input.grossSaleAmountBtc,
      "invalid_gross_sale_amount_btc"
    ),
    commercialStatus,
    docusignUrl: normalizeOptionalUrl(input.docusignUrl),
    signedContractUrl: normalizeOptionalUrl(input.signedContractUrl),
    paymentProofUrl: normalizeOptionalUrl(input.paymentProofUrl),
    operationalStatus,
    andesOperationalNotes: normalizeText(input.andesOperationalNotes),
    partnerLevel: partnerSaleContext.partnerLevel,
    salesCommissionRate: parseNullableDecimal(
      input.salesCommissionRate,
      "invalid_sales_commission_rate"
    ),
    salesCommissionAmount: parseNullableDecimal(
      input.salesCommissionAmount,
      "invalid_sales_commission_amount"
    ),
    salesCommissionCurrency: normalizeMoneyCurrency(
      input.salesCommissionCurrency ?? current.salesCommissionCurrency,
      current.salesCommissionCurrency,
      "invalid_sales_commission_currency"
    ),
    commissionStatus: normalizeCommissionStatus(input.commissionStatus ?? current.commissionStatus),
    commissionDueAt: parseNullableDate(input.commissionDueAt, "invalid_commission_due_at"),
    commissionPaidAt: parseNullableDate(input.commissionPaidAt, "invalid_commission_paid_at"),
    commissionReceivedAt: parseNullableDate(
      input.commissionReceivedAt,
      "invalid_commission_received_at"
    ),
    commissionPaymentProofUrl: normalizeOptionalUrl(input.commissionPaymentProofUrl),
    monthlyHostingAmount: parseNullableDecimal(
      input.monthlyHostingAmount,
      "invalid_monthly_hosting_amount"
    ),
    monthlyHostingCurrency: normalizeMoneyCurrency(
      input.monthlyHostingCurrency ?? current.monthlyHostingCurrency,
      current.monthlyHostingCurrency,
      "invalid_monthly_hosting_currency"
    ),
    monthlyHostingCommissionRate: parseNullableDecimal(
      input.monthlyHostingCommissionRate,
      "invalid_monthly_hosting_commission_rate"
    ),
    monthlyHostingCommissionAmount: parseNullableDecimal(
      input.monthlyHostingCommissionAmount,
      "invalid_monthly_hosting_commission_amount"
    ),
    hostingCommissionActive: normalizeBoolean(input.hostingCommissionActive),
    commissionNotes: normalizeText(input.commissionNotes),
    nextAction: normalizeText(input.nextAction),
    nextActionAt: parseNullableDate(input.nextActionAt, "invalid_next_action_at"),
    internalNotes: normalizeText(input.internalNotes),
    updatedBy: { connect: { id: actorUserId } },
    ...automaticCommercialDates,
    ...pickOperationalTimestampPatch(operationalStatus, readOperationalDates(current)),
  };
}

export async function createMiningOperation(
  input: MiningOperationMutationInput,
  actorUserId: string
) {
  const data = await buildCreateData(input, actorUserId);
  const created = await prisma.miningOperation.create({
    data,
    select: { id: true },
  });

  return created;
}

export async function updateMiningOperation(
  operationId: string,
  input: MiningOperationMutationInput,
  actorUserId: string
) {
  const normalized = normalizeText(operationId);
  if (!normalized) {
    throw new Error("operation_not_found");
  }

  const current = await prisma.miningOperation.findUnique({
    where: { id: normalized },
    select: miningOperationSelect,
  });

  if (!current) {
    throw new Error("operation_not_found");
  }

  const data = await buildUpdateData(current, input, actorUserId);
  const updated = await prisma.miningOperation.update({
    where: { id: normalized },
    data,
    select: { id: true },
  });

  return updated;
}

function mapProspectInterestTypeToProductType(interestType: MiningInterestType) {
  switch (interestType) {
    case MiningInterestType.FRACTIONAL_MINING:
      return MiningOperationProductType.FRACTIONAL_MINING;
    case MiningInterestType.TOKENIZED_MINING:
      return MiningOperationProductType.TOKENIZED_MINING;
    case MiningInterestType.ASIC_PURCHASE:
      return MiningOperationProductType.ASIC_HOSTING;
    case MiningInterestType.UNDEFINED:
      return MiningOperationProductType.OTHER;
  }
}

export async function promoteMiningProspectToOperation(
  prospectId: string,
  actorUserId: string
) {
  const normalized = normalizeText(prospectId);
  if (!normalized) {
    throw new Error("prospect_not_found");
  }

  const existing = await prisma.miningOperation.findUnique({
    where: { prospectId: normalized },
    select: { id: true },
  });

  if (existing) {
    return { id: existing.id, created: false as const };
  }

  const prospect = await prisma.miningProspect.findUnique({
    where: { id: normalized },
    select: {
      id: true,
      name: true,
      companyName: true,
      country: true,
      whatsapp: true,
      email: true,
      instagramUrl: true,
      linkedinUrl: true,
      xUrl: true,
      interestType: true,
      estimatedAmountUsd: true,
    },
  });

  if (!prospect) {
    throw new Error("prospect_not_found");
  }

  const confirmedOperations = await fetchConfirmedOperationsForPartnerProgram();
  const partnerSaleContext = resolvePartnerSaleContext(
    {
      id: "__promoted_operation__",
      commercialStatus: MiningCommercialStatus.CONTRACT_PREPARATION,
      paymentReceivedAt: null,
      paymentProofUploadedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    buildConfirmedSalesTimeline(confirmedOperations)
  );

  try {
    const created = await prisma.miningOperation.create({
      data: {
        prospect: { connect: { id: prospect.id } },
        clientName: prospect.name,
        clientCompanyName: prospect.companyName,
        country: prospect.country,
        whatsapp: prospect.whatsapp,
        email: prospect.email,
        instagramUrl: prospect.instagramUrl,
        linkedinUrl: prospect.linkedinUrl,
        xUrl: prospect.xUrl,
        productType: mapProspectInterestTypeToProductType(prospect.interestType),
        grossSaleAmount: prospect.estimatedAmountUsd,
        grossSaleCurrency: MiningMoneyCurrency.USD,
        paymentCurrency: MiningMoneyCurrency.USD,
        commercialStatus: MiningCommercialStatus.CONTRACT_PREPARATION,
        operationalStatus: MiningOperationalStatus.NOT_SHARED,
        partnerLevel: partnerSaleContext.partnerLevel,
        commissionStatus: MiningCommissionStatus.PENDING_CALCULATION,
        createdBy: { connect: { id: actorUserId } },
        updatedBy: { connect: { id: actorUserId } },
        contractPreparationAt: new Date(),
      },
      select: { id: true },
    });

    return { id: created.id, created: true as const };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await prisma.miningOperation.findUnique({
        where: { prospectId: normalized },
        select: { id: true },
      });

      if (duplicate) {
        return { id: duplicate.id, created: false as const };
      }
    }

    throw error;
  }
}
