import { prisma } from "@/lib/prisma";
import { AssetCode, LoanCurrency, Prisma } from "@prisma/client";

export const PRICING_KEYS = {
  LOAN_APR_STANDARD: "LOAN_APR_STANDARD",
  LOAN_APR_SUBSCRIBER: "LOAN_APR_SUBSCRIBER",
  LOAN_MIN_DAYS_STANDARD: "LOAN_MIN_DAYS_STANDARD",
  LOAN_MIN_DAYS_SUBSCRIBER: "LOAN_MIN_DAYS_SUBSCRIBER",
  LOAN_MAX_LTV_PCT_STANDARD: "LOAN_MAX_LTV_PCT_STANDARD",
  LOAN_MAX_LTV_PCT_SUBSCRIBER: "LOAN_MAX_LTV_PCT_SUBSCRIBER",
} as const;

export type PricingRuleValue = {
  key: string;
  valueDecimal: Prisma.Decimal | null;
  valueInt: number | null;
  valueJson: Prisma.JsonValue | null;
  currency: LoanCurrency | null;
  assetCode: AssetCode | null;
};

export type PricingContext = {
  plan: { id: string; name: string; isDefault: boolean } | null;
  rules: Record<string, PricingRuleValue>;
  source: "user" | "company" | "default" | "none";
};

function normalizeRules(rules: PricingRuleValue[]) {
  return rules.reduce<Record<string, PricingRuleValue>>((acc, rule) => {
    acc[rule.key] = rule;
    return acc;
  }, {});
}

export async function getPricingContext(params: {
  companyId?: string | null;
  userId?: string | null;
  tx?: Prisma.TransactionClient;
}): Promise<PricingContext> {
  const client = params.tx ?? prisma;

  if (params.userId) {
    const userPricing = await client.userPricing.findUnique({
      where: { userId: params.userId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            isDefault: true,
            rules: {
              select: {
                key: true,
                valueDecimal: true,
                valueInt: true,
                valueJson: true,
                currency: true,
                assetCode: true,
              },
            },
          },
        },
      },
    });

    if (userPricing?.plan) {
      return {
        plan: {
          id: userPricing.plan.id,
          name: userPricing.plan.name,
          isDefault: userPricing.plan.isDefault,
        },
        rules: normalizeRules(userPricing.plan.rules as PricingRuleValue[]),
        source: "user",
      };
    }
  }

  if (params.companyId) {
    const companyPricing = await client.companyPricing.findUnique({
      where: { companyId: params.companyId },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            isDefault: true,
            rules: {
              select: {
                key: true,
                valueDecimal: true,
                valueInt: true,
                valueJson: true,
                currency: true,
                assetCode: true,
              },
            },
          },
        },
      },
    });

    if (companyPricing?.plan) {
      return {
        plan: {
          id: companyPricing.plan.id,
          name: companyPricing.plan.name,
          isDefault: companyPricing.plan.isDefault,
        },
        rules: normalizeRules(companyPricing.plan.rules as PricingRuleValue[]),
        source: "company",
      };
    }
  }

  const defaultPlan = await client.pricingPlan.findFirst({
    where: { isDefault: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isDefault: true,
      rules: {
        select: {
          key: true,
          valueDecimal: true,
          valueInt: true,
          valueJson: true,
          currency: true,
          assetCode: true,
        },
      },
    },
  });

  if (defaultPlan) {
    return {
      plan: { id: defaultPlan.id, name: defaultPlan.name, isDefault: defaultPlan.isDefault },
      rules: normalizeRules(defaultPlan.rules as PricingRuleValue[]),
      source: "default",
    };
  }

  return { plan: null, rules: {}, source: "none" };
}

export function getRuleDecimal(
  rules: Record<string, PricingRuleValue>,
  key: string
): Prisma.Decimal | null {
  const rule = rules[key];
  if (!rule) return null;
  if (rule.valueDecimal) return new Prisma.Decimal(rule.valueDecimal);
  if (typeof rule.valueInt === "number") return new Prisma.Decimal(rule.valueInt);
  return null;
}

export function getRuleInt(
  rules: Record<string, PricingRuleValue>,
  key: string
): number | null {
  const rule = rules[key];
  if (!rule) return null;
  if (typeof rule.valueInt === "number") return rule.valueInt;
  if (rule.valueDecimal) {
    const asNumber = Number(rule.valueDecimal.toString());
    return Number.isFinite(asNumber) ? Math.round(asNumber) : null;
  }
  return null;
}
