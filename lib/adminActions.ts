import "server-only";

import { createHash } from "crypto";
import {
  AdminActionEffectType,
  AdminActionStatus,
  AdminActionType,
  AdminExternalBtcAssignmentStatus,
  AssetCode,
  CommercialStatus,
  CompanySubscriptionPlan,
  CompanySubscriptionStatus,
  InternalMovementReason,
  InternalMovementState,
  Prisma,
  SubscriptionChargeStatus,
  TreasuryMovementStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCompanyCommercialSnapshot } from "@/lib/adminCommercial";
import { ensureSystemWallet } from "@/lib/systemWallet";
import { approveMovementAsSystem } from "@/lib/treasury/approveMovement";
import { PRICING_KEYS } from "@/lib/pricing";

type JsonRecord = Prisma.InputJsonObject;

const ADMIN_ACTION_MAX_SNAPSHOT_AGE_MINUTES = (() => {
  const parsed = Number(process.env.ADMIN_ACTION_MAX_SNAPSHOT_AGE_MINUTES ?? "15");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
})();

const ADMIN_ACTION_RECONCILE_TIMEOUT_MINUTES = (() => {
  const parsed = Number(process.env.ADMIN_ACTION_RECONCILE_TIMEOUT_MINUTES ?? "15");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
})();

export const adminActionTypeOptions: ReadonlyArray<{
  value: AdminActionType | "all";
  label: string;
}> = [
  { value: "all", label: "Todas" },
  { value: AdminActionType.SUBSCRIPTION_CHARGE_MANUAL, label: "Cobro suscripción" },
  { value: AdminActionType.CLIENT_BUY_BTC, label: "Compra BTC" },
  { value: AdminActionType.CLIENT_SELL_BTC, label: "Venta BTC" },
  { value: AdminActionType.CLIENT_ASSIGN_BTC_EXTERNAL, label: "Asignación BTC externa" },
];

export const adminActionStatusOptions: ReadonlyArray<{
  value: AdminActionStatus | "all";
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: AdminActionStatus.PENDING, label: "Pending" },
  { value: AdminActionStatus.PROCESSING, label: "Processing" },
  { value: AdminActionStatus.SUCCEEDED, label: "Succeeded" },
  { value: AdminActionStatus.FAILED, label: "Failed" },
  { value: AdminActionStatus.CANCELLED, label: "Cancelled" },
];

type AdminActionListFilter = {
  companyId?: string | null;
  q?: string | null;
  type?: string | null;
  status?: string | null;
  take?: number;
};

export type AdminActionListItem = {
  id: string;
  type: AdminActionType;
  typeLabel: string;
  status: AdminActionStatus;
  statusLabel: string;
  actorAdminEmail: string;
  targetCompanyId: string;
  targetCompanyName: string;
  createdAt: string;
  completedAt: string | null;
  reason: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  resultSummary: string | null;
};

export type AdminActionDetail = {
  id: string;
  type: AdminActionType;
  typeLabel: string;
  status: AdminActionStatus;
  statusLabel: string;
  actorAdminEmail: string;
  targetCompanyId: string;
  targetCompanyName: string;
  targetUserId: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  idempotencyKey: string;
  reason: string | null;
  requestPayload: Prisma.JsonValue | null;
  validatedContext: Prisma.JsonValue | null;
  resultPayload: Prisma.JsonValue | null;
  errorCode: string | null;
  errorMessage: string | null;
  effects: Array<{
    id: string;
    effectType: AdminActionEffectType;
    entityId: string;
    label: string | null;
    payload: Prisma.JsonValue | null;
    createdAt: string;
  }>;
  subscriptionCharge: null | {
    id: string;
    status: SubscriptionChargeStatus;
    referenceAmountUsd: string;
    debitAssetCode: AssetCode;
    debitAmount: string | null;
    createdAt: string;
    chargedAt: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    clientMovementId: string | null;
    systemMovementId: string | null;
  };
  externalBtcAssignment: null | {
    id: string;
    status: AdminExternalBtcAssignmentStatus;
    amountBtc: string;
    provider: string | null;
    externalReference: string | null;
    referencePriceClp: string | null;
    referenceFeeClp: string | null;
    createdAt: string;
    assignedAt: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    clientMovementId: string | null;
    systemMovementId: string | null;
  };
};

type ActionCreationResult = {
  actionId: string;
  status: AdminActionStatus;
  reused: boolean;
};

function normalizeText(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function isManualPriceSource(source: string | null | undefined) {
  return String(source ?? "").toLowerCase().startsWith("manual:");
}

function snapshotMeta(snapshot: {
  price: Prisma.Decimal;
  source: string | null;
  createdAt: Date;
}) {
  return {
    price: snapshot.price.toString(),
    source: snapshot.source ?? null,
    createdAt: snapshot.createdAt.toISOString(),
    isManualSource: isManualPriceSource(snapshot.source),
  } satisfies JsonRecord;
}

function asJsonRecord(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, Prisma.JsonValue>;
}

function readJsonString(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" ? value : null;
}

function isActionStale(startedAt: Date | null, createdAt: Date) {
  const pivot = startedAt ?? createdAt;
  return Date.now() - pivot.getTime() > ADMIN_ACTION_RECONCILE_TIMEOUT_MINUTES * 60_000;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableSerialize(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function requestHash(payload: unknown) {
  return createHash("sha256").update(stableSerialize(payload)).digest("hex");
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function parsePositiveDecimal(raw: string | null | undefined, errorCode: string) {
  const text = normalizeText(raw);
  if (!text) throw new Error(errorCode);
  let decimal: Prisma.Decimal;
  try {
    decimal = new Prisma.Decimal(text);
  } catch {
    throw new Error(errorCode);
  }
  if (!decimal.gt(0)) throw new Error(errorCode);
  return decimal;
}

function parseOptionalDecimal(
  raw: string | null | undefined,
  errorCode: string
) {
  const text = normalizeText(raw);
  if (!text) return null;
  return parsePositiveDecimal(text, errorCode);
}

function normalizeAssetCode(raw: string | null | undefined) {
  const value = String(raw ?? "").trim().toUpperCase();
  if (value === AssetCode.CLP) return AssetCode.CLP;
  if (value === AssetCode.USD) return AssetCode.USD;
  if (value === AssetCode.BTC) return AssetCode.BTC;
  throw new Error("invalid_asset_code");
}

function normalizeAmountForAsset(assetCode: AssetCode, amount: Prisma.Decimal) {
  if (assetCode === AssetCode.CLP) return new Prisma.Decimal(amount.toFixed(0));
  if (assetCode === AssetCode.USD) return new Prisma.Decimal(amount.toFixed(2));
  return new Prisma.Decimal(amount.toFixed(8));
}

function adminActionTypeLabel(type: AdminActionType) {
  return (
    adminActionTypeOptions.find((option) => option.value === type)?.label ??
    String(type)
  );
}

function adminActionStatusLabel(status: AdminActionStatus) {
  switch (status) {
    case AdminActionStatus.PENDING:
      return "Pending";
    case AdminActionStatus.PROCESSING:
      return "Processing";
    case AdminActionStatus.SUCCEEDED:
      return "Succeeded";
    case AdminActionStatus.FAILED:
      return "Failed";
    case AdminActionStatus.CANCELLED:
      return "Cancelled";
    default:
      return String(status);
  }
}

function summarizeResult(type: AdminActionType, payload: Prisma.JsonValue | null) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  if (type === AdminActionType.SUBSCRIPTION_CHARGE_MANUAL) {
    return `Cobro ${String(record.debitAmount ?? "—")} ${String(record.debitAssetCode ?? "")}`.trim();
  }
  if (type === AdminActionType.CLIENT_BUY_BTC) {
    return `Compra ${String(record.baseAmountBtc ?? "—")} BTC`;
  }
  if (type === AdminActionType.CLIENT_SELL_BTC) {
    return `Venta ${String(record.baseAmountBtc ?? "—")} BTC`;
  }
  if (type === AdminActionType.CLIENT_ASSIGN_BTC_EXTERNAL) {
    return `Asignación ${String(record.amountBtc ?? "—")} BTC`;
  }
  return null;
}

function filterActionType(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return Object.values(AdminActionType).includes(normalized as AdminActionType)
    ? (normalized as AdminActionType)
    : null;
}

function filterActionStatus(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return Object.values(AdminActionStatus).includes(normalized as AdminActionStatus)
    ? (normalized as AdminActionStatus)
    : null;
}

async function getOperationalCompany(companyId: string) {
  const normalized = normalizeText(companyId);
  if (!normalized) throw new Error("company_not_found");

  const company = await prisma.company.findFirst({
    where: {
      id: normalized,
      name: { not: "__SYSTEM_WALLET__" },
    },
    select: {
      id: true,
      name: true,
      kind: true,
    },
  });

  if (!company) throw new Error("company_not_found");
  return company;
}

async function resolveAdminShadowUserId(actorAdminUserId: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { id: actorAdminUserId },
    select: { email: true },
  });

  if (!admin?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: admin.email.toLowerCase().trim() },
    select: { id: true },
  });

  return user?.id ?? null;
}

