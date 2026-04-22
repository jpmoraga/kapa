import "server-only";

import {
  CommercialAuditType,
  CommercialStatus,
  CompanySubscriptionPlan,
  CompanySubscriptionStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  COMMERCIAL_PRICING_FIELD_DEFINITIONS,
  PRICING_KEYS,
  getCommercialPricingFallbacks,
} from "@/lib/pricing";

export const commercialStatusOptions: ReadonlyArray<{
  value: CommercialStatus;
  label: string;
}> = [
  { value: CommercialStatus.DRAFT, label: "Draft" },
  { value: CommercialStatus.ACTIVE, label: "Activo" },
  { value: CommercialStatus.PAUSED, label: "Pausado" },
  { value: CommercialStatus.RESTRICTED, label: "Restringido" },
  { value: CommercialStatus.INACTIVE, label: "Inactivo" },
];

export const subscriptionStatusOptions: ReadonlyArray<{
  value: CompanySubscriptionStatus;
  label: string;
}> = [
  { value: CompanySubscriptionStatus.ACTIVE, label: "Activa" },
  { value: CompanySubscriptionStatus.INACTIVE, label: "Inactiva" },
];

export const subscriptionPlanOptions: ReadonlyArray<{
  value: CompanySubscriptionPlan;
  label: string;
}> = [
  { value: CompanySubscriptionPlan.BASE, label: "Plan base" },
  { value: CompanySubscriptionPlan.FREE_TEMP, label: "Free temporal" },
  { value: CompanySubscriptionPlan.CUSTOM_FIXED_USD, label: "Custom fixed USD" },
];

export type AdminSubscriptionFilter =
  | "all"
  | "active"
  | "inactive"
  | "legacy-signal"
  | "commercial-active"
  | "custom-plan";

export const adminSubscriptionFilters: ReadonlyArray<{
  value: AdminSubscriptionFilter;
  label: string;
}> = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Suscripción activa" },
  { value: "inactive", label: "Suscripción inactiva" },
  { value: "legacy-signal", label: "Legacy signal" },
  { value: "commercial-active", label: "Comercial active" },
  { value: "custom-plan", label: "Custom / especial" },
];

type PricingFieldDefinition = (typeof COMMERCIAL_PRICING_FIELD_DEFINITIONS)[number];
type PricingFieldKind = PricingFieldDefinition["kind"];

type PricingRuleSelect = {
  key: string;
  valueDecimal: Prisma.Decimal | null;
  valueInt: number | null;
  valueJson: Prisma.JsonValue | null;
  currency: string | null;
  assetCode: string | null;
};

type CommercialMemberBase = {
  role: string;
  user: {
    id: string;
    email: string;
    isSubscriber: boolean;
    subscriberSince: Date | null;
    personProfile: {
      fullName: string | null;
    } | null;
    pricingPlan: {
      plan: {
        id: string;
        name: string;
        isDefault: boolean;
      };
    } | null;
  };
};

const pricingRuleSelect = {
  key: true,
  valueDecimal: true,
  valueInt: true,
  valueJson: true,
  currency: true,
  assetCode: true,
} satisfies Prisma.PricingPlanRuleSelect;

