// web/app/api/prices/spot/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

type Pair = "BTC_CLP" | "USDT_CLP";

function normalizePair(input: string | null): Pair | null {
  const v = String(input ?? "").trim().toUpperCase();
  if (v === "BTC_CLP") return "BTC_CLP";
  if (v === "USDT_CLP") return "USDT_CLP";
  return null;
}

function pairFromMarketId(input: string | null): Pair | null {
  const v = String(input ?? "").trim().toLowerCase();
  if (v === "btc-clp") return "BTC_CLP";
  if (v === "usdt-clp" || v === "usd-clp") return "USDT_CLP";
  return null;
}

function pairMeta(pair: Pair) {
  if (pair === "BTC_CLP") {
    return { marketId: "btc-clp" } as const;
  }
  return { marketId: "usdt-clp" } as const;
}

async function fetchSpotFromTrades(marketId: string) {
  const budaUrl = `https://www.buda.com/api/v2/markets/${marketId}/trades?limit=50`;
  const res = await fetch(budaUrl, { cache: "no-store", headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`BUDA_${res.status}`);
  const data = await res.json().catch(() => null);
  const entries = data?.trades?.entries ?? [];
  if (!Array.isArray(entries) || entries.length === 0) throw new Error("NO_TRADES");

  const latest = entries.reduce(
    (acc: any[] | null, curr: any[]) => {
      if (!Array.isArray(curr) || curr.length < 3) return acc;
      if (!acc) return curr;
      return Number(curr[0]) > Number(acc[0]) ? curr : acc;
    },
    null
  );

  if (!latest) throw new Error("NO_TRADES");
  const timeMs = Number(latest[0]);
  const priceStr = latest[2];
  const n = Number(String(priceStr ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) throw new Error("BAD_PRICE");

  return { price: String(priceStr), timestamp: new Date(timeMs).toISOString() };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pair =
    normalizePair(url.searchParams.get("pair")) ??
    pairFromMarketId(url.searchParams.get("marketId"));
  if (!pair) {
    return NextResponse.json(
      { ok: false, message: "Missing/invalid pair. Use pair=BTC_CLP or pair=USDT_CLP", code: "bad_pair" },
      { status: 400 }
    );
  }

  try {
    const meta = pairMeta(pair);
    const spot = await fetchSpotFromTrades(meta.marketId);
    console.log("SPOT_PRICE_FETCH", { pair, price: spot.price, timestamp: spot.timestamp });
    return NextResponse.json({
      ok: true,
      pair,
      price: spot.price,
      timestamp: spot.timestamp,
      source: "buda_trades",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        message: e?.message ?? "Spot price fetch failed",
        code: "spot_fetch_failed",
      },
      { status: 502 }
    );
  }
}
