import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // 1) Seguridad: solo permite llamadas del cron (o tuyas con la clave)
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET missing" }, { status: 500 });
  }

  if (auth !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2) Llama tu endpoint real que ya existe (sync-trades)
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://kapa-eight.vercel.app";
  const url = `${base}/api/market/sync-trades?marketId=btc-clp&limit=2000`;

  const r = await fetch(url, { cache: "no-store" });
  const data = await r.json();

  // 3) Respuesta del cron
  return NextResponse.json({ ok: true, ran: true, target: url, result: data });
}