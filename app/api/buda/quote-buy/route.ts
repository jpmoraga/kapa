// web/app/api/buda/quote-buy/route.ts

import { NextResponse } from "next/server";

type BudaTickerResponse = {
  ticker: {
    last_price: [string, string]; // [precio, moneda]
  };
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { fiat_amount, currency = "CLP" } = body as {
      fiat_amount?: number;
      currency?: string;
    };

    if (!fiat_amount || typeof fiat_amount !== "number" || fiat_amount <= 0) {
      return NextResponse.json(
        { error: "fiat_amount debe ser un número mayor a 0" },
        { status: 400 }
      );
    }

    // 1) Pedimos el ticker directo a Buda
    const res = await fetch(
      "https://www.buda.com/api/v2/markets/btc-clp/ticker"
    );

    if (!res.ok) {
      console.error("Error al pedir ticker a Buda:", res.status);
      return NextResponse.json(
        { error: "No se pudo obtener el ticker de Buda" },
        { status: 502 }
      );
    }

    const json = (await res.json()) as BudaTickerResponse;
    const lastPriceStr = json.ticker.last_price[0]; // ej: "83148164.0"
    const lastPrice = parseFloat(lastPriceStr);

    if (!Number.isFinite(lastPrice) || lastPrice <= 0) {
      return NextResponse.json(
        { error: "Precio inválido recibido desde Buda" },
        { status: 500 }
      );
    }

    // 2) Calculamos BTC estimado
    const estimatedBtc = fiat_amount / lastPrice;

    return NextResponse.json({
      fiat_amount,
      currency,
      btc_price: lastPrice,
      estimated_btc: estimatedBtc,
    });
  } catch (err) {
    console.error("Error en /api/buda/quote-buy:", err);
    return NextResponse.json(
      { error: "Error interno al calcular cotización" },
      { status: 500 }
    );
  }
}