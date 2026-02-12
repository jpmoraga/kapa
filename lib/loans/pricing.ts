import { Prisma } from "@prisma/client";

export function safeDecimal(input: unknown, fallback = "0") {
  try {
    return new Prisma.Decimal(String(input ?? fallback));
  } catch {
    return new Prisma.Decimal(fallback);
  }
}

export async function fetchBtcClpPrice(origin: string) {
  const res = await fetch(`${origin}/api/prices/current?pair=BTC_CLP`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, price: null, error: data?.error ?? "price_error" };
  const priceStr = String(data?.price ?? "");
  if (!priceStr) return { ok: false as const, price: null, error: "missing_price" };
  return { ok: true as const, price: priceStr, error: null };
}
