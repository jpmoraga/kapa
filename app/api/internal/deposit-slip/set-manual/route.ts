import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/internal/deposit-slip/set-manual
 * Body: { slipId: "<uuid>", amountClp: number }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const slipId = body?.slipId;
    const amountClp = body?.amountClp;

    if (!slipId || typeof slipId !== "string") {
      return NextResponse.json({ error: "slipId requerido" }, { status: 400 });
    }
    if (typeof amountClp !== "number" || !Number.isFinite(amountClp) || amountClp <= 0) {
      return NextResponse.json({ error: "amountClp debe ser number > 0" }, { status: 400 });
    }

    const updated = await prisma.depositSlip.update({
      where: { id: slipId },
      data: {
        ocrStatus: "parsed",
        status: "approved",
        parsedAmountClp: BigInt(Math.round(amountClp)),
        notes: "Monto ingresado manualmente por admin.",
      },
      select: { id: true, ocrStatus: true, status: true }
    });

    return NextResponse.json({ ok: true, result: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error interno" }, { status: 500 });
  }
}