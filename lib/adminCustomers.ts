import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isHiddenAuditOrTestCompanyName } from "@/lib/adminListVisibility";

export type AdminCustomerFilter =
  | "all"
  | "with-balance"
  | "subscribed"
  | "not-subscribed"
  | "active";

export const adminCustomerFilters: ReadonlyArray<{
  value: AdminCustomerFilter;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "with-balance", label: "Con saldo" },
  { value: "subscribed", label: "Suscritos" },
  { value: "not-subscribed", label: "No suscritos" },
  { value: "active", label: "Activos" },
];

type CustomerListUserSelect = Prisma.UserSelect;
type CustomerDetailUserSelect = Prisma.UserSelect;

const customerListUserSelect = {
  id: true,
  email: true,
  createdAt: true,
  isSubscriber: true,
  subscriberSince: true,
  personProfile: {
    select: {
      fullName: true,
      rut: true,
      phone: true,
    },
  },
} satisfies CustomerListUserSelect;

const customerDetailUserSelect = {
  id: true,
  email: true,
  createdAt: true,
  isSubscriber: true,
  subscriberSince: true,
  personProfile: {
    select: {
      fullName: true,
      rut: true,
      phone: true,
    },
  },
  bankAccount: {
    select: {
      bankName: true,
      accountType: true,
      accountNumber: true,
      holderRut: true,
    },
  },
  onboarding: {
    select: {
      termsAcceptedAt: true,
      idDocumentFrontPath: true,
      idDocumentBackPath: true,
      createdAt: true,
      updatedAt: true,
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
} satisfies CustomerDetailUserSelect;

const customerListCompanySelect = {
  id: true,
  name: true,
  kind: true,
  companyRut: true,
  onboardingCompleted: true,
  fundsDeclAcceptedAt: true,
  privacyAcceptedAt: true,
  termsAcceptedAt: true,
  personalOwner: {
    select: customerListUserSelect,
  },
  members: {
    select: {
      role: true,
      user: {
        select: customerListUserSelect,
      },
    },
  },
  treasury: {
    select: {
      assetCode: true,
      balance: true,
    },
  },
  movements: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      createdAt: true,
    },
  },
  loans: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      createdAt: true,
    },
  },
} satisfies Prisma.CompanySelect;

const customerDetailCompanySelect = {
  id: true,
  name: true,
  kind: true,
  companyRut: true,
  onboardingCompleted: true,
  fundsDeclAcceptedAt: true,
  privacyAcceptedAt: true,
  termsAcceptedAt: true,
  personalOwner: {
    select: customerDetailUserSelect,
  },
  members: {
    select: {
      role: true,
      user: {
        select: customerDetailUserSelect,
      },
    },
  },
  treasury: {
    select: {
      assetCode: true,
      balance: true,
    },
  },
  movements: {
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      createdAt: true,
      approvedAt: true,
      executedAt: true,
      status: true,
      type: true,
      assetCode: true,
      amount: true,
      note: true,
      internalReason: true,
      paidOut: true,
      paidOutAt: true,
      createdBy: {
        select: {
          email: true,
        },
      },
    },
  },
  loans: {
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      createdAt: true,
      approvedAt: true,
      disbursedAt: true,
      closedAt: true,
      paidAt: true,
      status: true,
      principalClp: true,
      interestApr: true,
      currency: true,
      collateralSatsTotal: true,
      borrower: {
        select: {
          email: true,
          personProfile: {
            select: {
              fullName: true,
            },
          },
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
          createdAt: true,
        },
      },
    },
  },
} satisfies Prisma.CompanySelect;

type CustomerListCompany = Prisma.CompanyGetPayload<{
  select: typeof customerListCompanySelect;
}>;

type CustomerDetailCompany = Prisma.CompanyGetPayload<{
  select: typeof customerDetailCompanySelect;
}>;

type CustomerListUser = NonNullable<CustomerListCompany["personalOwner"]>;
type CustomerDetailUser = NonNullable<CustomerDetailCompany["personalOwner"]>;

type BalancesView = {
  clp: string;
  usd: string;
  btc: string;
};

