import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = (searchParams.get("marketId") ?? "btc-clp").toLowerCase();

    // MVP: traer últimos N trades (esto define cuánta historia hay)
    // Puedes subir a 2000/5000 si Buda lo acepta sin problemas.
    const limit = Number(searchParams.get("limit") ?? "500");

    const url = `https://www.buda.com/api/v2/markets/${marketId}/trades?limit=${limit}`;
    const res = await fetch(url, { cache: "no-store", headers: { accept: "application/json" } });

    const text = await res.text();
    if (text.trim().startsWith("<")) {
      console.log("BUDA_TRADES_HTML_SAMPLE", text.slice(0, 200));
      return NextResponse.json({ ok: false, points: [] }, { status: 200 });
    }

    const json = JSON.parse(text);

    const entries = json?.trades?.entries ?? [];

    // entries: [ [timestamp(ms), amount, price, direction], ... ]
    const points = entries
      .map((e: any[]) => ({
        time: Math.floor(Number(e[0]) / 1000), // ms -> sec
        value: Number(e[2]),                  // ✅ precio
      }))
      .filter((p: any) => Number.isFinite(p.time) && Number.isFinite(p.value))
      .sort((a: any, b: any) => a.time - b.time)
      .filter((p: any, i: number, arr: any[]) => i === 0 || p.time !== arr[i - 1].time);

    return NextResponse.json({ ok: true, points }, { status: 200 });
  } catch (e) {
    console.error("LINE_API_ERROR", e);
    return NextResponse.json({ ok: false, points: [] }, { status: 200 });
  }
}