// web/app/api/admin/system-wallet/resync/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { syncSystemWalletFromBuda } from "@/lib/syncSystemWallet";
import { prisma } from "@/lib/prisma";

function toStringValue(value: any) {
  if (value === null || value === undefined) return "0";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return value.toString();
  if (typeof value === "object" && typeof value.toString === "function") return value.toString();
  return String(value);
}

function normalizeBucket(bucket: any) {
  return {
    clp: toStringValue(bucket?.clp ?? "0"),
    btc: toStringValue(bucket?.btc ?? "0"),
    usd: toStringValue(bucket?.usd ?? "0"),
  };
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const started = Date.now();

  try {
    const result = await syncSystemWalletFromBuda();
    const at = new Date();
    const payload = {
      at: at.toISOString(),
      systemCompanyId: result?.systemCompanyId ?? null,
      buda: normalizeBucket(result?.buda),
      clients: normalizeBucket(result?.clients),
      system: normalizeBucket(result?.system),
    };

    await prisma.systemWalletSnapshot.create({
      data: {
        at,
        payload,
      },
    });

    console.info("SYSTEM_WALLET_RESYNC", { ms: Date.now() - started, ok: true });
    return NextResponse.json({
      ok: true,
      at: at.toISOString(),
      result,
      message: "Resync ejecutado",
    });
  } catch (e: any) {
    console.info("SYSTEM_WALLET_RESYNC", {
      ms: Date.now() - started,
      ok: false,
      error: String(e?.message ?? e),
    });
    return NextResponse.json(
      {
        ok: false,
        at: new Date().toISOString(),
        message: "Resync fallido",
        error: String(e?.message ?? e),
      },
      { status: 500 }
    );
  }
}