type SubscriptionView = {
  hasSubscriberMember: boolean;
  subscriberCount: number;
  earliestSubscriberSince: string | null;
};

export type AdminCustomerListItem = {
  companyId: string;
  displayName: string;
  companyName: string;
  kind: "PERSONAL" | "BUSINESS";
  companyRut: string | null;
  statusLabel: string;
  onboardingCompleted: boolean;
  primaryContact: {
    userId: string | null;
    name: string | null;
    email: string | null;
    role: string | null;
  };
  subscription: SubscriptionView;
  balances: BalancesView;
  hasBalance: boolean;
  isActive: boolean;
  lastActivityAt: string | null;
  lastActivitySource: "movement" | "loan" | null;
};

export type AdminCustomerListResponse = {
  rows: AdminCustomerListItem[];
  total: number;
  filter: AdminCustomerFilter;
  q: string;
};

export type AdminCustomerDetail = {
  companyId: string;
  displayName: string;
  companyName: string;
  kind: "PERSONAL" | "BUSINESS";
  companyRut: string | null;
  createdAt: string | null;
  summary: {
    contactName: string | null;
    contactEmail: string | null;
    contactRole: string | null;
    memberCount: number;
    onboardingCompleted: boolean;
    fundsDeclAcceptedAt: string | null;
    privacyAcceptedAt: string | null;
    termsAcceptedAt: string | null;
    lastActivityAt: string | null;
    lastActivitySource: "movement" | "loan" | null;
  };
  subscription: SubscriptionView & {
    subscriberMembers: Array<{
      userId: string;
      name: string | null;
      email: string;
      subscriberSince: string | null;
    }>;
  };
  balances: BalancesView;
  pricing: {
    companyPlanName: string | null;
    companyPlanIsDefault: boolean | null;
    userPricingCount: number;
  };
  members: Array<{
    userId: string;
    role: string;
    name: string | null;
    email: string;
    subscriber: boolean;
    subscriberSince: string | null;
    createdAt: string;
    onboarding: {
      hasIdDocument: boolean;
      hasProfile: boolean;
      hasBankAccount: boolean;
      termsAccepted: boolean;
      canOperate: boolean;
      isComplete: boolean;
      step: string;
    };
    bankAccount: {
      bankName: string | null;
      accountType: string | null;
      accountNumberMasked: string | null;
      holderRut: string | null;
    } | null;
    userPricingPlanName: string | null;
  }>;
  recentMovements: Array<{
    id: string;
    createdAt: string;
    approvedAt: string | null;
    executedAt: string | null;
    status: string;
    type: string;
    assetCode: string;
    amount: string;
    note: string | null;
    internalReason: string;
    paidOut: boolean;
    paidOutAt: string | null;
    createdByEmail: string | null;
  }>;
  loans: Array<{
    id: string;
    createdAt: string;
    approvedAt: string | null;
    disbursedAt: string | null;
    closedAt: string | null;
    paidAt: string | null;
    status: string;
    currency: string;
    principalClp: string;
    interestApr: string;
    collateralSatsTotal: string;
    borrowerName: string | null;
    borrowerEmail: string | null;
  }>;
};

function normalizeFilter(value: string | null | undefined): AdminCustomerFilter {
  const normalized = String(value ?? "all").trim().toLowerCase();
  return adminCustomerFilters.some((option) => option.value === normalized)
    ? (normalized as AdminCustomerFilter)
    : "all";
}

