import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = (searchParams.get("marketId") ?? "btc-clp").toLowerCase();
    const limit = Number(searchParams.get("limit") ?? "500");

    // 1) best-effort: sincroniza un lote (no falla si Buda falla)
    try {
      const url = `https://www.buda.com/api/v2/markets/${marketId}/trades?limit=500`;
      const res = await fetch(url, { cache: "no-store", headers: { accept: "application/json" } });
      const json = await res.json();
      const entries = json?.trades?.entries ?? [];

      const data = entries
        .map((e: any[]) => ({
          marketId,
          timeMs: BigInt(e[0]),
          amount: e[1],
          price: e[2],
          direction: String(e[3] ?? ""),
        }))
        .filter((t: any) => t.direction === "buy" || t.direction === "sell");

      if (data.length) {
        await prisma.marketTrade.createMany({ data, skipDuplicates: true });
      }
    } catch {}

    // 2) ahora servimos desde DB
    const rows = await prisma.marketTrade.findMany({
      where: { marketId },
      orderBy: { timeMs: "desc" },
      take: limit,
    });

    const points = rows
      .map((r) => ({
        time: Math.floor(Number(r.timeMs) / 1000), // ms -> sec
        value: Number(r.price),
      }))
      .sort((a, b) => a.time - b.time);

    return NextResponse.json({ ok: true, points }, { status: 200 });
  } catch (e) {
    console.error("LINE_DB_API_ERROR", e);
    return NextResponse.json({ ok: false, points: [] }, { status: 200 });
  }
}