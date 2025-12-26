// web/app/api/market/candles/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // ✅ BUDA espera btc-clp (lowercase, con guión)
    const marketId = (searchParams.get("marketId") ?? "btc-clp").toLowerCase();
    const tf = (searchParams.get("tf") ?? "1m").toLowerCase();

    // ✅ Timeframes válidos para BUDA
    const timeframe =
      tf === "1d" ? "5m" :
      tf === "1w" ? "1h" :
      tf === "1m" ? "4h" :
      tf === "1y" ? "1d" :
      "1d";

    // rango de tiempo (BUDA usa ms)
    const days =
      tf === "1d" ? 1 :
      tf === "1w" ? 7 :
      tf === "1m" ? 30 :
      tf === "1y" ? 365 :
      365 * 5;

    const until = Date.now();
    const since = until - days * 24 * 60 * 60 * 1000;

    const url =
      `https://www.buda.com/api/v2/markets/${marketId}/candles` +
      `?timeframe=${timeframe}&since=${since}&until=${until}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    const json = await res.json();
    console.log("BUDA_CANDLES_RAW", JSON.stringify(json).slice(0, 1000));

    const raw = Array.isArray(json?.candles) ? json.candles : [];

    const candles = raw.map((c: any[]) => ({
      time: Math.floor(Number(c[0]) / 1000), // ms → sec
      open: Number(c[1]),
      high: Number(c[2]),
      low: Number(c[3]),
      close: Number(c[4]),
    }));

    return NextResponse.json({ ok: true, candles });
  } catch (e: any) {
    console.error("CANDLES_API_ERROR", e);
    return NextResponse.json({ ok: false, candles: [] });
  }
}