export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { randomUUID } from "crypto";
import { InternalMovementState, TreasuryMovementStatus } from "@prisma/client";

function appendInternalNote(existing: string | null | undefined, marker: string) {
  if (!existing) return marker;
  if (existing.includes(marker)) return existing;
  return `${existing} | ${marker}`;
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const correlationId =
    _req.headers.get("x-correlation-id") ??
    _req.headers.get("x-request-id") ??
    randomUUID();
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id: movementId } = await context.params;

  try {
    const movement = await prisma.treasuryMovement.findUnique({
      where: { id: movementId },
      select: { id: true, status: true, internalNote: true },
    });

    if (!movement) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Movimiento no existe" },
        { status: 404 }
      );
    }

    if (movement.status === TreasuryMovementStatus.REJECTED) {
      return NextResponse.json({
        ok: true,
        code: "already_rejected",
        message: "Movimiento ya rechazado.",
        movementId,
      });
    }

    if (movement.status !== TreasuryMovementStatus.PENDING) {
      return NextResponse.json(
        { ok: false, code: "not_pending", message: "Movimiento no está pendiente" },
        { status: 409 }
      );
    }

    const internalNote = appendInternalNote(movement.internalNote, "ADMIN_REJECTED");

    await prisma.treasuryMovement.update({
      where: { id: movementId },
      data: {
        status: TreasuryMovementStatus.REJECTED,
        internalState: InternalMovementState.FAILED_TEMPORARY,
        lastError: "Rejected by admin",
        retryCount: 0,
        nextRetryAt: null,
        internalNote,
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      code: "rejected",
      message: "Movimiento rechazado.",
      movementId,
      correlationId,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error rechazando" }, { status: 400 });
  }
}
