// web/app/api/admin/system-wallet/resync/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { syncSystemWalletFromBuda } from "@/lib/syncSystemWallet";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const started = Date.now();

  try {
    const result = await syncSystemWalletFromBuda();
    console.info("SYSTEM_WALLET_RESYNC", { ms: Date.now() - started, ok: true });
    return NextResponse.json({
      ok: true,
      at: new Date().toISOString(),
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
