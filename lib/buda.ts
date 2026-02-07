// web/lib/buda.ts
import crypto from "crypto";

const BUDA_BASE = process.env.BUDA_API_BASE || "https://www.buda.com";
const API_KEY = process.env.BUDA_API_KEY;
const API_SECRET = process.env.BUDA_API_SECRET;

function nonceMicros() {
  return String(Math.floor(Date.now() * 1000));
}

function base64Body(body?: string) {
  return Buffer.from(body ?? "", "utf8").toString("base64");
}

function signMessage(method: string, pathUrl: string, body: string | null, nonce: string) {
  const parts = [method.toUpperCase(), pathUrl];
  if (body) parts.push(body);
  parts.push(nonce);
  const msg = parts.join(" ");
  return crypto.createHmac("sha384", API_SECRET as string).update(msg).digest("hex");
}

type BudaOrderType = "Bid" | "Ask";

export async function budaCreateMarketOrder(params: {
  marketId: string;
  type: BudaOrderType;
  amount: string;
}) {
  if (!API_KEY || !API_SECRET) throw new Error("MISSING_BUDA_KEYS");

  const pathUrl = `/api/v2/markets/${params.marketId}/orders`;
  const url = `${BUDA_BASE}${pathUrl}`;

  const bodyObj = {
    type: params.type,
    price_type: "market",
    amount: params.amount, // ✅ mantener string exacto "0.00123456"
  };

  const bodyStr = JSON.stringify(bodyObj);
  const nonce = nonceMicros();
  const encodedBody = base64Body(bodyStr);
  const signature = signMessage("POST", pathUrl, encodedBody, nonce);

  const started = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SBTC-APIKEY": API_KEY,
      "X-SBTC-NONCE": nonce,
      "X-SBTC-SIGNATURE": signature,
    },
    body: bodyStr,
    cache: "no-store",
  });
  console.info("BUDA_FETCH", { path: pathUrl, ms: Date.now() - started });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error || json?.message || `BUDA_${res.status}`;
    console.warn("BUDA_ERROR", {
      path: pathUrl,
      status: res.status,
      nonce,
      isBadNonce: /bad_nonce|not_authorized/i.test(String(msg)),
    });
    throw new Error(`${msg} | payload=${JSON.stringify(json)}`);
  }
  return json;
}

// ✅ NUEVO: obtener orden por ID
export async function budaGetOrder(orderId: string) {
  if (!API_KEY || !API_SECRET) throw new Error("MISSING_BUDA_KEYS");

  const pathUrl = `/api/v2/orders/${orderId}`;
  const url = `${BUDA_BASE}${pathUrl}`;

  const nonce = nonceMicros();
  const signature = signMessage("GET", pathUrl, null, nonce);

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-SBTC-APIKEY": API_KEY,
      "X-SBTC-NONCE": nonce,
      "X-SBTC-SIGNATURE": signature,
    },
    cache: "no-store",
  });
  console.info("BUDA_FETCH", { path: pathUrl, ms: Date.now() - started });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error || json?.message || `BUDA_${res.status}`;
    console.warn("BUDA_ERROR", {
      path: pathUrl,
      status: res.status,
      nonce,
      isBadNonce: /bad_nonce|not_authorized/i.test(String(msg)),
    });
    throw new Error(`${msg} | payload=${JSON.stringify(json)}`);
  }
  return json;
}

// ✅ NUEVO: obtener balances desde Buda (empresa)
// Devuelve un map por moneda: { CLP: DecimalString, BTC: DecimalString, USDT: DecimalString }
export async function budaGetBalances() { 
  if (!API_KEY || !API_SECRET) throw new Error("MISSING_BUDA_KEYS");

  const pathUrl = `/api/v2/balances`;
  const url = `${BUDA_BASE}${pathUrl}`;

  const nonce = nonceMicros();
  const signature = signMessage("GET", pathUrl, null, nonce);

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-SBTC-APIKEY": API_KEY,
      "X-SBTC-NONCE": nonce,
      "X-SBTC-SIGNATURE": signature,
    },
    cache: "no-store",
  });
  console.info("BUDA_FETCH", { path: pathUrl, ms: Date.now() - started });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error || json?.message || `BUDA_${res.status}`;
    console.warn("BUDA_ERROR", {
      path: pathUrl,
      status: res.status,
      nonce,
      isBadNonce: /bad_nonce|not_authorized/i.test(String(msg)),
    });
    throw new Error(`${msg} | payload=${JSON.stringify(json)}`);
  }

  // Forma típica: { balances: [{ id:"clp", available_amount:["123.0","CLP"], ... }, ...] }
  const out: Record<string, string> = {};

  const balances = json?.balances ?? json?.data?.balances ?? [];
  for (const b of balances) {
    const id = String(b?.id ?? b?.currency ?? "").toUpperCase();
    const amtArr = b?.available_amount ?? b?.available ?? b?.amount ?? null;

    // Si viene ["123.45","CLP"]
    if (Array.isArray(amtArr) && amtArr.length >= 1) {
      out[id] = String(amtArr[0]);
      continue;
    }

    // Si viene como string/number
    if (amtArr != null) {
      out[id] = String(amtArr);
    }
  }

  return { raw: json, byCurrency: out };
}

// ✅ NUEVO: OHLC para gráficos (Buda)
export async function budaGetOHLC(params: {
  marketId: string;        // "btc-clp"
  sinceMs: number;         // epoch ms
  untilMs: number;         // epoch ms
  granularity: string;     // "5m" | "1h" | "4h" | "1d" (MVP)
}) {
  if (!API_KEY || !API_SECRET) throw new Error("MISSING_BUDA_KEYS");

  const pathUrl = `/api/v2/markets/${params.marketId}/candles?since=${params.sinceMs}&until=${params.untilMs}&granularity=${params.granularity}`;
  const url = `${BUDA_BASE}${pathUrl}`;

  const nonce = nonceMicros();
  const signature = signMessage("GET", pathUrl, null, nonce);

  const started = Date.now();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-SBTC-APIKEY": API_KEY,
      "X-SBTC-NONCE": nonce,
      "X-SBTC-SIGNATURE": signature,
    },
    cache: "no-store",
  });
  console.info("BUDA_FETCH", { path: pathUrl, ms: Date.now() - started });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error || json?.message || `BUDA_${res.status}`;
    console.warn("BUDA_ERROR", {
      path: pathUrl,
      status: res.status,
      nonce,
      isBadNonce: /bad_nonce|not_authorized/i.test(String(msg)),
    });
    throw new Error(`${msg} | payload=${JSON.stringify(json)}`);
  }

  // Formato Buda típico: { candles: [ [time, open, high, low, close, volume], ... ] }
  const rows = json?.candles ?? json?.data?.candles ?? [];

  return rows.map((r: any[]) => ({
    time: Math.floor(Number(r?.[0]) / 1000), // lightweight-charts usa UNIX seconds
    open: Number(r?.[1]),
    high: Number(r?.[2]),
    low: Number(r?.[3]),
    close: Number(r?.[4]),
    volume: Number(r?.[5] ?? 0),
  }));
}
