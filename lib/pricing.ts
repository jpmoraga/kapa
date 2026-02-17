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

function isMissingSchemaError(error: unknown) {
  const err = error as any;
  const code = String(err?.code ?? "");
  const metaCause = String(err?.meta?.cause ?? "");
  const message = String(err?.message ?? "");
  const combined = `${message} ${metaCause}`.toLowerCase();
  return (
    code === "P2021" ||
    code === "P2022" ||
    combined.includes("relation") && combined.includes("does not exist") ||
    combined.includes("column") && combined.includes("does not exist") ||
    combined.includes("42p01") ||
    combined.includes("42703")
  );
}

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

  try {
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
  } catch (error) {
    if (isMissingSchemaError(error)) {
      const err = error as any;
      console.warn("PRICING_FALLBACK", {
        companyId: params.companyId ?? null,
        userId: params.userId ?? null,
        errCode: err?.code ?? err?.meta?.cause ?? "UNKNOWN",
      });
      return { plan: null, rules: {}, source: "none" };
    }
    throw error;
  }
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
