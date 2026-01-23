import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validate as isUuid } from "uuid";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawSlipId = body?.slipId;

    const slipId =
      typeof rawSlipId === "string"
        ? rawSlipId.trim().replace(/[<>"'`]/g, "")
        : null;

    if (!slipId) {
      return NextResponse.json({ error: "slipId requerido" }, { status: 400 });
    }

    if (!isUuid(slipId)) {
      return NextResponse.json({ error: "slipId inválido" }, { status: 400 });
    }

    // Marca manual y responde SIEMPRE
    const updated = await prisma.depositSlip.update({
      where: { id: slipId },
      data: {
        ocrStatus: "pending_manual",
      },
      select: { id: true, ocrStatus: true, status: true },
    });

    return NextResponse.json({ ok: true, slipId, result: updated, pendingManual: true });
  } catch (e: any) {
    console.error("DEPOSIT_SLIP_PROCESS_ERROR", e);
    return NextResponse.json({ error: e?.message ?? "process error" }, { status: 500 });
  }
}