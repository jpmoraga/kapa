// web/app/api/buda/orders/route.ts
import { NextResponse } from "next/server";
import { budaCreateMarketOrder } from "@/lib/buda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Side = "Bid" | "Ask";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const side = String(body.side ?? "").trim() as Side; // "Bid" compra, "Ask" venta
  const amount = String(body.amount ?? "").trim();     // en BTC
  // clientId lo ignoramos por ahora (tu buda.ts no lo soporta aún)
  // const clientId = String(body.clientId ?? "").trim() || undefined;

  if (side !== "Bid" && side !== "Ask") {
    return NextResponse.json({ error: "side inválido (Bid|Ask)" }, { status: 400 });
  }
  if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: "amount inválido" }, { status: 400 });
  }

  try {
    const out = await budaCreateMarketOrder({
      marketId: "btc-clp",
      type: side,
      amount, // buda.ts lo envía como string (según tu implementación actual)
    });

    return NextResponse.json({ ok: true, buda: out });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "BUDA_ERROR" },
      { status: 500 }
    );
  }
}