async function getLatestPriceSnapshot(
  assetCode: AssetCode,
  quoteCode: AssetCode,
  options?: { allowManualFallback?: boolean; maxAgeMinutes?: number }
) {
  const maxAgeMinutes = options?.maxAgeMinutes ?? ADMIN_ACTION_MAX_SNAPSHOT_AGE_MINUTES;
  const whereBase = { assetCode, quoteCode };
  const automated = await prisma.priceSnapshot.findFirst({
    where: {
      ...whereBase,
      NOT: {
        source: { startsWith: "manual:", mode: "insensitive" },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      price: true,
      source: true,
      createdAt: true,
    },
  });

  if (automated) {
    if (Date.now() - automated.createdAt.getTime() > maxAgeMinutes * 60_000) {
      throw new Error("price_snapshot_stale");
    }
    return {
      price: new Prisma.Decimal(automated.price),
      source: automated.source,
      createdAt: automated.createdAt,
    };
  }

  if (!options?.allowManualFallback) {
    throw new Error("price_snapshot_missing");
  }

  const manual = await prisma.priceSnapshot.findFirst({
    where: whereBase,
    orderBy: { createdAt: "desc" },
    select: {
      price: true,
      source: true,
      createdAt: true,
    },
  });

  if (!manual) throw new Error("price_snapshot_missing");
  if (Date.now() - manual.createdAt.getTime() > maxAgeMinutes * 60_000) {
    throw new Error("price_snapshot_stale");
  }

  return {
    price: new Prisma.Decimal(manual.price),
    source: manual.source,
    createdAt: manual.createdAt,
  };
}

function findEffectiveField(
  snapshot: Awaited<ReturnType<typeof getCompanyCommercialSnapshot>>,
  key: string
) {
  return snapshot?.pricing.effectiveFields.find((field) => field.key === key) ?? null;
}

function parseEffectiveDecimalField(
  snapshot: Awaited<ReturnType<typeof getCompanyCommercialSnapshot>>,
  key: string
) {
  const field = findEffectiveField(snapshot, key);
  if (!field) throw new Error("pricing_field_missing");
  try {
    return new Prisma.Decimal(field.value);
  } catch {
    throw new Error("pricing_field_invalid");
  }
}

async function createOrReuseAction(input: {
  type: AdminActionType;
  actorAdminUserId: string;
  targetCompanyId: string;
  targetUserId?: string | null;
  idempotencyKey: string;
  requestPayload: JsonRecord;
  reason?: string | null;
}) {
  const payloadHash = requestHash(input.requestPayload);

  const compareOrThrow = async () => {
    const existing = await prisma.adminAction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: {
        id: true,
        type: true,
        status: true,
        targetCompanyId: true,
        targetUserId: true,
        requestHash: true,
      },
    });

    if (!existing) return null;
    if (
      existing.type !== input.type ||
      existing.targetCompanyId !== input.targetCompanyId ||
      existing.targetUserId !== (input.targetUserId ?? null) ||
      existing.requestHash !== payloadHash
    ) {
      throw new Error("idempotency_conflict");
    }
    return existing;
  };

  const existing = await compareOrThrow();
  if (existing) {
    return {
      actionId: existing.id,
      status: existing.status,
      reused: true,
    } satisfies ActionCreationResult;
  }

  const openByHash = await prisma.adminAction.findFirst({
    where: {
      type: input.type,
      targetCompanyId: input.targetCompanyId,
      targetUserId: input.targetUserId ?? null,
      requestHash: payloadHash,
      status: {
        in: [AdminActionStatus.PENDING, AdminActionStatus.PROCESSING],
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
    },
  });

  if (openByHash) {
    return {
      actionId: openByHash.id,
      status: openByHash.status,
      reused: true,
    } satisfies ActionCreationResult;
  }

  try {
    const created = await prisma.adminAction.create({
      data: {
        type: input.type,
        status: AdminActionStatus.PENDING,
        actorAdminUserId: input.actorAdminUserId,
        targetCompanyId: input.targetCompanyId,
        targetUserId: input.targetUserId ?? null,
        idempotencyKey: input.idempotencyKey,
        requestHash: payloadHash,
        requestPayload: input.requestPayload,
        reason: normalizeText(input.reason),
      },
      select: {
        id: true,
        status: true,
      },
    });

    return {
      actionId: created.id,
      status: created.status,
      reused: false,
    } satisfies ActionCreationResult;
  } catch (error: unknown) {
    if (!isUniqueConstraintError(error)) throw error;
    const raced = await compareOrThrow();
    if (!raced) throw error;
    return {
      actionId: raced.id,
      status: raced.status,
      reused: true,
    } satisfies ActionCreationResult;
  }
}

async function markActionProcessing(actionId: string, validatedContext: JsonRecord) {
  const claimed = await prisma.adminAction.updateMany({
    where: {
      id: actionId,
      status: AdminActionStatus.PENDING,
    },
    data: {
      status: AdminActionStatus.PROCESSING,
      startedAt: new Date(),
      validatedContext,
    },
  });

  return claimed.count > 0;
}

async function markActionFailedIfOpen(
  actionId: string,
  errorCode: string,
  errorMessage?: string | null
) {
  await prisma.adminAction.updateMany({
    where: {
      id: actionId,
      status: {
        in: [AdminActionStatus.PENDING, AdminActionStatus.PROCESSING],
      },
    },
    data: {
      status: AdminActionStatus.FAILED,
      errorCode,
      errorMessage: normalizeText(errorMessage) ?? errorCode,
      completedAt: new Date(),
    },
  });
}

async function createActionEffect(
  tx: Prisma.TransactionClient,
  input: {
    actionId: string;
    effectType: AdminActionEffectType;
    entityId: string;
    label?: string | null;
    payload?: Prisma.InputJsonValue;
  }
) {
  const existing = await tx.adminActionEffect.findFirst({
    where: {
      actionId: input.actionId,
      effectType: input.effectType,
      entityId: input.entityId,
    },
    select: { id: true },
  });

  if (existing) return existing.id;

  const created = await tx.adminActionEffect.create({
    data: {
      actionId: input.actionId,
      effectType: input.effectType,
      entityId: input.entityId,
      label: normalizeText(input.label),
      payload: input.payload,
    },
    select: { id: true },
  });

  return created.id;
}

async function ensureTreasuryAccount(
  tx: Prisma.TransactionClient,
  companyId: string,
  assetCode: AssetCode
) {
  await tx.treasuryAccount.upsert({
    where: { companyId_assetCode: { companyId, assetCode } },
    update: {},
    create: {
      companyId,
      assetCode,
      balance: new Prisma.Decimal(0),
    },
  });
}

