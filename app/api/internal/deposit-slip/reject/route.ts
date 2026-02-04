import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { rejectClpDepositBySlip } from "@/lib/treasury/manualClpDeposits";

export const runtime = "nodejs";

/**
 * POST /api/internal/deposit-slip/reject
 * Body: { slipId: "<uuid>" }
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const body = await req.json().catch(() => ({}));
    const slipId = body?.slipId;

    if (!slipId || typeof slipId !== "string") {
      return NextResponse.json({ error: "slipId requerido" }, { status: 400 });
    }

    const result = await rejectClpDepositBySlip({
      slipId,
      channel: "admin",
      actorUserId: null,
    });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error interno" }, { status: 500 });
  }
}