function normalizeQuery(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function roleRank(role: string | null | undefined) {
  const normalized = String(role ?? "").toLowerCase();
  if (normalized === "owner") return 0;
  if (normalized === "admin") return 1;
  return 10;
}

function compareDatesAsc(a: Date, b: Date) {
  return a.getTime() - b.getTime();
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toDecimalString(value: Prisma.Decimal | string | number | bigint | null | undefined) {
  if (value === null || value === undefined) return "0";
  return value.toString();
}

function isNonZeroBalanceValue(value: string) {
  return !new Prisma.Decimal(value).eq(0);
}

function readBalances(
  treasury: Array<{
    assetCode: "CLP" | "USD" | "BTC";
    balance: Prisma.Decimal;
  }>
): BalancesView {
  const base: BalancesView = { clp: "0", usd: "0", btc: "0" };

  for (const account of treasury) {
    if (account.assetCode === "CLP") base.clp = toDecimalString(account.balance);
    if (account.assetCode === "USD") base.usd = toDecimalString(account.balance);
    if (account.assetCode === "BTC") base.btc = toDecimalString(account.balance);
  }

  return base;
}

function deriveOnboarding(user: {
  personProfile: { fullName: string | null; rut: string | null; phone: string | null } | null;
  onboarding:
    | {
        termsAcceptedAt: Date | null;
        idDocumentFrontPath: string | null;
        idDocumentBackPath: string | null;
      }
    | null;
  bankAccount: { bankName: string | null } | null;
}) {
  const hasIdDocument =
    Boolean(user.onboarding?.idDocumentFrontPath) && Boolean(user.onboarding?.idDocumentBackPath);
  const hasProfile =
    Boolean(user.personProfile?.fullName?.trim()) &&
    Boolean(user.personProfile?.rut?.trim()) &&
    Boolean(user.personProfile?.phone?.trim());
  const hasBankAccount = Boolean(user.bankAccount?.bankName);
  const termsAccepted = Boolean(user.onboarding?.termsAcceptedAt);
  const isComplete = hasIdDocument && hasProfile && hasBankAccount && termsAccepted;

  const step = !hasIdDocument
    ? "document"
    : !hasProfile
    ? "personal"
    : !hasBankAccount
    ? "bank"
    : !termsAccepted
    ? "terms"
    : "complete";

  return {
    hasIdDocument,
    hasProfile,
    hasBankAccount,
    termsAccepted,
    canOperate: isComplete,
    isComplete,
    step,
  };
}

function getDisplayName(user: {
  personProfile: { fullName: string | null } | null;
  email: string;
}) {
  return user.personProfile?.fullName?.trim() || null;
}

function maskAccountNumber(value: string | null | undefined) {
  if (!value) return null;
  const raw = String(value);
  if (raw.length <= 4) return raw;
  return `${"*".repeat(Math.max(raw.length - 4, 2))}${raw.slice(-4)}`;
}

function buildMemberCollection<T extends { role: string; user: CustomerListUser | CustomerDetailUser }>(
  company: { personalOwner: T["user"] | null; members: T[] }
) {
  const byUserId = new Map<
    string,
    {
      role: string;
      user: T["user"];
    }
  >();

  for (const membership of company.members) {
    byUserId.set(membership.user.id, { role: membership.role, user: membership.user });
  }

  if (company.personalOwner && !byUserId.has(company.personalOwner.id)) {
    byUserId.set(company.personalOwner.id, {
      role: "owner",
      user: company.personalOwner,
    });
  }

  return Array.from(byUserId.values()).sort((a, b) => {
    const roleDiff = roleRank(a.role) - roleRank(b.role);
    if (roleDiff !== 0) return roleDiff;
    const createdDiff = compareDatesAsc(a.user.createdAt, b.user.createdAt);
    if (createdDiff !== 0) return createdDiff;
    return a.user.email.localeCompare(b.user.email);
  });
}

function derivePrimaryContact<T extends { role: string; user: CustomerListUser | CustomerDetailUser }>(
  company: { personalOwner: T["user"] | null; members: T[] }
) {
  const members = buildMemberCollection(company);
  const top = members[0] ?? null;

  return top
    ? {
        userId: top.user.id,
        name: getDisplayName(top.user),
        email: top.user.email,
        role: top.role,
      }
    : {
        userId: null,
        name: null,
        email: null,
        role: null,
      };
}

function deriveSubscription<T extends { role: string; user: CustomerListUser | CustomerDetailUser }>(
  company: { personalOwner: T["user"] | null; members: T[] }
) {
  const members = buildMemberCollection(company);
  const subscribers = members.filter((member) => member.user.isSubscriber);

  const earliestSubscriberSince = subscribers
    .map((member) => member.user.subscriberSince)
    .filter((value): value is Date => Boolean(value))
    .sort(compareDatesAsc)[0];

  return {
    hasSubscriberMember: subscribers.length > 0,
    subscriberCount: subscribers.length,
    earliestSubscriberSince: toIso(earliestSubscriberSince),
  };
}

function deriveCompanyStatusLabel(company: {
  kind: "PERSONAL" | "BUSINESS";
  onboardingCompleted: boolean;
}) {
  if (company.onboardingCompleted) return "Onboarding completo";
  return company.kind === "PERSONAL" ? "Cuenta personal" : "Pendiente";
}

function deriveLastActivity(
  movementAt: Date | null | undefined,
  loanAt: Date | null | undefined
): { at: string | null; source: "movement" | "loan" | null } {
  const movementTime = movementAt?.getTime() ?? null;
  const loanTime = loanAt?.getTime() ?? null;

  if (movementTime === null && loanTime === null) {
    return { at: null, source: null };
  }

  if (movementTime !== null && (loanTime === null || movementTime >= loanTime)) {
    return { at: toIso(movementAt), source: "movement" };
  }

  return { at: toIso(loanAt), source: "loan" };
}

function matchesSearch(row: AdminCustomerListItem, query: string) {
  if (!query) return true;
  const haystack = [
    row.displayName,
    row.companyName,
    row.companyRut ?? "",
    row.primaryContact.name ?? "",
    row.primaryContact.email ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function matchesFilter(row: AdminCustomerListItem, filter: AdminCustomerFilter) {
  if (filter === "all") return true;
  if (filter === "with-balance") return row.hasBalance;
  if (filter === "subscribed") return row.subscription.hasSubscriberMember;
  if (filter === "not-subscribed") return !row.subscription.hasSubscriberMember;
  if (filter === "active") return row.isActive;
  return true;
}

function toListItem(company: CustomerListCompany): AdminCustomerListItem {
  const balances = readBalances(company.treasury);
  const primaryContact = derivePrimaryContact(company);
  const subscription = deriveSubscription(company);
  const lastActivity = deriveLastActivity(
    company.movements[0]?.createdAt,
    company.loans[0]?.createdAt
  );

  return {
    companyId: company.id,
    displayName: company.name,
    companyName: company.name,
    kind: company.kind,
    companyRut: company.companyRut ?? null,
    statusLabel: deriveCompanyStatusLabel(company),
    onboardingCompleted: company.onboardingCompleted,
    primaryContact,
    subscription,
    balances,
    hasBalance:
      isNonZeroBalanceValue(balances.clp) ||
      isNonZeroBalanceValue(balances.usd) ||
      isNonZeroBalanceValue(balances.btc),
    isActive: Boolean(lastActivity.at),
    lastActivityAt: lastActivity.at,
    lastActivitySource: lastActivity.source,
  };
}

function sortListRows(rows: AdminCustomerListItem[]) {
  return rows.sort((a, b) => {
    const activityA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
    const activityB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
    if (activityA !== activityB) return activityB - activityA;
    return a.displayName.localeCompare(b.displayName, "es");
  });
}

function toDetail(company: CustomerDetailCompany): AdminCustomerDetail {
  const balances = readBalances(company.treasury);
  const primaryContact = derivePrimaryContact(company);
  const subscription = deriveSubscription(company);
  const members = buildMemberCollection(company).map((member) => ({
    userId: member.user.id,
    role: member.role,
    name: getDisplayName(member.user),
    email: member.user.email,
    subscriber: Boolean(member.user.isSubscriber),
    subscriberSince: toIso(member.user.subscriberSince),
    createdAt: member.user.createdAt.toISOString(),
    onboarding: deriveOnboarding(member.user),
    bankAccount: member.user.bankAccount
      ? {
          bankName: member.user.bankAccount.bankName ?? null,
          accountType: member.user.bankAccount.accountType ?? null,
          accountNumberMasked: maskAccountNumber(member.user.bankAccount.accountNumber),
          holderRut: member.user.bankAccount.holderRut ?? null,
        }
      : null,
    userPricingPlanName: member.user.pricingPlan?.plan.name ?? null,
  }));

  const lastActivity = deriveLastActivity(
    company.movements[0]?.createdAt,
    company.loans[0]?.createdAt
  );

  const subscriberMembers = members
    .filter((member) => member.subscriber)
    .map((member) => ({
      userId: member.userId,
      name: member.name,
      email: member.email,
      subscriberSince: member.subscriberSince,
    }));

  return {
    companyId: company.id,
    displayName: company.name,
    companyName: company.name,
    kind: company.kind,
    companyRut: company.companyRut ?? null,
    createdAt: null,
    summary: {
      contactName: primaryContact.name,
      contactEmail: primaryContact.email,
      contactRole: primaryContact.role,
      memberCount: members.length,
      onboardingCompleted: company.onboardingCompleted,
      fundsDeclAcceptedAt: toIso(company.fundsDeclAcceptedAt),
      privacyAcceptedAt: toIso(company.privacyAcceptedAt),
      termsAcceptedAt: toIso(company.termsAcceptedAt),
      lastActivityAt: lastActivity.at,
      lastActivitySource: lastActivity.source,
    },
    subscription: {
      ...subscription,
      subscriberMembers,
    },
    balances,
    pricing: {
      companyPlanName: company.pricingPlan?.plan.name ?? null,
      companyPlanIsDefault:
        typeof company.pricingPlan?.plan.isDefault === "boolean"
          ? company.pricingPlan.plan.isDefault
          : null,
      userPricingCount: members.filter((member) => Boolean(member.userPricingPlanName)).length,
    },
    members,
    recentMovements: company.movements.map((movement) => ({
      id: movement.id,
      createdAt: movement.createdAt.toISOString(),
      approvedAt: toIso(movement.approvedAt),
      executedAt: toIso(movement.executedAt),
      status: String(movement.status),
      type: movement.type,
      assetCode: String(movement.assetCode),
      amount: movement.amount.toString(),
      note: movement.note ?? null,
      internalReason: String(movement.internalReason),
      paidOut: movement.paidOut,
      paidOutAt: toIso(movement.paidOutAt),
      createdByEmail: movement.createdBy?.email ?? null,
    })),
    loans: company.loans.map((loan) => ({
      id: loan.id,
      createdAt: loan.createdAt.toISOString(),
      approvedAt: toIso(loan.approvedAt),
      disbursedAt: toIso(loan.disbursedAt),
      closedAt: toIso(loan.closedAt),
      paidAt: toIso(loan.paidAt),
      status: String(loan.status),
      currency: String(loan.currency),
      principalClp: loan.principalClp.toString(),
      interestApr: loan.interestApr.toString(),
      collateralSatsTotal: loan.collateralSatsTotal.toString(),
      borrowerName: loan.borrower.personProfile?.fullName?.trim() || null,
      borrowerEmail: loan.borrower.email ?? null,
    })),
  };
}

export async function listAdminCustomers(input?: {
  filter?: string | null;
  q?: string | null;
}): Promise<AdminCustomerListResponse> {
  const filter = normalizeFilter(input?.filter);
  const q = normalizeQuery(input?.q);

  const companies = await prisma.company.findMany({
    where: {
      name: {
        not: "__SYSTEM_WALLET__",
      },
    },
    orderBy: {
      name: "asc",
    },
    select: customerListCompanySelect,
  });

  const rows = sortListRows(companies.map(toListItem)).filter((row) => {
    return (
      !isHiddenAuditOrTestCompanyName(row.companyName) &&
      matchesFilter(row, filter) &&
      matchesSearch(row, q)
    );
  });

  return {
    rows,
    total: rows.length,
    filter,
    q,
  };
}

export async function getAdminCustomerDetail(companyId: string) {
  const id = String(companyId ?? "").trim();
  if (!id) return null;

  const company = await prisma.company.findFirst({
    where: {
      id,
      name: {
        not: "__SYSTEM_WALLET__",
      },
    },
    select: customerDetailCompanySelect,
  });

  if (!company) return null;
  return toDetail(company);
}
