export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

type Pair = "BTC_CLP" | "USDT_CLP";

function safeReturnTo(value: FormDataEntryValue | null, fallbackPath: string) {
  const raw = String(value ?? "").trim();
  if (!raw.startsWith("/admin/")) return fallbackPath;
  return raw;
}

function redirectTo(req: Request, returnTo: string, params?: Record<string, string>) {
  const target = new URL(returnTo, req.url);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}

function normalizePair(value: FormDataEntryValue | null): Pair | null {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "BTC_CLP") return "BTC_CLP";
  if (raw === "USDT_CLP") return "USDT_CLP";
  return null;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const form = await req.formData();
  const pair = normalizePair(form.get("pair"));
  const returnTo = safeReturnTo(form.get("returnTo"), "/admin/pricing");

  if (!pair) {
    return redirectTo(req, returnTo, { error: "invalid_price_pair" });
  }

  try {
    const url = new URL(`/api/prices/current?pair=${pair}`, req.url);
    const res = await fetch(url.toString(), { cache: "no-store" });
    const body = await res.json().catch(() => null);

    if (!res.ok || !body?.ok || body?.stale) {
      return redirectTo(req, returnTo, {
        error: pair === "BTC_CLP" ? "btc_clp_refresh_failed" : "usd_clp_refresh_failed",
      });
    }

    return redirectTo(req, returnTo, {
      flash: pair === "BTC_CLP" ? "btc_clp_refreshed" : "usd_clp_refreshed",
    });
  } catch (error: unknown) {
    console.error("admin:refresh_market_price_fail", {
      adminUserId: admin.admin.id,
      pair,
      error: error instanceof Error ? error.message : "refresh_market_price_failed",
    });
    return redirectTo(req, returnTo, {
      error: pair === "BTC_CLP" ? "btc_clp_refresh_failed" : "usd_clp_refresh_failed",
    });
  }
}
