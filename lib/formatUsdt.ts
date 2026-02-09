export type DecimalInput = string | number | { toString(): string } | null | undefined;

const THOUSANDS_SEPARATOR = ",";
const DECIMAL_SEPARATOR = ".";

export function displayAsset(code?: string | null): string {
  if (!code) return "--";
  return String(code).toUpperCase() === "USD" ? "USDT" : String(code).toUpperCase();
}

export function formatUsdtClient(value: DecimalInput): string {
  return formatUsdt(value, 2);
}

export function formatUsdtAdmin(value: DecimalInput): string {
  return formatUsdt(value, 6);
}

function formatUsdt(value: DecimalInput, decimals: number): string {
  const normalized = normalizeDecimalString(value);
  if (!normalized) return "--";
  const fixed = toFixedDecimalString(normalized, decimals);
  return `${fixed} USDT`;
}

function normalizeDecimalString(value: DecimalInput): string | null {
  if (value === null || value === undefined) return null;

  let raw: string;
  if (typeof value === "string") {
    raw = value;
  } else if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    raw = String(value);
  } else if (typeof value === "object" && typeof value.toString === "function") {
    raw = value.toString();
  } else {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) return null;

  let cleaned = trimmed;
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    cleaned = cleaned.replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }
  const expanded = expandExponential(cleaned);
  if (!expanded) return null;

  const match = expanded.match(/^([+-])?(\d*)(?:\.(\d*))?$/);
  if (!match) return null;

  const sign = match[1] ?? "";
  let intPart = match[2] ?? "";
  let fracPart = match[3] ?? "";

  if (!intPart && !fracPart) return null;

  intPart = intPart.replace(/^0+(?=\d)/, "");
  if (!intPart) intPart = "0";

  if (!fracPart) return `${sign}${intPart}`;
  return `${sign}${intPart}.${fracPart}`;
}

function expandExponential(value: string): string | null {
  const match = value.match(/^([+-])?(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/);
  if (!match) return value;

  const sign = match[1] ?? "";
  const intPart = match[2];
  const fracPart = match[3] ?? "";
  const exp = Number(match[4]);

  if (!Number.isFinite(exp)) return null;

  const digits = intPart + fracPart;
  if (!digits || /^0+$/.test(digits)) return "0";

  const initialDecimalIndex = intPart.length;
  const nextDecimalIndex = initialDecimalIndex + exp;

  if (nextDecimalIndex <= 0) {
    return `${sign}0.${"0".repeat(Math.abs(nextDecimalIndex))}${digits}`;
  }

  if (nextDecimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(nextDecimalIndex - digits.length)}`;
  }

  return `${sign}${digits.slice(0, nextDecimalIndex)}.${digits.slice(nextDecimalIndex)}`;
}

function toFixedDecimalString(value: string, decimals: number): string {
  const trimmed = value.trim();
  let sign = "";
  let numeric = trimmed;

  if (numeric.startsWith("-")) {
    sign = "-";
    numeric = numeric.slice(1);
  } else if (numeric.startsWith("+")) {
    numeric = numeric.slice(1);
  }

  let [intPart, fracPart = ""] = numeric.split(".");
  intPart = intPart.replace(/^0+(?=\d)/, "");
  if (!intPart) intPart = "0";

  const needed = decimals + 1;
  const fracPadded = fracPart.padEnd(needed, "0");
  let keepFrac = fracPadded.slice(0, decimals);
  const roundDigit = fracPadded.charAt(decimals);

  if (roundDigit && roundDigit >= "5") {
    if (decimals > 0) {
      const rounded = incrementFraction(keepFrac);
      keepFrac = rounded.result;
      if (rounded.carry) {
        intPart = incrementInteger(intPart);
      }
    } else {
      intPart = incrementInteger(intPart);
    }
  }

  const formattedInt = addThousandsSeparator(intPart);
  const formattedFrac = decimals > 0 ? keepFrac.padEnd(decimals, "0") : "";
  const combined = decimals > 0 ? `${formattedInt}${DECIMAL_SEPARATOR}${formattedFrac}` : formattedInt;

  const isZero = intPart === "0" && (!formattedFrac || /^0+$/.test(formattedFrac));
  return sign && !isZero ? `${sign}${combined}` : combined;
}

function incrementFraction(value: string): { result: string; carry: boolean } {
  if (!value) return { result: "", carry: true };
  const digits = value.split("");
  let carry = 1;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    if (!carry) break;
    const next = digits[i].charCodeAt(0) - 48 + carry;
    if (next >= 10) {
      digits[i] = "0";
      carry = 1;
    } else {
      digits[i] = String(next);
      carry = 0;
    }
  }
  if (carry) return { result: "0".repeat(value.length), carry: true };
  return { result: digits.join(""), carry: false };
}

function incrementInteger(value: string): string {
  const digits = value.split("");
  let carry = 1;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    if (!carry) break;
    const next = digits[i].charCodeAt(0) - 48 + carry;
    if (next >= 10) {
      digits[i] = "0";
      carry = 1;
    } else {
      digits[i] = String(next);
      carry = 0;
    }
  }
  if (carry) digits.unshift("1");
  return digits.join("");
}

function addThousandsSeparator(value: string): string {
  const digits = value.replace(/^0+(?=\d)/, "");
  const raw = digits || "0";
  const parts = [] as string[];
  for (let i = raw.length; i > 0; i -= 3) {
    const start = Math.max(i - 3, 0);
    parts.unshift(raw.slice(start, i));
  }
  return parts.join(THOUSANDS_SEPARATOR);
}
