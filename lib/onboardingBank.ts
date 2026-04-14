const ONBOARDING_BANKS = [
  { value: "banco-de-chile", label: "Banco de Chile" },
  { value: "santander", label: "Banco Santander" },
  { value: "bancoestado", label: "BancoEstado" },
  { value: "bci", label: "BCI" },
  { value: "itau", label: "Itaú" },
  { value: "scotiabank", label: "Scotiabank" },
  { value: "security", label: "Banco Security" },
  { value: "bice", label: "Banco BICE" },
  { value: "internacional", label: "Banco Internacional" },
  { value: "consorcio", label: "Banco Consorcio" },
  { value: "falabella", label: "Banco Falabella" },
  { value: "ripley", label: "Banco Ripley" },
  { value: "coopeuch", label: "Coopeuch" },
  { value: "hsbc", label: "HSBC" },
] as const;

const ONBOARDING_ACCOUNT_TYPES = [
  { value: "corriente", label: "Cuenta Corriente" },
  { value: "vista", label: "Cuenta Vista" },
  { value: "rut", label: "Cuenta RUT" },
  { value: "ahorro", label: "Cuenta de Ahorro" },
] as const;

const BANK_VALUES = new Set(ONBOARDING_BANKS.map((bank) => bank.value));
const ACCOUNT_TYPE_VALUES = new Set(ONBOARDING_ACCOUNT_TYPES.map((type) => type.value));

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function computeRutCheckDigit(body: string) {
  let sum = 0;
  let multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const rest = 11 - (sum % 11);
  if (rest === 11) return "0";
  if (rest === 10) return "K";
  return String(rest);
}

export function normalizeRut(value: unknown) {
  const raw = normalizeString(value)
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/–/g, "-")
    .toUpperCase();

  if (!raw) return "";

  const compact = raw.replace(/[^0-9K-]/g, "");
  const parts = compact.split("-").filter(Boolean);

  if (parts.length > 2) return "";

  if (parts.length === 2) {
    const body = parts[0].replace(/\D/g, "");
    const dv = parts[1].replace(/[^0-9K]/g, "").slice(0, 1);
    return body && dv ? `${body}-${dv}` : "";
  }

  const digits = compact.replace(/[^0-9K]/g, "");
  if (digits.length < 2) return "";

  const body = digits.slice(0, -1).replace(/\D/g, "");
  const dv = digits.slice(-1);
  return body && dv ? `${body}-${dv}` : "";
}

export function isValidRut(value: unknown) {
  const normalized = normalizeRut(value);
  if (!normalized) return false;

  const [body, dv] = normalized.split("-");
  if (!body || !dv) return false;
  if (!/^\d{7,8}$/.test(body)) return false;

  return computeRutCheckDigit(body) === dv;
}

export function validateOnboardingBankInput(body: unknown, fallbackHolderRut?: string | null) {
  const source = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const bankName = normalizeString(source.bankName).toLowerCase();
  const accountType = normalizeString(source.accountType).toLowerCase();
  const accountNumber = normalizeString(source.accountNumber).replace(/\s+/g, "");
  const holderRut = normalizeRut(source.holderRut ?? fallbackHolderRut ?? "");

  if (!BANK_VALUES.has(bankName as (typeof ONBOARDING_BANKS)[number]["value"])) {
    return { ok: false as const, status: 400, error: "Banco inválido" };
  }

  if (!ACCOUNT_TYPE_VALUES.has(accountType as (typeof ONBOARDING_ACCOUNT_TYPES)[number]["value"])) {
    return { ok: false as const, status: 400, error: "Tipo de cuenta inválido" };
  }

  if (!/^\d{4,20}$/.test(accountNumber)) {
    return {
      ok: false as const,
      status: 400,
      error: "Número de cuenta inválido. Usa solo dígitos (4 a 20).",
    };
  }

  if (!holderRut) {
    return {
      ok: false as const,
      status: 409,
      error: "Completa un RUT válido antes de registrar tu cuenta bancaria.",
    };
  }

  if (!isValidRut(holderRut)) {
    return {
      ok: false as const,
      status: 400,
      error: "RUT del titular inválido.",
    };
  }

  return {
    ok: true as const,
    value: {
      bankName,
      accountType,
      accountNumber,
      holderRut,
    },
  };
}

export { ONBOARDING_ACCOUNT_TYPES, ONBOARDING_BANKS };
