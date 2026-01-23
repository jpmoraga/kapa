import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/internal/deposit-slip/reset
 * Body: { slipId: "<uuid>" }
 *
 * Resetea el slip para que vuelva a procesarse
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const slipId = body?.slipId;

    if (!slipId || typeof slipId !== "string") {
      return NextResponse.json({ error: "slipId requerido" }, { status: 400 });
    }

    const updated = await prisma.depositSlip.update({
      where: { id: slipId },
      data: {
        ocrStatus: "received",
        ocrText: null,
        parsedAmountClp: null,
        notes: "Reset manual para reprocesar y notificar",
      },
      select: { id: true, ocrStatus: true },
    });

    return NextResponse.json({ ok: true, result: updated });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}