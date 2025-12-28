import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const marketId = (searchParams.get("marketId") ?? "btc-clp").toLowerCase();
    const limit = Number(searchParams.get("limit") ?? "2000"); // puedes subir/bajar

    const url = `https://www.buda.com/api/v2/markets/${marketId}/trades?limit=${limit}`;
    const res = await fetch(url, { cache: "no-store", headers: { accept: "application/json" } });

    const json = await res.json();
    const entries = json?.trades?.entries ?? [];

    // entries: [ [timestamp(ms), amount, price, direction], ... ]
    const data = entries
      .map((e: any[]) => ({
        marketId,
        timeMs: BigInt(e[0]),
        amount: e[1],
        price: e[2],
        direction: String(e[3] ?? ""),
      }))
      .filter((t: any) => t.direction === "buy" || t.direction === "sell");

    if (data.length === 0) {
      return NextResponse.json({ ok: true, inserted: 0 });
    }

    // inserta en bloque y evita duplicados por el @@unique
    const r = await prisma.marketTrade.createMany({
      data,
      skipDuplicates: true,
    });

    return NextResponse.json({ ok: true, inserted: r.count });
    } catch (e: any) {
    console.error("SYNC_TRADES_ERROR", e);
  
    return NextResponse.json(
      {
        ok: false,
        inserted: 0,
        error: e?.message ?? String(e),
      },
      { status: 200 }
    );
  }
}