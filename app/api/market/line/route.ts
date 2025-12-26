import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://www.buda.com/api/v2/markets/btc-clp/trades?limit=1000000000",
      { cache: "no-store" }
    );

    const json = await res.json();

    const entries = json?.trades?.entries ?? [];

    // entries: [ [timestamp, amount, price, direction], ... ]
    const points = entries
      .map((e: any[]) => ({
        time: Math.floor(Number(e[0]) / 1000), // ms → sec
        value: Number(e[2]),
      }))
      .reverse(); // importante: orden temporal

    return NextResponse.json({ ok: true, points });
  } catch (e) {
    console.error("LINE_API_ERROR", e);
    return NextResponse.json({ ok: false, points: [] });
  }
}