async function applyCompanySystemTransfer(params: {
  tx: Prisma.TransactionClient;
  actionId: string;
  targetCompanyId: string;
  targetCompanyName: string;
  systemCompanyId: string;
  assetCode: AssetCode;
  amount: Prisma.Decimal;
  direction: "client_to_system" | "system_to_client";
  actorUserId?: string | null;
  executedSource: string;
  internalReason: InternalMovementReason;
  executedPrice?: Prisma.Decimal | null;
  executedQuoteCode?: AssetCode | null;
  executedQuoteAmount?: Prisma.Decimal | null;
  note?: string | null;
}) {
  const {
    tx,
    actionId,
    targetCompanyId,
    targetCompanyName,
    systemCompanyId,
    assetCode,
    amount,
    direction,
    actorUserId,
    executedSource,
    internalReason,
    executedPrice,
    executedQuoteCode,
    executedQuoteAmount,
    note,
  } = params;

  await ensureTreasuryAccount(tx, targetCompanyId, assetCode);
  await ensureTreasuryAccount(tx, systemCompanyId, assetCode);

  const now = new Date();
  const debitCompanyId = direction === "client_to_system" ? targetCompanyId : systemCompanyId;
  const creditCompanyId = direction === "client_to_system" ? systemCompanyId : targetCompanyId;
  const debit = await tx.treasuryAccount.updateMany({
    where: {
      companyId: debitCompanyId,
      assetCode,
      balance: { gte: amount },
    },
    data: {
      balance: { decrement: amount },
    },
  });

  if (!debit.count) {
    return {
      ok: false as const,
      errorCode:
        direction === "client_to_system"
          ? "INSUFFICIENT_CLIENT_FUNDS"
          : "SYSTEM_WALLET_INSUFFICIENT",
    };
  }

  await tx.treasuryAccount.update({
    where: { companyId_assetCode: { companyId: creditCompanyId, assetCode } },
    data: {
      balance: { increment: amount },
    },
  });

  const clientMovementType = direction === "client_to_system" ? "withdraw" : "deposit";
  const systemMovementType = direction === "client_to_system" ? "deposit" : "withdraw";
  const clientNote = [note, `adminAction:${actionId}`].filter(Boolean).join(" · ");
  const systemNote = [
    note,
    `counterparty:${targetCompanyName}`,
    `adminAction:${actionId}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const clientMovement = await tx.treasuryMovement.create({
    data: {
      companyId: targetCompanyId,
      assetCode,
      type: clientMovementType,
      amount,
      note: clientNote || null,
      createdByUserId: actorUserId ?? undefined,
      approvedByUserId: actorUserId ?? undefined,
      approvedAt: now,
      status: TreasuryMovementStatus.APPROVED,
      executedAt: now,
      executedPrice: executedPrice ?? undefined,
      executedQuoteCode: executedQuoteCode ?? undefined,
      executedSource,
      executedBaseAmount: amount,
      executedQuoteAmount: executedQuoteAmount ?? undefined,
      executedFeeAmount: new Prisma.Decimal(0),
      executedFeeCode: assetCode,
      internalReason,
      internalState: InternalMovementState.NONE,
    },
    select: { id: true },
  });

  const systemMovement = await tx.treasuryMovement.create({
    data: {
      companyId: systemCompanyId,
      assetCode,
      type: systemMovementType,
      amount,
      note: systemNote || null,
      createdByUserId: actorUserId ?? undefined,
      approvedByUserId: actorUserId ?? undefined,
      approvedAt: now,
      status: TreasuryMovementStatus.APPROVED,
      executedAt: now,
      executedPrice: executedPrice ?? undefined,
      executedQuoteCode: executedQuoteCode ?? undefined,
      executedSource,
      executedBaseAmount: amount,
      executedQuoteAmount: executedQuoteAmount ?? undefined,
      executedFeeAmount: new Prisma.Decimal(0),
      executedFeeCode: assetCode,
      internalReason,
      internalState: InternalMovementState.NONE,
    },
    select: { id: true },
  });

  await createActionEffect(tx, {
    actionId,
    effectType: AdminActionEffectType.TREASURY_MOVEMENT,
    entityId: clientMovement.id,
    label: "Movimiento cliente",
  });
  await createActionEffect(tx, {
    actionId,
    effectType: AdminActionEffectType.TREASURY_MOVEMENT,
    entityId: systemMovement.id,
    label: "Movimiento system wallet",
  });

  return {
    ok: true as const,
    clientMovementId: clientMovement.id,
    systemMovementId: systemMovement.id,
  };
}

async function resolveSubscriptionReferenceAmountUsd(companyId: string) {
  const snapshot = await getCompanyCommercialSnapshot(companyId);
  if (!snapshot) throw new Error("company_not_found");
  ensureCommerciallyOperable(snapshot);
  if (!snapshot.subscription.isConfigured) throw new Error("subscription_not_configured");
  if (snapshot.subscription.status !== CompanySubscriptionStatus.ACTIVE) {
    throw new Error("subscription_not_active");
  }
  if (snapshot.subscription.plan === CompanySubscriptionPlan.FREE_TEMP) {
    throw new Error("subscription_free_temp");
  }
  if (snapshot.subscription.plan === CompanySubscriptionPlan.CUSTOM_FIXED_USD) {
    if (!snapshot.subscription.customAmountUsd) throw new Error("custom_amount_required");
    return new Prisma.Decimal(snapshot.subscription.customAmountUsd);
  }
  if (!snapshot.subscription.baseAmountUsd) throw new Error("base_amount_required");
  return new Prisma.Decimal(snapshot.subscription.baseAmountUsd);
}

function ensureCommerciallyOperable(
  snapshot: Awaited<ReturnType<typeof getCompanyCommercialSnapshot>>
) {
  if (!snapshot) throw new Error("company_not_found");
  if (snapshot.commercial.status !== CommercialStatus.ACTIVE) {
    throw new Error("company_not_commercially_active");
  }
}

async function markActionSucceededInTx(
  tx: Prisma.TransactionClient,
  actionId: string,
  resultPayload: JsonRecord
) {
  await tx.adminAction.update({
    where: { id: actionId },
    data: {
      status: AdminActionStatus.SUCCEEDED,
      resultPayload,
      errorCode: null,
      errorMessage: null,
      completedAt: new Date(),
    },
  });
}

async function markActionFailedInTx(
  tx: Prisma.TransactionClient,
  actionId: string,
  errorCode: string,
  errorMessage?: string | null
) {
  await tx.adminAction.update({
    where: { id: actionId },
    data: {
      status: AdminActionStatus.FAILED,
      errorCode,
      errorMessage: normalizeText(errorMessage) ?? errorCode,
      completedAt: new Date(),
    },
  });
}

async function findClientTradeMovementForAction(
  tx: Prisma.TransactionClient,
  actionId: string,
  companyId: string
) {
  return tx.treasuryMovement.findFirst({
    where: {
      companyId,
      internalNote: { contains: `adminAction=${actionId}` },
      internalReason: InternalMovementReason.ADMIN_TRADE,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      companyId: true,
      assetCode: true,
      type: true,
      amount: true,
      note: true,
      status: true,
      lastError: true,
      internalState: true,
      executedAt: true,
      executedPrice: true,
      executedQuoteCode: true,
      executedQuoteAmount: true,
      executedBaseAmount: true,
      executedFeeAmount: true,
      executedFeeCode: true,
      executedSource: true,
      approvedByUserId: true,
      createdByUserId: true,
    },
  });
}

async function ensureAdminTradeSystemMirror(params: {
  tx: Prisma.TransactionClient;
  actionId: string;
  targetCompanyName: string;
  clientMovement: Awaited<ReturnType<typeof findClientTradeMovementForAction>>;
}) {
  const { tx, actionId, targetCompanyName, clientMovement } = params;
  if (!clientMovement) throw new Error("trade_movement_missing");

  const { companyId: systemCompanyId } = await ensureSystemWallet(tx);
  const existing = await tx.treasuryMovement.findFirst({
    where: {
      companyId: systemCompanyId,
      internalNote: { contains: `systemMirrorOf=${clientMovement.id}` },
      internalReason: InternalMovementReason.ADMIN_TRADE,
    },
    select: { id: true },
  });

  if (existing) {
    await createActionEffect(tx, {
      actionId,
      effectType: AdminActionEffectType.TREASURY_MOVEMENT,
      entityId: existing.id,
      label: "Movimiento system wallet trade admin",
      payload: {
        mirrorRole: "system_wallet",
        clientMovementId: clientMovement.id,
      },
    });
    return existing.id;
  }

  const isBuy = clientMovement.type === "deposit" || clientMovement.type === "buy";
  const executedBaseAmount =
    clientMovement.executedBaseAmount != null
      ? new Prisma.Decimal(clientMovement.executedBaseAmount)
      : new Prisma.Decimal(clientMovement.amount);
  const executedFeeAmount =
    clientMovement.executedFeeAmount != null
      ? new Prisma.Decimal(clientMovement.executedFeeAmount)
      : new Prisma.Decimal(0);
  const feeCode = clientMovement.executedFeeCode ?? clientMovement.assetCode;
  const mirrorAmount = isBuy
    ? executedBaseAmount
    : feeCode === clientMovement.assetCode
    ? executedBaseAmount.plus(executedFeeAmount)
    : executedBaseAmount;

  const mirror = await tx.treasuryMovement.create({
    data: {
      companyId: systemCompanyId,
      assetCode: clientMovement.assetCode,
      type: isBuy ? "withdraw" : "deposit",
      amount: mirrorAmount,
      note: [
        `counterparty:${targetCompanyName}`,
        `adminAction:${actionId}`,
        `systemMirrorOf:${clientMovement.id}`,
      ].join(" · "),
      internalNote: [
        `adminAction=${actionId}`,
        "mirror=system_trade",
        `systemMirrorOf=${clientMovement.id}`,
        `clientMovement=${clientMovement.id}`,
      ].join(";"),
      createdByUserId: clientMovement.createdByUserId ?? clientMovement.approvedByUserId ?? undefined,
      approvedByUserId:
        clientMovement.approvedByUserId ?? clientMovement.createdByUserId ?? undefined,
      approvedAt: clientMovement.executedAt ?? new Date(),
      status: TreasuryMovementStatus.APPROVED,
      executedAt: clientMovement.executedAt ?? new Date(),
      executedPrice: clientMovement.executedPrice ?? undefined,
      executedQuoteCode: clientMovement.executedQuoteCode ?? undefined,
      executedSource: "admin:trade_system_mirror",
      executedBaseAmount,
      executedQuoteAmount: clientMovement.executedQuoteAmount ?? undefined,
      executedFeeAmount: clientMovement.executedFeeAmount ?? undefined,
      executedFeeCode: clientMovement.executedFeeCode ?? undefined,
      internalReason: InternalMovementReason.ADMIN_TRADE,
      internalState: InternalMovementState.NONE,
    },
    select: { id: true },
  });

  await createActionEffect(tx, {
    actionId,
    effectType: AdminActionEffectType.TREASURY_MOVEMENT,
    entityId: mirror.id,
    label: "Movimiento system wallet trade admin",
    payload: {
      mirrorRole: "system_wallet",
      clientMovementId: clientMovement.id,
      mirrorAmount: mirrorAmount.toString(),
    },
  });

  return mirror.id;
}

function buildTradeResultPayload(params: {
  actionId: string;
  side: "buy" | "sell";
  feePct: Prisma.Decimal | null;
  priceSnapshot: JsonRecord | null;
  clientMovement: NonNullable<Awaited<ReturnType<typeof findClientTradeMovementForAction>>>;
  systemMovementId: string | null;
}) {
  const { side, feePct, priceSnapshot, clientMovement, systemMovementId } = params;
  const fallbackQuoteAmount =
    clientMovement.executedQuoteAmount != null
      ? new Prisma.Decimal(clientMovement.executedQuoteAmount)
      : clientMovement.executedPrice != null
      ? new Prisma.Decimal(clientMovement.executedPrice).mul(
          clientMovement.executedBaseAmount != null
            ? new Prisma.Decimal(clientMovement.executedBaseAmount)
            : new Prisma.Decimal(clientMovement.amount)
        )
      : null;

  return {
    movementId: clientMovement.id,
    systemMovementId,
    side,
    feePct: feePct?.toString() ?? null,
    priceClp: clientMovement.executedPrice?.toString() ?? null,
    baseAmountBtc:
      clientMovement.executedBaseAmount?.toString() ?? clientMovement.amount.toString(),
    quoteAmountClp: fallbackQuoteAmount?.toString() ?? null,
    feeAmount: clientMovement.executedFeeAmount?.toString() ?? null,
    feeCode: clientMovement.executedFeeCode ?? null,
    executedSource: clientMovement.executedSource ?? null,
    executedAt: toIso(clientMovement.executedAt),
    executionSource: "SYSTEM_WALLET_ONLY",
    priceSnapshot,
  } satisfies JsonRecord;
}

type SubscriptionChargeParams = {
  actorAdminUserId: string;
  companyId: string;
  debitAssetCode: string;
  note?: string | null;
  idempotencyKey: string;
};

export async function executeManualSubscriptionChargeFromAdmin(
  input: SubscriptionChargeParams
) {
  const company = await getOperationalCompany(input.companyId);
  const debitAssetCode = normalizeAssetCode(input.debitAssetCode);
  const referenceAmountUsd = await resolveSubscriptionReferenceAmountUsd(company.id);
  const normalizedNote = normalizeText(input.note);
  const requestPayload: JsonRecord = {
    debitAssetCode,
    referenceAmountUsd: referenceAmountUsd.toString(),
    note: normalizedNote,
  };

  const created = await createOrReuseAction({
    type: AdminActionType.SUBSCRIPTION_CHARGE_MANUAL,
    actorAdminUserId: input.actorAdminUserId,
    targetCompanyId: company.id,
    idempotencyKey: input.idempotencyKey,
    requestPayload,
    reason: input.note,
  });

  if (created.reused && created.status !== AdminActionStatus.PENDING) {
    return getAdminActionDetail(created.actionId);
  }

  const clpPerUsdSnapshot =
    debitAssetCode === AssetCode.CLP || debitAssetCode === AssetCode.BTC
      ? await getLatestPriceSnapshot(AssetCode.USD, AssetCode.CLP, { allowManualFallback: true })
      : null;

  const btcClpSnapshot =
    debitAssetCode === AssetCode.BTC
      ? await getLatestPriceSnapshot(AssetCode.BTC, AssetCode.CLP, { allowManualFallback: true })
      : null;

  const debitAmountRaw =
    debitAssetCode === AssetCode.USD
      ? referenceAmountUsd
      : debitAssetCode === AssetCode.CLP
      ? referenceAmountUsd.mul(clpPerUsdSnapshot!.price)
      : referenceAmountUsd.mul(clpPerUsdSnapshot!.price).div(btcClpSnapshot!.price);
  const debitAmount = normalizeAmountForAsset(debitAssetCode, debitAmountRaw);

  const claimed = await markActionProcessing(created.actionId, {
    subscriptionReferenceUsd: referenceAmountUsd.toString(),
    debitAssetCode,
    debitAmount: debitAmount.toString(),
    priceSnapshots: {
      usdClp: clpPerUsdSnapshot ? snapshotMeta(clpPerUsdSnapshot) : null,
      btcClp: btcClpSnapshot ? snapshotMeta(btcClpSnapshot) : null,
    },
  });
  if (!claimed) {
    return getAdminActionDetail(created.actionId);
  }

  const charge = await prisma.subscriptionCharge.upsert({
    where: { adminActionId: created.actionId },
    update: {},
    create: {
      adminActionId: created.actionId,
      companyId: company.id,
      status: SubscriptionChargeStatus.PENDING,
      referenceAmountUsd,
      debitAssetCode,
      note: normalizedNote,
    },
    select: { id: true },
  });

  const actorUserId = await resolveAdminShadowUserId(input.actorAdminUserId);

  try {
    await prisma.$transaction(async (tx) => {
      const { companyId: systemCompanyId } = await ensureSystemWallet(tx);
      const transferResult = await applyCompanySystemTransfer({
        tx,
        actionId: created.actionId,
        targetCompanyId: company.id,
        targetCompanyName: company.name,
        systemCompanyId,
        assetCode: debitAssetCode,
        amount: debitAmount,
        direction: "client_to_system",
        actorUserId,
        executedSource: "admin:subscription_charge",
        internalReason: InternalMovementReason.ADMIN_SUBSCRIPTION_CHARGE,
        executedPrice:
          debitAssetCode === AssetCode.CLP
            ? new Prisma.Decimal(1)
            : debitAssetCode === AssetCode.USD
            ? clpPerUsdSnapshot?.price ?? null
            : btcClpSnapshot?.price ?? null,
        executedQuoteCode:
          debitAssetCode === AssetCode.BTC || debitAssetCode === AssetCode.USD
            ? AssetCode.CLP
            : AssetCode.CLP,
        executedQuoteAmount:
          debitAssetCode === AssetCode.CLP
            ? debitAmount
            : referenceAmountUsd.mul(clpPerUsdSnapshot?.price ?? new Prisma.Decimal(0)),
        note: normalizedNote,
      });

      if (!transferResult.ok) {
        await tx.subscriptionCharge.update({
          where: { id: charge.id },
          data: {
            status: SubscriptionChargeStatus.FAILED,
            debitAmount,
            clpPerUsd: clpPerUsdSnapshot?.price ?? null,
            btcClpPrice: btcClpSnapshot?.price ?? null,
            errorCode: transferResult.errorCode,
            errorMessage:
              transferResult.errorCode === "INSUFFICIENT_CLIENT_FUNDS"
                ? "Saldo insuficiente para cobrar la suscripción."
                : "System wallet sin saldo suficiente para reflejar el cargo.",
          },
        });
        await createActionEffect(tx, {
          actionId: created.actionId,
          effectType: AdminActionEffectType.SUBSCRIPTION_CHARGE,
          entityId: charge.id,
          label: "SubscriptionCharge failed",
        });
        await markActionFailedInTx(tx, created.actionId, transferResult.errorCode);
        return;
      }

      await tx.subscriptionCharge.update({
        where: { id: charge.id },
        data: {
          status: SubscriptionChargeStatus.SUCCEEDED,
          debitAmount,
          clpPerUsd: clpPerUsdSnapshot?.price ?? null,
          btcClpPrice: btcClpSnapshot?.price ?? null,
          chargedAt: new Date(),
          clientMovementId: transferResult.clientMovementId,
          systemMovementId: transferResult.systemMovementId,
          errorCode: null,
          errorMessage: null,
        },
      });
      await createActionEffect(tx, {
        actionId: created.actionId,
        effectType: AdminActionEffectType.SUBSCRIPTION_CHARGE,
        entityId: charge.id,
        label: "SubscriptionCharge",
      });
      await markActionSucceededInTx(tx, created.actionId, {
        referenceAmountUsd: referenceAmountUsd.toString(),
        debitAssetCode,
        debitAmount: debitAmount.toString(),
        clientMovementId: transferResult.clientMovementId,
        systemMovementId: transferResult.systemMovementId,
        priceSnapshots: {
          usdClp: clpPerUsdSnapshot ? snapshotMeta(clpPerUsdSnapshot) : null,
          btcClp: btcClpSnapshot ? snapshotMeta(btcClpSnapshot) : null,
        },
      });
    });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : "subscription_charge_failed";
    await prisma.subscriptionCharge.update({
      where: { id: charge.id },
      data: {
        status: SubscriptionChargeStatus.FAILED,
        debitAmount,
        clpPerUsd: clpPerUsdSnapshot?.price ?? null,
        btcClpPrice: btcClpSnapshot?.price ?? null,
        errorCode: code,
        errorMessage: code,
      },
    });
    await markActionFailedIfOpen(created.actionId, code);
    return getAdminActionDetail(created.actionId);
  }

  return getAdminActionDetail(created.actionId);
}

type AdminTradeParams = {
  actorAdminUserId: string;
  companyId: string;
  idempotencyKey: string;
  note?: string | null;
  referencePriceClp?: string | null;
  spendAmountClp?: string | null;
  amountBtc?: string | null;
  side: "buy" | "sell";
};

async function executeAdminBtcTrade(params: AdminTradeParams) {
  const company = await getOperationalCompany(params.companyId);
  const commercial = await getCompanyCommercialSnapshot(company.id);
  ensureCommerciallyOperable(commercial);

  if (normalizeText(params.referencePriceClp)) {
    throw new Error("manual_reference_price_disabled");
  }

  const btcClpSnapshot = await getLatestPriceSnapshot(AssetCode.BTC, AssetCode.CLP, {
    allowManualFallback: false,
  });
  const price = btcClpSnapshot.price;

  const feePct = parseEffectiveDecimalField(
    commercial,
    params.side === "buy"
      ? PRICING_KEYS.TRADE_BUY_BTC_FEE_PCT
      : PRICING_KEYS.TRADE_SELL_BTC_FEE_PCT
  );

  const spendAmountClp =
    params.side === "buy"
      ? parsePositiveDecimal(params.spendAmountClp, "invalid_spend_amount_clp")
      : null;
  const amountBtc =
    params.side === "sell"
      ? parsePositiveDecimal(params.amountBtc, "invalid_amount_btc")
      : spendAmountClp!.minus(spendAmountClp!.mul(feePct)).div(price);

  const requestPayload: JsonRecord = {
    executionSource: "SYSTEM_WALLET_ONLY",
    priceClp: price.toString(),
    priceSnapshot: snapshotMeta(btcClpSnapshot),
    feePct: feePct.toString(),
    side: params.side,
    spendAmountClp: spendAmountClp?.toString() ?? null,
    amountBtc: amountBtc.toString(),
    note: normalizeText(params.note),
  };

  const actionType =
    params.side === "buy" ? AdminActionType.CLIENT_BUY_BTC : AdminActionType.CLIENT_SELL_BTC;
  const created = await createOrReuseAction({
    type: actionType,
    actorAdminUserId: params.actorAdminUserId,
    targetCompanyId: company.id,
    idempotencyKey: params.idempotencyKey,
    requestPayload,
    reason: params.note,
  });

  if (created.reused && created.status !== AdminActionStatus.PENDING) {
    return getAdminActionDetail(created.actionId);
  }

  const claimed = await markActionProcessing(created.actionId, {
    commercialStatus: commercial?.commercial.statusLabel ?? "—",
    feePct: feePct.toString(),
    priceClp: price.toString(),
    executionPolicy: "system_wallet_only",
    priceSnapshot: snapshotMeta(btcClpSnapshot),
  });
  if (!claimed) {
    return getAdminActionDetail(created.actionId);
  }

  const actorUserId = await resolveAdminShadowUserId(params.actorAdminUserId);
  try {
    const movement = await prisma.treasuryMovement.create({
      data: {
        companyId: company.id,
        assetCode: AssetCode.BTC,
        type: params.side === "buy" ? "deposit" : "withdraw",
        amount: amountBtc,
        note:
          [normalizeText(params.note), `adminAction:${created.actionId}`].filter(Boolean).join(" · ") ||
          null,
        createdByUserId: actorUserId ?? undefined,
        status: TreasuryMovementStatus.PROCESSING,
        executedPrice: price,
        executedQuoteAmount:
          params.side === "buy" ? spendAmountClp ?? undefined : amountBtc.mul(price),
        executedQuoteCode: AssetCode.CLP,
        executedSource: params.side === "buy" ? "admin:buy_btc" : "admin:sell_btc",
        internalReason: InternalMovementReason.ADMIN_TRADE,
        internalState: InternalMovementState.NONE,
        internalNote: `adminAction=${created.actionId};execution=system_wallet_only`,
      },
      select: { id: true },
    });

    await approveMovementAsSystem({
      movementId: movement.id,
      companyId: company.id,
      actorUserId,
      correlationId: created.actionId,
      skipSync: true,
      requireSystemWallet: true,
      feePercentOverride: feePct,
      successInternalReason: InternalMovementReason.ADMIN_TRADE,
    });
    return reconcileAdminActionById(created.actionId);
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : "trade_execution_failed";
    return reconcileAdminActionById(created.actionId, {
      fallbackErrorCode: code,
      fallbackErrorMessage: code,
    });
  }
}

export async function executeAdminBuyBtcFromAdmin(input: Omit<AdminTradeParams, "side" | "amountBtc"> & {
  spendAmountClp: string;
}) {
  return executeAdminBtcTrade({
    ...input,
    side: "buy",
  });
}

export async function executeAdminSellBtcFromAdmin(input: Omit<AdminTradeParams, "side" | "spendAmountClp"> & {
  amountBtc: string;
}) {
  return executeAdminBtcTrade({
    ...input,
    side: "sell",
  });
}

type ExternalAssignmentParams = {
  actorAdminUserId: string;
  companyId: string;
  idempotencyKey: string;
  amountBtc: string;
  provider?: string | null;
  externalReference?: string | null;
  referencePriceClp?: string | null;
  referenceFeeClp?: string | null;
  note?: string | null;
};

export async function executeAdminExternalBtcAssignmentFromAdmin(
  input: ExternalAssignmentParams
) {
  const company = await getOperationalCompany(input.companyId);
  const commercial = await getCompanyCommercialSnapshot(company.id);
  ensureCommerciallyOperable(commercial);
  const normalizedProvider = normalizeText(input.provider);
  const normalizedExternalReference = normalizeText(input.externalReference);
  if (!normalizedProvider) throw new Error("provider_required");
  if (!normalizedExternalReference) throw new Error("external_reference_required");

  const amountBtc = normalizeAmountForAsset(
    AssetCode.BTC,
    parsePositiveDecimal(input.amountBtc, "invalid_amount_btc")
  );
  const referencePriceClp =
    parseOptionalDecimal(input.referencePriceClp, "invalid_reference_price_clp") ??
    null;
  const referenceFeeClp = parseOptionalDecimal(input.referenceFeeClp, "invalid_reference_fee_clp");
  const requestPayload: JsonRecord = {
    amountBtc: amountBtc.toString(),
    provider: normalizedProvider,
    externalReference: normalizedExternalReference,
    referencePriceClp: referencePriceClp?.toString() ?? null,
    referenceFeeClp: referenceFeeClp?.toString() ?? null,
    executionSource: "SYSTEM_WALLET_ONLY",
    note: normalizeText(input.note),
  };

  const created = await createOrReuseAction({
    type: AdminActionType.CLIENT_ASSIGN_BTC_EXTERNAL,
    actorAdminUserId: input.actorAdminUserId,
    targetCompanyId: company.id,
    idempotencyKey: input.idempotencyKey,
    requestPayload,
    reason: input.note,
  });

  if (created.reused && created.status !== AdminActionStatus.PENDING) {
    return getAdminActionDetail(created.actionId);
  }

  const fallbackBtcClpSnapshot =
    referencePriceClp == null
      ? await getLatestPriceSnapshot(AssetCode.BTC, AssetCode.CLP, {
          allowManualFallback: true,
        })
      : null;

  const claimed = await markActionProcessing(created.actionId, {
    commercialStatus: commercial?.commercial.statusLabel ?? "—",
    amountBtc: amountBtc.toString(),
    provider: normalizedProvider,
    externalReference: normalizedExternalReference,
    priceSnapshot: fallbackBtcClpSnapshot ? snapshotMeta(fallbackBtcClpSnapshot) : null,
  });
  if (!claimed) {
    return getAdminActionDetail(created.actionId);
  }

  const assignment = await prisma.adminExternalBtcAssignment.upsert({
    where: { adminActionId: created.actionId },
    update: {},
    create: {
      adminActionId: created.actionId,
      companyId: company.id,
      status: AdminExternalBtcAssignmentStatus.PENDING,
      amountBtc,
      provider: normalizedProvider,
      externalReference: normalizedExternalReference,
      referencePriceClp,
      referenceFeeClp,
      note: normalizeText(input.note),
    },
    select: { id: true },
  });

  const actorUserId = await resolveAdminShadowUserId(input.actorAdminUserId);
  const fallbackBtcClpPrice = referencePriceClp ?? fallbackBtcClpSnapshot!.price;
  const quoteAmount = amountBtc.mul(fallbackBtcClpPrice);

  try {
    await prisma.$transaction(async (tx) => {
      const { companyId: systemCompanyId } = await ensureSystemWallet(tx);
      const transferResult = await applyCompanySystemTransfer({
        tx,
        actionId: created.actionId,
        targetCompanyId: company.id,
        targetCompanyName: company.name,
        systemCompanyId,
        assetCode: AssetCode.BTC,
        amount: amountBtc,
        direction: "system_to_client",
        actorUserId,
        executedSource: "admin:external_btc_assignment",
        internalReason: InternalMovementReason.ADMIN_MANUAL_ASSIGNMENT,
        executedPrice: fallbackBtcClpPrice,
        executedQuoteCode: AssetCode.CLP,
        executedQuoteAmount: quoteAmount,
        note: normalizeText(input.note),
      });

      if (!transferResult.ok) {
        await tx.adminExternalBtcAssignment.update({
          where: { id: assignment.id },
          data: {
            status: AdminExternalBtcAssignmentStatus.FAILED,
            errorCode: transferResult.errorCode,
            errorMessage:
              transferResult.errorCode === "SYSTEM_WALLET_INSUFFICIENT"
                ? "System wallet sin BTC suficiente para asignar."
                : "No se pudo aplicar la asignación manual.",
          },
        });
        await createActionEffect(tx, {
          actionId: created.actionId,
          effectType: AdminActionEffectType.EXTERNAL_BTC_ASSIGNMENT,
          entityId: assignment.id,
          label: "Asignación externa fallida",
        });
        await markActionFailedInTx(tx, created.actionId, transferResult.errorCode);
        return;
      }

      await tx.adminExternalBtcAssignment.update({
        where: { id: assignment.id },
        data: {
          status: AdminExternalBtcAssignmentStatus.SUCCEEDED,
          assignedAt: new Date(),
          clientMovementId: transferResult.clientMovementId,
          systemMovementId: transferResult.systemMovementId,
          errorCode: null,
          errorMessage: null,
        },
      });
      await createActionEffect(tx, {
        actionId: created.actionId,
        effectType: AdminActionEffectType.EXTERNAL_BTC_ASSIGNMENT,
        entityId: assignment.id,
        label: "Asignación externa",
      });
      await markActionSucceededInTx(tx, created.actionId, {
        amountBtc: amountBtc.toString(),
        provider: normalizedProvider,
        externalReference: normalizedExternalReference,
        referencePriceClp: fallbackBtcClpPrice.toString(),
        referenceFeeClp: referenceFeeClp?.toString() ?? null,
        clientMovementId: transferResult.clientMovementId,
        systemMovementId: transferResult.systemMovementId,
        executionSource: "SYSTEM_WALLET_ONLY",
        priceSnapshot: fallbackBtcClpSnapshot ? snapshotMeta(fallbackBtcClpSnapshot) : null,
      });
    });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : "external_assignment_failed";
    await prisma.adminExternalBtcAssignment.update({
      where: { id: assignment.id },
      data: {
        status: AdminExternalBtcAssignmentStatus.FAILED,
        errorCode: code,
        errorMessage: code,
      },
    });
    await markActionFailedIfOpen(created.actionId, code);
    return getAdminActionDetail(created.actionId);
  }

  return getAdminActionDetail(created.actionId);
}

type ReconcileAdminActionOptions = {
  fallbackErrorCode?: string | null;
  fallbackErrorMessage?: string | null;
};

async function reconcileSubscriptionChargeAction(
  action: {
    id: string;
    status: AdminActionStatus;
    createdAt: Date;
    startedAt: Date | null;
  },
  options?: ReconcileAdminActionOptions
) {
  await prisma.$transaction(async (tx) => {
    const charge = await tx.subscriptionCharge.findUnique({
      where: { adminActionId: action.id },
      select: {
        id: true,
        status: true,
        referenceAmountUsd: true,
        debitAssetCode: true,
        debitAmount: true,
        clpPerUsd: true,
        btcClpPrice: true,
        errorCode: true,
        errorMessage: true,
        clientMovementId: true,
        systemMovementId: true,
      },
    });

    if (!charge) {
      if (options?.fallbackErrorCode || isActionStale(action.startedAt, action.createdAt)) {
        await markActionFailedInTx(
          tx,
          action.id,
          options?.fallbackErrorCode ?? "subscription_charge_orphaned",
          options?.fallbackErrorMessage ?? options?.fallbackErrorCode ?? "subscription_charge_orphaned"
        );
      }
      return;
    }

    await createActionEffect(tx, {
      actionId: action.id,
      effectType: AdminActionEffectType.SUBSCRIPTION_CHARGE,
      entityId: charge.id,
      label:
        charge.status === SubscriptionChargeStatus.SUCCEEDED
          ? "SubscriptionCharge"
          : "SubscriptionCharge failed",
    });

    if (charge.clientMovementId) {
      await createActionEffect(tx, {
        actionId: action.id,
        effectType: AdminActionEffectType.TREASURY_MOVEMENT,
        entityId: charge.clientMovementId,
        label: "Movimiento cliente",
      });
    }
    if (charge.systemMovementId) {
      await createActionEffect(tx, {
        actionId: action.id,
        effectType: AdminActionEffectType.TREASURY_MOVEMENT,
        entityId: charge.systemMovementId,
        label: "Movimiento system wallet",
      });
    }

    if (charge.status === SubscriptionChargeStatus.SUCCEEDED) {
      await markActionSucceededInTx(tx, action.id, {
        referenceAmountUsd: charge.referenceAmountUsd.toString(),
        debitAssetCode: charge.debitAssetCode,
        debitAmount: charge.debitAmount?.toString() ?? null,
        clientMovementId: charge.clientMovementId,
        systemMovementId: charge.systemMovementId,
        priceSnapshots: {
          usdClp:
            charge.clpPerUsd != null
              ? {
                  price: charge.clpPerUsd.toString(),
                  source: "persisted:subscription_charge",
                  createdAt: null,
                  isManualSource: null,
                }
              : null,
          btcClp:
            charge.btcClpPrice != null
              ? {
                  price: charge.btcClpPrice.toString(),
                  source: "persisted:subscription_charge",
                  createdAt: null,
                  isManualSource: null,
                }
              : null,
        },
      });
      return;
    }

    if (
      charge.status === SubscriptionChargeStatus.FAILED ||
      options?.fallbackErrorCode ||
      isActionStale(action.startedAt, action.createdAt)
    ) {
      await markActionFailedInTx(
        tx,
        action.id,
        charge.errorCode ??
          options?.fallbackErrorCode ??
          "subscription_charge_failed_unreconciled",
        charge.errorMessage ??
          options?.fallbackErrorMessage ??
          charge.errorCode ??
          options?.fallbackErrorCode
      );
    }
  });
}

async function reconcileExternalAssignmentAction(
  action: {
    id: string;
    status: AdminActionStatus;
    createdAt: Date;
    startedAt: Date | null;
  },
  options?: ReconcileAdminActionOptions
) {
  await prisma.$transaction(async (tx) => {
    const assignment = await tx.adminExternalBtcAssignment.findUnique({
      where: { adminActionId: action.id },
      select: {
        id: true,
        status: true,
        amountBtc: true,
        provider: true,
        externalReference: true,
        referencePriceClp: true,
        referenceFeeClp: true,
        errorCode: true,
        errorMessage: true,
        clientMovementId: true,
        systemMovementId: true,
      },
    });

    if (!assignment) {
      if (options?.fallbackErrorCode || isActionStale(action.startedAt, action.createdAt)) {
        await markActionFailedInTx(
          tx,
          action.id,
          options?.fallbackErrorCode ?? "external_assignment_orphaned",
          options?.fallbackErrorMessage ?? options?.fallbackErrorCode ?? "external_assignment_orphaned"
        );
      }
      return;
    }

    await createActionEffect(tx, {
      actionId: action.id,
      effectType: AdminActionEffectType.EXTERNAL_BTC_ASSIGNMENT,
      entityId: assignment.id,
      label:
        assignment.status === AdminExternalBtcAssignmentStatus.SUCCEEDED
          ? "Asignación externa"
          : "Asignación externa fallida",
    });

    if (assignment.clientMovementId) {
      await createActionEffect(tx, {
        actionId: action.id,
        effectType: AdminActionEffectType.TREASURY_MOVEMENT,
        entityId: assignment.clientMovementId,
        label: "Movimiento cliente",
      });
    }
    if (assignment.systemMovementId) {
      await createActionEffect(tx, {
        actionId: action.id,
        effectType: AdminActionEffectType.TREASURY_MOVEMENT,
        entityId: assignment.systemMovementId,
        label: "Movimiento system wallet",
      });
    }

    if (assignment.status === AdminExternalBtcAssignmentStatus.SUCCEEDED) {
      await markActionSucceededInTx(tx, action.id, {
        amountBtc: assignment.amountBtc.toString(),
        provider: assignment.provider,
        externalReference: assignment.externalReference,
        referencePriceClp: assignment.referencePriceClp?.toString() ?? null,
        referenceFeeClp: assignment.referenceFeeClp?.toString() ?? null,
        clientMovementId: assignment.clientMovementId,
        systemMovementId: assignment.systemMovementId,
        executionSource: "SYSTEM_WALLET_ONLY",
      });
      return;
    }

    if (
      assignment.status === AdminExternalBtcAssignmentStatus.FAILED ||
      options?.fallbackErrorCode ||
      isActionStale(action.startedAt, action.createdAt)
    ) {
      await markActionFailedInTx(
        tx,
        action.id,
        assignment.errorCode ??
          options?.fallbackErrorCode ??
          "external_assignment_failed_unreconciled",
        assignment.errorMessage ??
          options?.fallbackErrorMessage ??
          assignment.errorCode ??
          options?.fallbackErrorCode
      );
    }
  });
}

async function reconcileTradeAction(
  action: {
    id: string;
    type: AdminActionType;
    status: AdminActionStatus;
    targetCompanyId: string;
    createdAt: Date;
    startedAt: Date | null;
    validatedContext: Prisma.JsonValue | null;
    targetCompany: { name: string };
  },
  options?: ReconcileAdminActionOptions
) {
  const validatedContext = asJsonRecord(action.validatedContext);
  const feePctRaw = readJsonString(validatedContext?.feePct);
  const feePct = feePctRaw ? new Prisma.Decimal(feePctRaw) : null;
  const priceSnapshotRecord = asJsonRecord(validatedContext?.priceSnapshot) as JsonRecord | null;

  await prisma.$transaction(async (tx) => {
    const clientMovement = await findClientTradeMovementForAction(
      tx,
      action.id,
      action.targetCompanyId
    );

    if (!clientMovement) {
      if (options?.fallbackErrorCode || isActionStale(action.startedAt, action.createdAt)) {
        await markActionFailedInTx(
          tx,
          action.id,
          options?.fallbackErrorCode ?? "trade_action_orphaned",
          options?.fallbackErrorMessage ?? options?.fallbackErrorCode ?? "trade_action_orphaned"
        );
      }
      return;
    }

    await createActionEffect(tx, {
      actionId: action.id,
      effectType: AdminActionEffectType.TREASURY_MOVEMENT,
      entityId: clientMovement.id,
      label: "Movimiento cliente trade admin",
      payload: {
        mirrorRole: "client",
      },
    });

    if (clientMovement.status === TreasuryMovementStatus.APPROVED) {
      const systemMovementId = await ensureAdminTradeSystemMirror({
        tx,
        actionId: action.id,
        targetCompanyName: action.targetCompany.name,
        clientMovement,
      });

      await markActionSucceededInTx(
        tx,
        action.id,
        buildTradeResultPayload({
          actionId: action.id,
          side:
            action.type === AdminActionType.CLIENT_BUY_BTC
              ? "buy"
              : "sell",
          feePct,
          priceSnapshot: priceSnapshotRecord,
          clientMovement,
          systemMovementId,
        })
      );
      return;
    }

    const errorCode =
      clientMovement.lastError ??
      (clientMovement.internalState === InternalMovementState.MANUAL_REVIEW
        ? "trade_manual_review_required"
        : null) ??
      options?.fallbackErrorCode ??
      (clientMovement.status === TreasuryMovementStatus.REJECTED
        ? "trade_rejected"
        : null) ??
      (isActionStale(action.startedAt, action.createdAt)
        ? "admin_action_processing_timeout"
        : null);

    if (!errorCode) return;

    await markActionFailedInTx(
      tx,
      action.id,
      errorCode,
      options?.fallbackErrorMessage ?? clientMovement.lastError ?? errorCode
    );
  });
}

export async function reconcileAdminActionById(
  actionId: string,
  options?: ReconcileAdminActionOptions
): Promise<AdminActionDetail | null> {
  const normalized = normalizeText(actionId);
  if (!normalized) return null;

  const action = await prisma.adminAction.findUnique({
    where: { id: normalized },
    select: {
      id: true,
      type: true,
      status: true,
      targetCompanyId: true,
      createdAt: true,
      startedAt: true,
      validatedContext: true,
      targetCompany: { select: { name: true } },
    },
  });

  if (!action) return null;

  if (action.type === AdminActionType.SUBSCRIPTION_CHARGE_MANUAL) {
    await reconcileSubscriptionChargeAction(action, options);
  } else if (action.type === AdminActionType.CLIENT_ASSIGN_BTC_EXTERNAL) {
    await reconcileExternalAssignmentAction(action, options);
  } else if (
    action.type === AdminActionType.CLIENT_BUY_BTC ||
    action.type === AdminActionType.CLIENT_SELL_BTC
  ) {
    await reconcileTradeAction(action, options);
  }

  return getAdminActionDetail(action.id);
}

export async function listAdminActions(input?: AdminActionListFilter) {
  const type = filterActionType(input?.type);
  const status = filterActionStatus(input?.status);
  const q = String(input?.q ?? "").trim().toLowerCase();
  const take = Math.min(Math.max(Number(input?.take ?? 50), 1), 200);

  const rows = await prisma.adminAction.findMany({
    where: {
      ...(normalizeText(input?.companyId) ? { targetCompanyId: normalizeText(input?.companyId)! } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      status: true,
      createdAt: true,
      completedAt: true,
      reason: true,
      errorCode: true,
      errorMessage: true,
      resultPayload: true,
      actorAdmin: { select: { email: true } },
      targetCompany: { select: { id: true, name: true } },
    },
  });

  return rows
    .map<AdminActionListItem>((row) => ({
      id: row.id,
      type: row.type,
      typeLabel: adminActionTypeLabel(row.type),
      status: row.status,
      statusLabel: adminActionStatusLabel(row.status),
      actorAdminEmail: row.actorAdmin.email,
      targetCompanyId: row.targetCompany.id,
      targetCompanyName: row.targetCompany.name,
      createdAt: row.createdAt.toISOString(),
      completedAt: toIso(row.completedAt),
      reason: row.reason ?? null,
      errorCode: row.errorCode ?? null,
      errorMessage: row.errorMessage ?? null,
      resultSummary: summarizeResult(row.type, row.resultPayload),
    }))
    .filter((row) => {
      if (!q) return true;
      const haystack = [
        row.typeLabel,
        row.statusLabel,
        row.actorAdminEmail,
        row.targetCompanyName,
        row.reason ?? "",
        row.errorCode ?? "",
        row.errorMessage ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
}

export async function getAdminActionDetail(actionId: string): Promise<AdminActionDetail | null> {
  const normalized = normalizeText(actionId);
  if (!normalized) return null;

  const action = await prisma.adminAction.findUnique({
    where: { id: normalized },
    select: {
      id: true,
      type: true,
      status: true,
      idempotencyKey: true,
      reason: true,
      requestPayload: true,
      validatedContext: true,
      resultPayload: true,
      errorCode: true,
      errorMessage: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      targetCompanyId: true,
      targetUserId: true,
      actorAdmin: { select: { email: true } },
      targetCompany: { select: { name: true } },
      effects: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          effectType: true,
          entityId: true,
          label: true,
          payload: true,
          createdAt: true,
        },
      },
      subscriptionCharge: {
        select: {
          id: true,
          status: true,
          referenceAmountUsd: true,
          debitAssetCode: true,
          debitAmount: true,
          createdAt: true,
          chargedAt: true,
          errorCode: true,
          errorMessage: true,
          clientMovementId: true,
          systemMovementId: true,
        },
      },
      externalBtcAssignment: {
        select: {
          id: true,
          status: true,
          amountBtc: true,
          provider: true,
          externalReference: true,
          referencePriceClp: true,
          referenceFeeClp: true,
          createdAt: true,
          assignedAt: true,
          errorCode: true,
          errorMessage: true,
          clientMovementId: true,
          systemMovementId: true,
        },
      },
    },
  });

  if (!action) return null;

  return {
    id: action.id,
    type: action.type,
    typeLabel: adminActionTypeLabel(action.type),
    status: action.status,
    statusLabel: adminActionStatusLabel(action.status),
    actorAdminEmail: action.actorAdmin.email,
    targetCompanyId: action.targetCompanyId,
    targetCompanyName: action.targetCompany.name,
    targetUserId: action.targetUserId ?? null,
    createdAt: action.createdAt.toISOString(),
    startedAt: toIso(action.startedAt),
    completedAt: toIso(action.completedAt),
    idempotencyKey: action.idempotencyKey,
    reason: action.reason ?? null,
    requestPayload: action.requestPayload,
    validatedContext: action.validatedContext,
    resultPayload: action.resultPayload,
    errorCode: action.errorCode ?? null,
    errorMessage: action.errorMessage ?? null,
    effects: action.effects.map((effect) => ({
      id: effect.id,
      effectType: effect.effectType,
      entityId: effect.entityId,
      label: effect.label ?? null,
      payload: effect.payload,
      createdAt: effect.createdAt.toISOString(),
    })),
    subscriptionCharge: action.subscriptionCharge
      ? {
          id: action.subscriptionCharge.id,
          status: action.subscriptionCharge.status,
          referenceAmountUsd: action.subscriptionCharge.referenceAmountUsd.toString(),
          debitAssetCode: action.subscriptionCharge.debitAssetCode,
          debitAmount: action.subscriptionCharge.debitAmount?.toString() ?? null,
          createdAt: action.subscriptionCharge.createdAt.toISOString(),
          chargedAt: toIso(action.subscriptionCharge.chargedAt),
          errorCode: action.subscriptionCharge.errorCode ?? null,
          errorMessage: action.subscriptionCharge.errorMessage ?? null,
          clientMovementId: action.subscriptionCharge.clientMovementId ?? null,
          systemMovementId: action.subscriptionCharge.systemMovementId ?? null,
        }
      : null,
    externalBtcAssignment: action.externalBtcAssignment
      ? {
          id: action.externalBtcAssignment.id,
          status: action.externalBtcAssignment.status,
          amountBtc: action.externalBtcAssignment.amountBtc.toString(),
          provider: action.externalBtcAssignment.provider ?? null,
          externalReference: action.externalBtcAssignment.externalReference ?? null,
          referencePriceClp: action.externalBtcAssignment.referencePriceClp?.toString() ?? null,
          referenceFeeClp: action.externalBtcAssignment.referenceFeeClp?.toString() ?? null,
          createdAt: action.externalBtcAssignment.createdAt.toISOString(),
          assignedAt: toIso(action.externalBtcAssignment.assignedAt),
          errorCode: action.externalBtcAssignment.errorCode ?? null,
          errorMessage: action.externalBtcAssignment.errorMessage ?? null,
          clientMovementId: action.externalBtcAssignment.clientMovementId ?? null,
          systemMovementId: action.externalBtcAssignment.systemMovementId ?? null,
        }
      : null,
  };
}