const commercialMemberUserSelect = {
  id: true,
  email: true,
  isSubscriber: true,
  subscriberSince: true,
  personProfile: {
    select: {
      fullName: true,
    },
  },
  pricingPlan: {
    select: {
      plan: {
        select: {
          id: true,
          name: true,
          isDefault: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

const commercialListCompanySelect = {
  id: true,
  name: true,
  kind: true,
  companyRut: true,
  review: {
    select: {
      status: true,
    },
  },
  commercialProfile: {
    select: {
      status: true,
      notes: true,
      specialTermsNote: true,
      updatedAt: true,
      updatedByAdmin: {
        select: {
          email: true,
        },
      },
    },
  },
  subscription: {
    select: {
      status: true,
      plan: true,
      baseAmountUsd: true,
      customAmountUsd: true,
      startedAt: true,
      endsAt: true,
      note: true,
      updatedAt: true,
      updatedByAdmin: {
        select: {
          email: true,
        },
      },
    },
  },
  pricingPlan: {
    select: {
      plan: {
        select: {
          id: true,
          name: true,
          isDefault: true,
        },
      },
    },
  },
  pricingOverride: {
    select: {
      buyBtcFeePct: true,
      sellBtcFeePct: true,
      loanAprStandard: true,
      loanAprSubscriber: true,
      note: true,
      updatedAt: true,
    },
  },
  members: {
    select: {
      role: true,
      user: {
        select: commercialMemberUserSelect,
      },
    },
  },
} satisfies Prisma.CompanySelect;

const commercialDetailCompanySelect = {
  id: true,
  name: true,
  kind: true,
  companyRut: true,
  review: {
    select: {
      status: true,
    },
  },
  commercialProfile: {
    select: {
      status: true,
      notes: true,
      specialTermsNote: true,
      createdAt: true,
      updatedAt: true,
      updatedByAdmin: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  },
  subscription: {
    select: {
      status: true,
      plan: true,
      baseAmountUsd: true,
      customAmountUsd: true,
      startedAt: true,
      endsAt: true,
      note: true,
      createdAt: true,
      updatedAt: true,
      updatedByAdmin: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  },
  pricingPlan: {
    select: {
      plan: {
        select: {
          id: true,
          name: true,
          isDefault: true,
          rules: {
            select: pricingRuleSelect,
          },
        },
      },
    },
  },
  pricingOverride: {
    select: {
      buyBtcFeePct: true,
      sellBtcFeePct: true,
      loanAprStandard: true,
      loanAprSubscriber: true,
      note: true,
      createdAt: true,
      updatedAt: true,
      updatedByAdmin: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  },
  members: {
    select: {
      role: true,
      user: {
        select: commercialMemberUserSelect,
      },
    },
  },
  commercialAuditLogs: {
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      type: true,
      note: true,
      payload: true,
      createdAt: true,
      actorAdmin: {
        select: {
          email: true,
        },
      },
    },
  },
} satisfies Prisma.CompanySelect;

type CommercialListCompany = Prisma.CompanyGetPayload<{
  select: typeof commercialListCompanySelect;
}>;

type PricingPlanWithRules = Prisma.PricingPlanGetPayload<{
  select: {
    id: true;
    name: true;
    isDefault: true;
    createdAt: true;
    rules: {
      select: typeof pricingRuleSelect;
    };
    _count: {
      select: {
        companies: true;
        users: true;
      };
    };
  };
}>;

type RuleMap = Record<string, PricingRuleSelect>;

export type EffectivePricingField = {
  key: string;
  label: string;
  description: string;
  kind: PricingFieldKind;
  value: string;
  source: "company_override" | "company_plan" | "default_plan" | "legacy_default";
  sourceLabel: string;
};

export type CompanyCommercialSnapshot = {
  companyId: string;
  companyName: string;
  kind: "PERSONAL" | "BUSINESS";
  companyRut: string | null;
  reviewStatus: string | null;
  commercial: {
    status: CommercialStatus;
    statusLabel: string;
    notes: string | null;
    specialTermsNote: string | null;
    updatedAt: string | null;
    updatedByAdminEmail: string | null;
    isConfigured: boolean;
  };
  subscription: {
    isConfigured: boolean;
    status: CompanySubscriptionStatus | null;
    statusLabel: string;
    plan: CompanySubscriptionPlan | null;
    planLabel: string;
    baseAmountUsd: string | null;
    customAmountUsd: string | null;
    startedAt: string | null;
    endsAt: string | null;
    note: string | null;
    updatedAt: string | null;
    updatedByAdminEmail: string | null;
    isSubscribedEffective: boolean;
    legacySignalActive: boolean;
    legacySubscriberCount: number;
    legacySubscribers: Array<{
      userId: string;
      name: string | null;
      email: string;
      subscriberSince: string | null;
    }>;
  };
  pricing: {
    defaultPlan: {
      id: string;
      name: string;
    } | null;
    assignedPlan: {
      id: string;
      name: string;
      isDefault: boolean;
    } | null;
    companyOverrideConfigured: boolean;
    overrideNote: string | null;
    overrideUpdatedAt: string | null;
    overrideUpdatedByAdminEmail: string | null;
    effectiveFields: EffectivePricingField[];
    precedence: string[];
    legacyUserPricingCount: number;
    legacyUserPricings: Array<{
      userId: string;
      name: string | null;
      email: string;
      planName: string;
    }>;
  };
  auditLog: Array<{
    id: string;
    type: CommercialAuditType;
    typeLabel: string;
    note: string | null;
    createdAt: string;
    actorAdminEmail: string | null;
  }>;
};

export type AdminSubscriptionListItem = {
  companyId: string;
  companyName: string;
  kind: "PERSONAL" | "BUSINESS";
  companyRut: string | null;
  contactName: string | null;
  contactEmail: string | null;
  reviewStatus: string | null;
  commercialStatus: CommercialStatus;
  commercialStatusLabel: string;
  subscriptionStatusLabel: string;
  subscriptionPlanLabel: string;
  isSubscribedEffective: boolean;
  legacySignalActive: boolean;
  customAmountUsd: string | null;
  baseAmountUsd: string | null;
  pricingPlanName: string | null;
  hasCompanyPricingOverride: boolean;
  updatedAt: string | null;
};

export type AdminSubscriptionListResponse = {
  rows: AdminSubscriptionListItem[];
  filter: AdminSubscriptionFilter;
  q: string;
  total: number;
  counts: {
    active: number;
    inactive: number;
    legacySignal: number;
    commercialActive: number;
    customPlan: number;
  };
};

export type AdminPricingPageData = {
  defaultPlan: PricingPlanWithRules | null;
  plans: PricingPlanWithRules[];
  companies: Array<{
    companyId: string;
    companyName: string;
    companyRut: string | null;
    kind: "PERSONAL" | "BUSINESS";
    assignedPlanName: string | null;
    commercialStatusLabel: string;
    subscriptionPlanLabel: string;
    hasOverride: boolean;
  }>;
  selectedCompany: CompanyCommercialSnapshot | null;
  fallbackRules: Record<string, string>;
};

function normalizeText(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function commercialStatusLabel(status: CommercialStatus) {
  return commercialStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function subscriptionStatusLabel(status: CompanySubscriptionStatus | null | undefined) {
  if (!status) return "Sin definir";
  return subscriptionStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function subscriptionPlanLabel(plan: CompanySubscriptionPlan | null | undefined) {
  if (!plan) return "Sin plan";
  return subscriptionPlanOptions.find((option) => option.value === plan)?.label ?? plan;
}

function auditTypeLabel(type: CommercialAuditType) {
  switch (type) {
    case CommercialAuditType.COMMERCIAL_STATUS_UPDATED:
      return "Estado comercial";
    case CommercialAuditType.SUBSCRIPTION_UPDATED:
      return "Suscripción";
    case CommercialAuditType.COMPANY_PRICING_UPDATED:
      return "Pricing empresa";
    case CommercialAuditType.PRICING_PLAN_UPDATED:
      return "Pricing plan base";
    default:
      return String(type);
  }
}

function sourceLabel(source: EffectivePricingField["source"], planName?: string | null) {
  if (source === "company_override") return "Override empresa";
  if (source === "company_plan") return planName ? `Plan empresa: ${planName}` : "Plan empresa";
  if (source === "default_plan") return "Plan base";
  return "Fallback legacy";
}

function buildRuleMap(rules: PricingRuleSelect[]) {
  return rules.reduce<RuleMap>((acc, rule) => {
    acc[rule.key] = rule;
    return acc;
  }, {});
}

function stringifyRuleValue(rule: PricingRuleSelect | null | undefined) {
  if (!rule) return null;
  if (rule.valueDecimal) return rule.valueDecimal.toString();
  if (typeof rule.valueInt === "number") return String(rule.valueInt);
  return null;
}

function pickPrimaryMember(members: CommercialMemberBase[]) {
  const priority = ["owner", "admin"];
  return [...members].sort((a, b) => {
    const aIdx = priority.indexOf(String(a.role).toLowerCase());
    const bIdx = priority.indexOf(String(b.role).toLowerCase());
    const aScore = aIdx === -1 ? priority.length : aIdx;
    const bScore = bIdx === -1 ? priority.length : bIdx;
    return aScore - bScore;
  })[0] ?? null;
}

function getDisplayName(member: CommercialMemberBase["user"]) {
  return member.personProfile?.fullName?.trim() || null;
}

function deriveLegacySubscriberInfo(members: CommercialMemberBase[]) {
  const subscribers = members
    .filter((member) => member.user.isSubscriber)
    .map((member) => ({
      userId: member.user.id,
      name: getDisplayName(member.user),
      email: member.user.email,
      subscriberSince: toIso(member.user.subscriberSince),
    }));

  return {
    active: subscribers.length > 0,
    count: subscribers.length,
    subscribers,
  };
}

function deriveLegacyUserPricing(members: CommercialMemberBase[]) {
  const rows = members
    .filter((member) => member.user.pricingPlan?.plan)
    .map((member) => ({
      userId: member.user.id,
      name: getDisplayName(member.user),
      email: member.user.email,
      planName: member.user.pricingPlan!.plan.name,
    }));

  return {
    count: rows.length,
    rows,
  };
}

function getOverrideValue(
  override:
    | {
        buyBtcFeePct: Prisma.Decimal | null;
        sellBtcFeePct: Prisma.Decimal | null;
        loanAprStandard: Prisma.Decimal | null;
        loanAprSubscriber: Prisma.Decimal | null;
      }
    | null
    | undefined,
  key: string
) {
  if (!override) return null;
  if (key === PRICING_KEYS.TRADE_BUY_BTC_FEE_PCT) return override.buyBtcFeePct?.toString() ?? null;
  if (key === PRICING_KEYS.TRADE_SELL_BTC_FEE_PCT) return override.sellBtcFeePct?.toString() ?? null;
  if (key === PRICING_KEYS.LOAN_APR_STANDARD) return override.loanAprStandard?.toString() ?? null;
  if (key === PRICING_KEYS.LOAN_APR_SUBSCRIBER) return override.loanAprSubscriber?.toString() ?? null;
  return null;
}

function buildEffectiveFields(params: {
  companyPlan:
    | {
        id: string;
        name: string;
        isDefault: boolean;
        rules: PricingRuleSelect[];
      }
    | null
    | undefined;
  defaultPlan:
    | {
        id: string;
        name: string;
        isDefault: boolean;
        rules: PricingRuleSelect[];
      }
    | null
    | undefined;
  override:
    | {
        buyBtcFeePct: Prisma.Decimal | null;
        sellBtcFeePct: Prisma.Decimal | null;
        loanAprStandard: Prisma.Decimal | null;
        loanAprSubscriber: Prisma.Decimal | null;
      }
    | null
    | undefined;
}) {
  const fallback = getCommercialPricingFallbacks();
  const companyRules = buildRuleMap(params.companyPlan?.rules ?? []);
  const defaultRules = buildRuleMap(params.defaultPlan?.rules ?? []);

  return COMMERCIAL_PRICING_FIELD_DEFINITIONS.map<EffectivePricingField>((definition) => {
    const overrideValue = getOverrideValue(params.override, definition.key);
    if (overrideValue !== null) {
      return {
        key: definition.key,
        label: definition.label,
        description: definition.description,
        kind: definition.kind,
        value: overrideValue,
        source: "company_override",
        sourceLabel: sourceLabel("company_override"),
      };
    }

    const companyRuleValue = stringifyRuleValue(companyRules[definition.key]);
    if (companyRuleValue !== null) {
      return {
        key: definition.key,
        label: definition.label,
        description: definition.description,
        kind: definition.kind,
        value: companyRuleValue,
        source: "company_plan",
        sourceLabel: sourceLabel("company_plan", params.companyPlan?.name ?? null),
      };
    }

    const defaultRuleValue = stringifyRuleValue(defaultRules[definition.key]);
    if (defaultRuleValue !== null) {
      return {
        key: definition.key,
        label: definition.label,
        description: definition.description,
        kind: definition.kind,
        value: defaultRuleValue,
        source: "default_plan",
        sourceLabel: sourceLabel("default_plan"),
      };
    }

    return {
      key: definition.key,
      label: definition.label,
      description: definition.description,
      kind: definition.kind,
      value: fallback[definition.key] ?? "—",
      source: "legacy_default",
      sourceLabel: sourceLabel("legacy_default"),
    };
  });
}

function normalizeSubscriptionFilter(value: string | null | undefined): AdminSubscriptionFilter {
  const normalized = String(value ?? "all").trim().toLowerCase();
  return adminSubscriptionFilters.some((item) => item.value === normalized)
    ? (normalized as AdminSubscriptionFilter)
    : "all";
}

function matchesSubscriptionFilter(row: AdminSubscriptionListItem, filter: AdminSubscriptionFilter) {
  if (filter === "all") return true;
  if (filter === "active") return row.isSubscribedEffective;
  if (filter === "inactive") return !row.isSubscribedEffective;
  if (filter === "legacy-signal") return row.legacySignalActive;
  if (filter === "commercial-active") return row.commercialStatus === CommercialStatus.ACTIVE;
  if (filter === "custom-plan") {
    return row.subscriptionPlanLabel === "Custom fixed USD" || row.hasCompanyPricingOverride;
  }
  return true;
}

function matchesCommercialSearch(row: AdminSubscriptionListItem, query: string) {
  if (!query) return true;
  const haystack = [
    row.companyName,
    row.companyRut ?? "",
    row.contactName ?? "",
    row.contactEmail ?? "",
    row.pricingPlanName ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function mapListItem(company: CommercialListCompany): AdminSubscriptionListItem {
  const primaryMember = pickPrimaryMember(company.members);
  const contactName = primaryMember ? getDisplayName(primaryMember.user) : null;
  const contactEmail = primaryMember?.user.email ?? null;
  const legacy = deriveLegacySubscriberInfo(company.members);
  const subscription = company.subscription;
  const commercialStatus = company.commercialProfile?.status ?? CommercialStatus.DRAFT;
  const updatedAt =
    subscription?.updatedAt ?? company.commercialProfile?.updatedAt ?? company.pricingOverride?.updatedAt ?? null;

  return {
    companyId: company.id,
    companyName: company.name,
    kind: company.kind,
    companyRut: company.companyRut ?? null,
    contactName,
    contactEmail,
    reviewStatus: company.review?.status ? String(company.review.status) : null,
    commercialStatus,
    commercialStatusLabel: commercialStatusLabel(commercialStatus),
    subscriptionStatusLabel: subscription?.status
      ? subscriptionStatusLabel(subscription.status)
      : legacy.active
      ? "Legacy user signal"
      : "Sin definir",
    subscriptionPlanLabel: subscription
      ? subscriptionPlanLabel(subscription.plan)
      : legacy.active
      ? "Legacy user signal"
      : "Sin plan",
    baseAmountUsd: subscription?.baseAmountUsd?.toString() ?? null,
    isSubscribedEffective:
      subscription?.status === CompanySubscriptionStatus.ACTIVE || (!subscription && legacy.active),
    legacySignalActive: !subscription && legacy.active,
    customAmountUsd: subscription?.customAmountUsd?.toString() ?? null,
    pricingPlanName: company.pricingPlan?.plan.name ?? null,
    hasCompanyPricingOverride: Boolean(
      company.pricingOverride?.buyBtcFeePct ||
        company.pricingOverride?.sellBtcFeePct ||
        company.pricingOverride?.loanAprStandard ||
        company.pricingOverride?.loanAprSubscriber
    ),
    updatedAt: toIso(updatedAt),
  };
}

function parseNullableDecimal(value: string | null | undefined, options?: {
  min?: number;
  maxExclusive?: number;
  allowZero?: boolean;
}) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  let decimal: Prisma.Decimal;
  try {
    decimal = new Prisma.Decimal(raw);
  } catch {
    throw new Error("invalid_decimal");
  }

  const min = options?.min ?? 0;
  const maxExclusive = options?.maxExclusive;
  const allowZero = options?.allowZero ?? true;
  const numberValue = Number(decimal.toString());
  if (!Number.isFinite(numberValue)) throw new Error("invalid_decimal");
  if (!allowZero && numberValue <= min) throw new Error("invalid_decimal");
  if (allowZero && numberValue < min) throw new Error("invalid_decimal");
  if (typeof maxExclusive === "number" && numberValue >= maxExclusive) {
    throw new Error("invalid_decimal");
  }

  return decimal;
}

function parseNullableInteger(value: string | null | undefined, options?: {
  min?: number;
  max?: number;
}) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error("invalid_integer");
  }
  const min = options?.min;
  const max = options?.max;
  if (typeof min === "number" && parsed < min) throw new Error("invalid_integer");
  if (typeof max === "number" && parsed > max) throw new Error("invalid_integer");
  return parsed;
}

function parseNullableDate(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error("invalid_date");
  return date;
}

function statusFromInput(value: string) {
  const normalized = String(value).trim().toUpperCase();
  const allowed = new Set(Object.values(CommercialStatus));
  if (!allowed.has(normalized as CommercialStatus)) {
    throw new Error("invalid_commercial_status");
  }
  return normalized as CommercialStatus;
}

function subscriptionStatusFromInput(value: string) {
  const normalized = String(value).trim().toUpperCase();
  const allowed = new Set(Object.values(CompanySubscriptionStatus));
  if (!allowed.has(normalized as CompanySubscriptionStatus)) {
    throw new Error("invalid_subscription_status");
  }
  return normalized as CompanySubscriptionStatus;
}

function subscriptionPlanFromInput(value: string) {
  const normalized = String(value).trim().toUpperCase();
  const allowed = new Set(Object.values(CompanySubscriptionPlan));
  if (!allowed.has(normalized as CompanySubscriptionPlan)) {
    throw new Error("invalid_subscription_plan");
  }
  return normalized as CompanySubscriptionPlan;
}

async function ensureCompanyExists(companyId: string) {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      name: { not: "__SYSTEM_WALLET__" },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!company) throw new Error("company_not_found");
  return company;
}

async function writeCommercialAuditLog(input: {
  type: CommercialAuditType;
  actorAdminUserId: string;
  companyId?: string | null;
  pricingPlanId?: string | null;
  note?: string | null;
  payload?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
}) {
  const client = input.tx ?? prisma;
  await client.commercialAuditLog.create({
    data: {
      type: input.type,
      actorAdminUserId: input.actorAdminUserId,
      companyId: input.companyId ?? null,
      pricingPlanId: input.pricingPlanId ?? null,
      note: normalizeText(input.note),
      payload: input.payload,
    },
  });
}

export async function getDefaultPricingPlan(tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  return client.pricingPlan.findFirst({
    where: { isDefault: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isDefault: true,
      createdAt: true,
      rules: {
        select: pricingRuleSelect,
      },
      _count: {
        select: {
          companies: true,
          users: true,
        },
      },
    },
  });
}

async function ensureDefaultPricingPlanForAdmin(actorAdminUserId: string, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  const existing = await getDefaultPricingPlan(client);
  if (existing) return existing;

  const fallbackRules = getCommercialPricingFallbacks();

  const created = await client.pricingPlan.create({
    data: {
      name: "Plan base comercial",
      isDefault: true,
      rules: {
        create: COMMERCIAL_PRICING_FIELD_DEFINITIONS.map((definition) => {
          const fallbackValue = fallbackRules[definition.key] ?? "";
          return definition.kind === "int"
            ? {
                key: definition.key,
                valueInt: Number(fallbackValue),
              }
            : {
                key: definition.key,
                valueDecimal: new Prisma.Decimal(fallbackValue),
              };
        }),
      },
    },
    select: {
      id: true,
      name: true,
      isDefault: true,
      createdAt: true,
      rules: {
        select: pricingRuleSelect,
      },
      _count: {
        select: {
          companies: true,
          users: true,
        },
      },
    },
  });

  await writeCommercialAuditLog({
    type: CommercialAuditType.PRICING_PLAN_UPDATED,
    actorAdminUserId,
    pricingPlanId: created.id,
    note: "Se creó el plan base comercial con los defaults legacy.",
    payload: {
      createdPlanId: created.id,
      createdPlanName: created.name,
    },
    tx: client,
  });

  return created;
}

export async function listAdminSubscriptions(input?: {
  filter?: string | null;
  q?: string | null;
}): Promise<AdminSubscriptionListResponse> {
  const filter = normalizeSubscriptionFilter(input?.filter);
  const q = String(input?.q ?? "").trim();

  const companies = await prisma.company.findMany({
    where: {
      name: { not: "__SYSTEM_WALLET__" },
    },
    select: commercialListCompanySelect,
  });

  const rows = companies
    .map(mapListItem)
    .filter((row) => matchesSubscriptionFilter(row, filter) && matchesCommercialSearch(row, q))
    .sort((a, b) => {
      const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if (updatedA !== updatedB) return updatedB - updatedA;
      return a.companyName.localeCompare(b.companyName, "es");
    });

  return {
    rows,
    filter,
    q,
    total: rows.length,
    counts: {
      active: rows.filter((row) => row.isSubscribedEffective).length,
      inactive: rows.filter((row) => !row.isSubscribedEffective).length,
      legacySignal: rows.filter((row) => row.legacySignalActive).length,
      commercialActive: rows.filter((row) => row.commercialStatus === CommercialStatus.ACTIVE).length,
      customPlan: rows.filter((row) => row.subscriptionPlanLabel === "Custom fixed USD").length,
    },
  };
}

export async function getCompanyCommercialSnapshot(companyId: string): Promise<CompanyCommercialSnapshot | null> {
  const [company, defaultPlan] = await Promise.all([
    prisma.company.findFirst({
      where: {
        id: companyId,
        name: { not: "__SYSTEM_WALLET__" },
      },
      select: commercialDetailCompanySelect,
    }),
    getDefaultPricingPlan(),
  ]);

  if (!company) return null;

  const legacySubscribers = deriveLegacySubscriberInfo(company.members);
  const legacyUserPricing = deriveLegacyUserPricing(company.members);
  const effectiveFields = buildEffectiveFields({
    companyPlan: company.pricingPlan?.plan ?? null,
    defaultPlan,
    override: company.pricingOverride ?? null,
  });

  return {
    companyId: company.id,
    companyName: company.name,
    kind: company.kind,
    companyRut: company.companyRut ?? null,
    reviewStatus: company.review?.status ? String(company.review.status) : null,
    commercial: {
      status: company.commercialProfile?.status ?? CommercialStatus.DRAFT,
      statusLabel: commercialStatusLabel(company.commercialProfile?.status ?? CommercialStatus.DRAFT),
      notes: company.commercialProfile?.notes ?? null,
      specialTermsNote: company.commercialProfile?.specialTermsNote ?? null,
      updatedAt: toIso(company.commercialProfile?.updatedAt),
      updatedByAdminEmail: company.commercialProfile?.updatedByAdmin?.email ?? null,
      isConfigured: Boolean(company.commercialProfile),
    },
    subscription: {
      isConfigured: Boolean(company.subscription),
      status: company.subscription?.status ?? null,
      statusLabel: company.subscription
        ? subscriptionStatusLabel(company.subscription.status)
        : legacySubscribers.active
        ? "Legacy user signal"
        : "Sin definir",
      plan: company.subscription?.plan ?? null,
      planLabel: company.subscription
        ? subscriptionPlanLabel(company.subscription.plan)
        : legacySubscribers.active
        ? "Legacy user signal"
        : "Sin plan",
      baseAmountUsd: company.subscription?.baseAmountUsd?.toString() ?? null,
      customAmountUsd: company.subscription?.customAmountUsd?.toString() ?? null,
      startedAt: toIso(company.subscription?.startedAt),
      endsAt: toIso(company.subscription?.endsAt),
      note: company.subscription?.note ?? null,
      updatedAt: toIso(company.subscription?.updatedAt),
      updatedByAdminEmail: company.subscription?.updatedByAdmin?.email ?? null,
      isSubscribedEffective:
        company.subscription?.status === CompanySubscriptionStatus.ACTIVE ||
        (!company.subscription && legacySubscribers.active),
      legacySignalActive: !company.subscription && legacySubscribers.active,
      legacySubscriberCount: legacySubscribers.count,
      legacySubscribers: legacySubscribers.subscribers,
    },
    pricing: {
      defaultPlan: defaultPlan
        ? {
            id: defaultPlan.id,
            name: defaultPlan.name,
          }
        : null,
      assignedPlan: company.pricingPlan?.plan
        ? {
            id: company.pricingPlan.plan.id,
            name: company.pricingPlan.plan.name,
            isDefault: company.pricingPlan.plan.isDefault,
          }
        : null,
      companyOverrideConfigured: Boolean(
        company.pricingOverride?.buyBtcFeePct ||
          company.pricingOverride?.sellBtcFeePct ||
          company.pricingOverride?.loanAprStandard ||
          company.pricingOverride?.loanAprSubscriber ||
          normalizeText(company.pricingOverride?.note)
      ),
      overrideNote: company.pricingOverride?.note ?? null,
      overrideUpdatedAt: toIso(company.pricingOverride?.updatedAt),
      overrideUpdatedByAdminEmail: company.pricingOverride?.updatedByAdmin?.email ?? null,
      effectiveFields,
      precedence: [
        "1. Override directo de empresa",
        "2. Plan asignado a la empresa",
        "3. Plan base del sistema",
        "4. Fallback legacy del código",
      ],
      legacyUserPricingCount: legacyUserPricing.count,
      legacyUserPricings: legacyUserPricing.rows,
    },
    auditLog: company.commercialAuditLogs.map((entry) => ({
      id: entry.id,
      type: entry.type,
      typeLabel: auditTypeLabel(entry.type),
      note: entry.note ?? null,
      createdAt: entry.createdAt.toISOString(),
      actorAdminEmail: entry.actorAdmin?.email ?? null,
    })),
  };
}

export async function getAdminPricingPageData(input?: {
  companyId?: string | null;
  q?: string | null;
}) {
  const [defaultPlan, plans, companies] = await Promise.all([
    getDefaultPricingPlan(),
    prisma.pricingPlan.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        isDefault: true,
        createdAt: true,
        rules: {
          select: pricingRuleSelect,
        },
        _count: {
          select: {
            companies: true,
            users: true,
          },
        },
      },
    }),
    prisma.company.findMany({
      where: {
        name: { not: "__SYSTEM_WALLET__" },
      },
      select: commercialListCompanySelect,
    }),
  ]);

  const query = String(input?.q ?? "").trim().toLowerCase();
  const companyRows = companies
    .map((company) => {
      const mapped = mapListItem(company);
      return {
        companyId: company.id,
        companyName: company.name,
        companyRut: company.companyRut ?? null,
        kind: company.kind,
        assignedPlanName: company.pricingPlan?.plan.name ?? null,
        commercialStatusLabel: mapped.commercialStatusLabel,
        subscriptionPlanLabel: mapped.subscriptionPlanLabel,
        hasOverride: mapped.hasCompanyPricingOverride,
      };
    })
    .filter((row) => {
      if (!query) return true;
      const haystack = [
        row.companyName,
        row.companyRut ?? "",
        row.assignedPlanName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => a.companyName.localeCompare(b.companyName, "es"));

  const selectedCompanyId =
    normalizeText(input?.companyId) ??
    companyRows[0]?.companyId ??
    null;

  const selectedCompany = selectedCompanyId
    ? await getCompanyCommercialSnapshot(selectedCompanyId)
    : null;

  return {
    defaultPlan,
    plans,
    companies: companyRows,
    selectedCompany,
    fallbackRules: getCommercialPricingFallbacks(),
  } satisfies AdminPricingPageData;
}

export async function updateCompanyCommercialStatusFromAdmin(input: {
  companyId: string;
  actorAdminUserId: string;
  status: string;
  notes?: string | null;
  specialTermsNote?: string | null;
}) {
  await ensureCompanyExists(input.companyId);

  const status = statusFromInput(input.status);
  const notes = normalizeText(input.notes);
  const specialTermsNote = normalizeText(input.specialTermsNote);

  const result = await prisma.companyCommercialProfile.upsert({
    where: { companyId: input.companyId },
    update: {
      status,
      notes,
      specialTermsNote,
      updatedByAdminUserId: input.actorAdminUserId,
    },
    create: {
      companyId: input.companyId,
      status,
      notes,
      specialTermsNote,
      updatedByAdminUserId: input.actorAdminUserId,
    },
    select: {
      status: true,
      notes: true,
      specialTermsNote: true,
    },
  });

  await writeCommercialAuditLog({
    type: CommercialAuditType.COMMERCIAL_STATUS_UPDATED,
    actorAdminUserId: input.actorAdminUserId,
    companyId: input.companyId,
    note: notes,
    payload: {
      status,
      specialTermsNote,
    },
  });

  return result;
}

export async function updateCompanySubscriptionFromAdmin(input: {
  companyId: string;
  actorAdminUserId: string;
  status: string;
  plan: string;
  baseAmountUsd?: string | null;
  customAmountUsd?: string | null;
  startedAt?: string | null;
  endsAt?: string | null;
  note?: string | null;
}) {
  await ensureCompanyExists(input.companyId);

  const status = subscriptionStatusFromInput(input.status);
  const plan = subscriptionPlanFromInput(input.plan);
  const baseAmountUsd = parseNullableDecimal(input.baseAmountUsd, {
    min: 0,
    maxExclusive: 1000000,
    allowZero: false,
  });
  const customAmountUsd = parseNullableDecimal(input.customAmountUsd, {
    min: 0,
    maxExclusive: 1000000,
    allowZero: false,
  });
  const startedAt = parseNullableDate(input.startedAt);
  const endsAt = parseNullableDate(input.endsAt);
  const note = normalizeText(input.note);

  if (plan === CompanySubscriptionPlan.CUSTOM_FIXED_USD && !customAmountUsd) {
    throw new Error("custom_amount_required");
  }
  if (plan !== CompanySubscriptionPlan.CUSTOM_FIXED_USD && customAmountUsd) {
    throw new Error("custom_amount_not_allowed");
  }
  if (plan === CompanySubscriptionPlan.BASE && !baseAmountUsd) {
    throw new Error("base_amount_required");
  }
  if (plan !== CompanySubscriptionPlan.BASE && baseAmountUsd) {
    throw new Error("base_amount_not_allowed");
  }
  if (startedAt && endsAt && endsAt.getTime() < startedAt.getTime()) {
    throw new Error("subscription_dates_invalid");
  }

  const result = await prisma.companySubscription.upsert({
    where: { companyId: input.companyId },
    update: {
      status,
      plan,
      baseAmountUsd,
      customAmountUsd,
      startedAt,
      endsAt,
      note,
      updatedByAdminUserId: input.actorAdminUserId,
    },
    create: {
      companyId: input.companyId,
      status,
      plan,
      baseAmountUsd,
      customAmountUsd,
      startedAt,
      endsAt,
      note,
      updatedByAdminUserId: input.actorAdminUserId,
    },
    select: {
      status: true,
      plan: true,
      baseAmountUsd: true,
      customAmountUsd: true,
      startedAt: true,
      endsAt: true,
      note: true,
    },
  });

  await writeCommercialAuditLog({
    type: CommercialAuditType.SUBSCRIPTION_UPDATED,
    actorAdminUserId: input.actorAdminUserId,
    companyId: input.companyId,
    note,
    payload: {
      status,
      plan,
      baseAmountUsd: baseAmountUsd?.toString() ?? null,
      customAmountUsd: customAmountUsd?.toString() ?? null,
      startedAt: startedAt?.toISOString() ?? null,
      endsAt: endsAt?.toISOString() ?? null,
    },
  });

  return result;
}

function deleteIfAllCompanyPricingOverrideEmpty(data: {
  buyBtcFeePct: Prisma.Decimal | null;
  sellBtcFeePct: Prisma.Decimal | null;
  loanAprStandard: Prisma.Decimal | null;
  loanAprSubscriber: Prisma.Decimal | null;
  note: string | null;
}) {
  return (
    !data.buyBtcFeePct &&
    !data.sellBtcFeePct &&
    !data.loanAprStandard &&
    !data.loanAprSubscriber &&
    !data.note
  );
}

export async function updateCompanyPricingFromAdmin(input: {
  companyId: string;
  actorAdminUserId: string;
  companyPlanId?: string | null;
  buyBtcFeePct?: string | null;
  sellBtcFeePct?: string | null;
  loanAprStandard?: string | null;
  loanAprSubscriber?: string | null;
  note?: string | null;
}) {
  await ensureCompanyExists(input.companyId);

  const companyPlanId = normalizeText(input.companyPlanId);
  const buyBtcFeePct = parseNullableDecimal(input.buyBtcFeePct, {
    min: 0,
    maxExclusive: 1,
  });
  const sellBtcFeePct = parseNullableDecimal(input.sellBtcFeePct, {
    min: 0,
    maxExclusive: 1,
  });
  const loanAprStandard = parseNullableDecimal(input.loanAprStandard, {
    min: 0,
    maxExclusive: 1,
  });
  const loanAprSubscriber = parseNullableDecimal(input.loanAprSubscriber, {
    min: 0,
    maxExclusive: 1,
  });
  const note = normalizeText(input.note);

  if (companyPlanId) {
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: companyPlanId },
      select: { id: true },
    });
    if (!plan) throw new Error("pricing_plan_not_found");
  }

  await prisma.$transaction(async (tx) => {
    if (companyPlanId) {
      await tx.companyPricing.upsert({
        where: { companyId: input.companyId },
        update: { planId: companyPlanId },
        create: {
          companyId: input.companyId,
          planId: companyPlanId,
        },
      });
    } else {
      await tx.companyPricing.deleteMany({
        where: { companyId: input.companyId },
      });
    }

    const overrideData = {
      buyBtcFeePct,
      sellBtcFeePct,
      loanAprStandard,
      loanAprSubscriber,
      note,
    };

    if (deleteIfAllCompanyPricingOverrideEmpty(overrideData)) {
      await tx.companyPricingOverride.deleteMany({
        where: { companyId: input.companyId },
      });
    } else {
      await tx.companyPricingOverride.upsert({
        where: { companyId: input.companyId },
        update: {
          ...overrideData,
          updatedByAdminUserId: input.actorAdminUserId,
        },
        create: {
          companyId: input.companyId,
          ...overrideData,
          updatedByAdminUserId: input.actorAdminUserId,
        },
      });
    }

    await writeCommercialAuditLog({
      type: CommercialAuditType.COMPANY_PRICING_UPDATED,
      actorAdminUserId: input.actorAdminUserId,
      companyId: input.companyId,
      note,
      payload: {
        companyPlanId,
        buyBtcFeePct: buyBtcFeePct?.toString() ?? null,
        sellBtcFeePct: sellBtcFeePct?.toString() ?? null,
        loanAprStandard: loanAprStandard?.toString() ?? null,
        loanAprSubscriber: loanAprSubscriber?.toString() ?? null,
      },
      tx,
    });
  });
}

export async function updateDefaultPricingPlanFromAdmin(input: {
  actorAdminUserId: string;
  note?: string | null;
  rules: Partial<Record<string, string | null | undefined>>;
}) {
  return prisma.$transaction(async (tx) => {
    const plan = await ensureDefaultPricingPlanForAdmin(input.actorAdminUserId, tx);
    const fallbackRules = getCommercialPricingFallbacks();

    for (const definition of COMMERCIAL_PRICING_FIELD_DEFINITIONS) {
      const rawInput = input.rules[definition.key];
      const normalizedRaw = normalizeText(rawInput);
      const fallbackValue = fallbackRules[definition.key] ?? null;
      const candidate = normalizedRaw ?? fallbackValue;

      if (!candidate) {
        await tx.pricingPlanRule.deleteMany({
          where: {
            planId: plan.id,
            key: definition.key,
          },
        });
        continue;
      }

      const payload =
        definition.kind === "int"
          ? { valueInt: parseNullableInteger(candidate, { min: 0, max: 365 }) }
          : {
              valueDecimal: parseNullableDecimal(candidate, {
                min: 0,
                maxExclusive: 1,
              }),
            };

      const existing = await tx.pricingPlanRule.findFirst({
        where: {
          planId: plan.id,
          key: definition.key,
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        await tx.pricingPlanRule.update({
          where: {
            id: existing.id,
          },
          data: {
            valueDecimal: definition.kind === "decimal" ? payload.valueDecimal ?? null : null,
            valueInt: definition.kind === "int" ? payload.valueInt ?? null : null,
            valueJson: Prisma.JsonNull,
            currency: null,
            assetCode: null,
          },
        });
      } else {
        await tx.pricingPlanRule.create({
          data: {
            key: definition.key,
            planId: plan.id,
            valueDecimal: definition.kind === "decimal" ? payload.valueDecimal ?? null : null,
            valueInt: definition.kind === "int" ? payload.valueInt ?? null : null,
            valueJson: Prisma.JsonNull,
            currency: null,
            assetCode: null,
          },
        });
      }
    }

    await writeCommercialAuditLog({
      type: CommercialAuditType.PRICING_PLAN_UPDATED,
      actorAdminUserId: input.actorAdminUserId,
      pricingPlanId: plan.id,
      note: normalizeText(input.note),
      payload: {
        updatedKeys: COMMERCIAL_PRICING_FIELD_DEFINITIONS.map((definition) => definition.key),
      },
      tx,
    });

    return plan.id;
  });
}
