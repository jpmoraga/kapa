// web/app/api/buda/ticker/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketId =
      searchParams.get("marketId") ?? searchParams.get("market_id") ?? "btc-clp";

    const budaUrl = `https://www.buda.com/api/v2/markets/${marketId}/ticker`;

    const res = await fetch(budaUrl, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Error desde Buda:", res.status, res.statusText);
      return NextResponse.json(
        { error: "Error al consultar Buda" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const ticker = data.ticker;

    const lastPrice = ticker.last_price?.[0] ?? null;
    const currency = ticker.last_price?.[1] ?? null;

    return NextResponse.json({
      market_id: ticker.market_id,
      last_price: lastPrice,
      currency,
      max_bid: ticker.max_bid?.[0] ?? null,
      min_ask: ticker.min_ask?.[0] ?? null,
      price_variation_24h: ticker.price_variation_24h,
      price_variation_7d: ticker.price_variation_7d,
      volume_24h: ticker.volume?.[0] ?? null,
    });
  } catch (err) {
    console.error("Error interno en /api/buda/ticker:", err);
    return NextResponse.json(
      { error: "Error interno en el servidor" },
      { status: 500 }
    );
  }
}