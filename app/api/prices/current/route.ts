// web/app/api/prices/current/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssetCode, Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Pair = "BTC_CLP" | "USDT_CLP";

const TTL_SECONDS = 60; // cache DB para precios automáticos (buda): 60s
const MANUAL_TTL_SECONDS = 24 * 60 * 60; // manual vigente: 24h (ajústalo si quieres)

function normalizePair(input: string | null): Pair | null {
  const v = String(input ?? "").trim().toUpperCase();
  if (v === "BTC_CLP") return "BTC_CLP";
  if (v === "USDT_CLP") return "USDT_CLP";
  return null;
}

function pairMeta(pair: Pair) {
  if (pair === "BTC_CLP") {
    return {
      assetCode: AssetCode.BTC,
      quoteCode: AssetCode.CLP,
      marketId: "btc-clp",
      source: "buda",
    } as const;
  }
  // USDT_CLP -> lo guardamos como USD/CLP
  return {
    assetCode: AssetCode.USD,
    quoteCode: AssetCode.CLP,
    marketId: "usdt-clp",
    source: "buda-usdt",
  } as const;
}

function isManualSource(src: string | null | undefined) {
  const s = String(src ?? "").toLowerCase();
  // acepta "manual", "manual-test", "manual-xxx"
  return s.startsWith("manual");
}

function ageSecondsOf(d: Date) {
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
}

async function fetchBudaPrice(marketId: string): Promise<string> {
  const base = process.env.BUDA_API_BASE || "https://www.buda.com";
  const url = `${base}/api/v2/markets/${marketId}/ticker`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`BUDA_${res.status}`);

  const json = await res.json().catch(() => null);
  const last = json?.ticker?.last_price;
  const priceStr = Array.isArray(last) ? last[0] : null;

  const n = Number(String(priceStr ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) throw new Error("BAD_PRICE");

  return String(priceStr);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pair = normalizePair(url.searchParams.get("pair"));

  if (!pair) {
    return NextResponse.json(
      { error: "Missing/invalid pair. Use pair=BTC_CLP or pair=USDT_CLP" },
      { status: 400 }
    );
  }

  const { assetCode, quoteCode, marketId, source } = pairMeta(pair);

  // A) PRIORIDAD 1: MANUAL reciente (si existe)
  const manualSince = new Date(Date.now() - MANUAL_TTL_SECONDS * 1000);

  const manual = await prisma.priceSnapshot.findFirst({
    where: {
      assetCode,
      quoteCode,
      createdAt: { gte: manualSince },
      // no hay "startsWith" en Prisma para todos los providers de forma consistente en Decimal models,
      // así que filtramos por prefijo en JS: traemos el último y revisamos el source.
    },
    orderBy: { createdAt: "desc" },
    select: { price: true, source: true, createdAt: true },
  });

  if (manual && isManualSource(manual.source)) {
    const ageSeconds = ageSecondsOf(manual.createdAt);
    return NextResponse.json({
      ok: true,
      pair,
      assetCode,
      quoteCode,
      price: manual.price.toString(),
      source: manual.source,
      createdAt: manual.createdAt.toISOString(),
      cached: true,
      ageSeconds,
      stale: ageSeconds > MANUAL_TTL_SECONDS,
      sourcePriority: "manual",
    });
  }

  // B) PRIORIDAD 2: cache automático (buda) dentro del TTL
  const since = new Date(Date.now() - TTL_SECONDS * 1000);

  const cached = await prisma.priceSnapshot.findFirst({
    where: {
      assetCode,
      quoteCode,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    select: { price: true, source: true, createdAt: true },
  });

  if (cached) {
    const ageSeconds = ageSecondsOf(cached.createdAt);
    return NextResponse.json({
      ok: true,
      pair,
      assetCode,
      quoteCode,
      price: cached.price.toString(),
      source: cached.source,
      createdAt: cached.createdAt.toISOString(),
      cached: true,
      ageSeconds,
      stale: false,
      sourcePriority: isManualSource(cached.source) ? "manual" : "buda",
    });
  }

  // C) PRIORIDAD 3: fetch a Buda + guarda snapshot
  try {
    const priceStr = await fetchBudaPrice(marketId);

    const created = await prisma.priceSnapshot.create({
      data: {
        assetCode,
        quoteCode,
        price: new Prisma.Decimal(priceStr),
        source,
      },
      select: { price: true, source: true, createdAt: true },
    });

    const ageSeconds = ageSecondsOf(created.createdAt);

    return NextResponse.json({
      ok: true,
      pair,
      assetCode,
      quoteCode,
      price: created.price.toString(),
      source: created.source,
      createdAt: created.createdAt.toISOString(),
      cached: false,
      ageSeconds,
      stale: false,
      sourcePriority: "buda",
    });
  } catch (e: any) {
    // D) FALLBACK: último snapshot histórico (lo que haya, aunque sea viejo)
    const last = await prisma.priceSnapshot.findFirst({
      where: { assetCode, quoteCode },
      orderBy: { createdAt: "desc" },
      select: { price: true, source: true, createdAt: true },
    });

    if (last) {
      const ageSeconds = ageSecondsOf(last.createdAt);
      return NextResponse.json({
        ok: true,
        pair,
        assetCode,
        quoteCode,
        price: last.price.toString(),
        source: last.source,
        createdAt: last.createdAt.toISOString(),
        cached: true,
        ageSeconds,
        stale: true,
        sourcePriority: "db-fallback",
        warning: "Buda falló, devolviendo último snapshot guardado",
      });
    }

    return NextResponse.json(
      { error: "Price fetch failed and no cached snapshot exists" },
      { status: 500 }
    );
  }
}