// web/app/api/admin/overview/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { Prisma, TreasuryMovementStatus } from "@prisma/client";

type RangeKey = "7d" | "30d" | "90d" | "all";

const RANGE_SET = new Set<RangeKey>(["7d", "30d", "90d", "all"]);

function parseRange(value: string | null): RangeKey {
  if (value && RANGE_SET.has(value as RangeKey)) return value as RangeKey;
  return "7d";
}

function rangeStart(range: RangeKey): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function deriveSide(typeRaw?: string | null, assetRaw?: string | null) {
  const type = String(typeRaw ?? "").toLowerCase();
  const asset = String(assetRaw ?? "").toUpperCase();
  if (type === "buy" || type === "sell") return type;
  if ((asset === "BTC" || asset === "USD") && type === "deposit") return "buy";
  if ((asset === "BTC" || asset === "USD") && type === "withdraw") return "sell";
  if (type) return type;
  return "unknown";
}

function addDecimal(map: Record<string, Prisma.Decimal>, key: string, amount: Prisma.Decimal) {
  if (!map[key]) map[key] = new Prisma.Decimal(0);
  map[key] = map[key].plus(amount);
}

function addNestedDecimal(
  map: Record<string, Record<string, Prisma.Decimal>>,
  outerKey: string,
  innerKey: string,
  amount: Prisma.Decimal
) {
  if (!map[outerKey]) map[outerKey] = {};
  addDecimal(map[outerKey], innerKey, amount);
}

function toStringMap(map: Record<string, Prisma.Decimal>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(map)) {
    out[key] = value.toString();
  }
  return out;
}

function toNestedStringMap(map: Record<string, Record<string, Prisma.Decimal>>) {
  const out: Record<string, Record<string, string>> = {};
  for (const [outerKey, inner] of Object.entries(map)) {
    out[outerKey] = toStringMap(inner);
  }
  return out;
}

async function loadSystemWallet() {
  const systemCompany = await prisma.company.findFirst({
    where: { name: "__SYSTEM_WALLET__" },
    select: { id: true },
  });

  if (!systemCompany) {
    return {
      available: false,
      note: "No explicit system wallet entity found in DB",
    } as const;
  }

  const accounts = await prisma.treasuryAccount.findMany({
    where: { companyId: systemCompany.id },
    select: { assetCode: true, balance: true },
    orderBy: { assetCode: "asc" },
  });

  const balances: Record<string, string> = {};
  for (const acc of accounts) {
    balances[acc.assetCode] = acc.balance?.toString?.() ?? "0";
  }

  return { available: true, balances } as const;
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const url = new URL(req.url);
  const range = parseRange(url.searchParams.get("range"));
  const start = rangeStart(range);

  const feeWhere: any = {
    status: TreasuryMovementStatus.APPROVED,
  };

  if (start) {
    feeWhere.OR = [
      { executedAt: { gte: start } },
      { executedAt: null, createdAt: { gte: start } },
    ];
  }

  const [systemWallet, feeRows, recentRows] = await Promise.all([
    loadSystemWallet(),
    prisma.treasuryMovement.findMany({
      where: feeWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        assetCode: true,
        createdAt: true,
        executedAt: true,
        executedFeeAmount: true,
        executedFeeCode: true,
        executedQuoteCode: true,
      },
    }),
    prisma.treasuryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        executedAt: true,
        status: true,
        type: true,
        assetCode: true,
        executedQuoteCode: true,
        executedFeeAmount: true,
        executedFeeCode: true,
      },
    }),
  ]);

  const totalsByCurrency: Record<string, Prisma.Decimal> = {};
  const bySide: Record<string, Record<string, Prisma.Decimal>> = {};
  const byBaseAsset: Record<string, Record<string, Prisma.Decimal>> = {};

  for (const row of feeRows) {
    const feeAmount = row.executedFeeAmount ? new Prisma.Decimal(row.executedFeeAmount) : null;
    const feeCurrency = row.executedFeeCode ? String(row.executedFeeCode).toUpperCase() : null;

    if (!feeAmount || !feeCurrency) continue;

    const side = deriveSide(row.type, row.assetCode);
    const baseAsset = String(row.assetCode ?? "").toUpperCase() || "UNKNOWN";

    addDecimal(totalsByCurrency, feeCurrency, feeAmount);
    addNestedDecimal(bySide, side, feeCurrency, feeAmount);
    addNestedDecimal(byBaseAsset, baseAsset, feeCurrency, feeAmount);
  }

  const recentMovements = recentRows.map((row) => {
    const feeAmount = row.executedFeeAmount ? row.executedFeeAmount.toString() : null;
    const feeCurrency = row.executedFeeCode ? String(row.executedFeeCode) : null;
    const baseAsset = row.assetCode ? String(row.assetCode) : null;

    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      executedAt: row.executedAt?.toISOString() ?? null,
      status: String(row.status ?? ""),
      side: deriveSide(row.type, row.assetCode),
      type: row.type ?? null,
      assetCode: row.assetCode ?? null,
      baseAsset,
      quoteAsset: row.executedQuoteCode ?? null,
      feeAmount,
      feeCurrency,
    };
  });

  return NextResponse.json({
    ok: true,
    systemWallet,
    fees: {
      range,
      totalsByCurrency: toStringMap(totalsByCurrency),
      bySide: toNestedStringMap(bySide),
      byBaseAsset: toNestedStringMap(byBaseAsset),
    },
    recentMovements,
  });
}
