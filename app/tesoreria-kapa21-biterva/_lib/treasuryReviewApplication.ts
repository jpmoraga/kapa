export const MAX_MULTI_SELECT = 2;

export type TreasuryReviewApplicationPayload = {
  name: string;
  company: string;
  role: string;
  email: string;
  country: string;
  annualRevenue: string;
  industry: string;
  hasRealOperations: string;
  mainNeeds: string[];
  context: string;
  interestHorizon: string;
  decisionRole: string;
  bitcoinRelationship: string[];
  conversationGoal: string;
  acceptedTerms: boolean;
};

type ParseResult =
  | { ok: true; data: TreasuryReviewApplicationPayload }
  | { ok: false; error: string };

export function isValidTreasuryReviewEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(items));
}

export function parseTreasuryReviewApplicationPayload(input: unknown): ParseResult {
  const body =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};

  const data: TreasuryReviewApplicationPayload = {
    name: normalizeText(body.name),
    company: normalizeText(body.company),
    role: normalizeText(body.role),
    email: normalizeText(body.email),
    country: normalizeText(body.country),
    annualRevenue: normalizeText(body.annualRevenue),
    industry: normalizeText(body.industry),
    hasRealOperations: normalizeText(body.hasRealOperations),
    mainNeeds: normalizeStringArray(body.mainNeeds),
    context: normalizeText(body.context),
    interestHorizon: normalizeText(body.interestHorizon),
    decisionRole: normalizeText(body.decisionRole),
    bitcoinRelationship: normalizeStringArray(body.bitcoinRelationship),
    conversationGoal: normalizeText(body.conversationGoal),
    acceptedTerms: body.acceptedTerms === true,
  };

  if (
    !data.name ||
    !data.company ||
    !data.role ||
    !data.email ||
    !data.country ||
    !data.annualRevenue ||
    !data.industry ||
    !data.hasRealOperations ||
    !data.context ||
    !data.interestHorizon ||
    !data.decisionRole ||
    !data.conversationGoal
  ) {
    return {
      ok: false,
      error: "Revisa los campos obligatorios y vuelve a intentarlo.",
    };
  }

  if (!isValidTreasuryReviewEmail(data.email)) {
    return {
      ok: false,
      error: "Ingresa un email válido.",
    };
  }

  if (data.mainNeeds.length === 0 || data.mainNeeds.length > MAX_MULTI_SELECT) {
    return {
      ok: false,
      error: `Selecciona entre 1 y ${MAX_MULTI_SELECT} necesidades principales.`,
    };
  }

  if (
    data.bitcoinRelationship.length === 0 ||
    data.bitcoinRelationship.length > MAX_MULTI_SELECT
  ) {
    return {
      ok: false,
      error: `Selecciona entre 1 y ${MAX_MULTI_SELECT} opciones sobre tu relación con Bitcoin.`,
    };
  }

  if (!data.acceptedTerms) {
    return {
      ok: false,
      error: "Debes aceptar la condición para postular.",
    };
  }

  return { ok: true, data };
}
