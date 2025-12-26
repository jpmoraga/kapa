// web/app/api/buda/orders/route.ts
import { NextResponse } from "next/server";
import { budaPrivateRequest } from "@/lib/buda";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// MVP: solo BTC_CLP
type Side = "Bid" | "Ask";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const side = String(body.side ?? "").trim() as Side; // "Bid" compra, "Ask" venta
  const amount = String(body.amount ?? "").trim();     // en BTC (base currency)
  const clientId = String(body.clientId ?? "").trim() || undefined;

  if (side !== "Bid" && side !== "Ask") {
    return NextResponse.json({ error: "side inválido (Bid|Ask)" }, { status: 400 });
  }
  if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: "amount inválido" }, { status: 400 });
  }

  const marketId = "btc-clp";

  // POST /api/v2/markets/{market_id}/orders
  // Body típico: { type: "Bid|Ask", price_type: "market", amount: ["0.01","BTC"], client_id?: "..." }
  const payload: any = {
    type: side,
    price_type: "market",
    amount: [amount, "BTC"],
  };
  if (clientId) payload.client_id = clientId;

  try {
    const out = await budaPrivateRequest<any>(
      "POST",
      `/api/v2/markets/${marketId}/orders`,
      payload
    );

    return NextResponse.json({ ok: true, buda: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "BUDA_ERROR" }, { status: 500 });
  }
}