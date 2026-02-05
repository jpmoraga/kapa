export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { approveClpDepositByMovement } from "@/lib/treasury/manualClpDeposits";
import { approveMovementAsSystem } from "@/lib/treasury/approveMovement";
import { randomUUID } from "crypto";
import { AssetCode, TreasuryMovementStatus } from "@prisma/client";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const correlationId =
    req.headers.get("x-correlation-id") ??
    req.headers.get("x-request-id") ??
    randomUUID();
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id: movementId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const amountClp = body?.amountClp ? Number(body.amountClp) : undefined;

  const movement = await prisma.treasuryMovement.findUnique({
    where: { id: movementId },
    select: {
      id: true,
      companyId: true,
      status: true,
      assetCode: true,
      type: true,
    },
  });

  if (!movement) {
    return NextResponse.json(
      { ok: false, code: "not_found", message: "Movimiento no existe" },
      { status: 404 }
    );
  }

  if (movement.status !== TreasuryMovementStatus.PENDING) {
    return NextResponse.json(
      { ok: false, code: "not_pending", message: "Movimiento no está pendiente" },
      { status: 409 }
    );
  }

  const adminEmail = admin.admin.email?.toLowerCase().trim();
  const adminUser = adminEmail
    ? await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } })
    : null;

  try {
    if (movement.assetCode === AssetCode.CLP && movement.type === "deposit") {
      const result = await approveClpDepositByMovement({
        movementId,
        companyId: movement.companyId,
        actorUserId: adminUser?.id ?? null,
        amountClp,
        channel: "admin",
        correlationId,
      });
      return NextResponse.json({ ok: true, result });
    }

    const result = await approveMovementAsSystem({
      movementId,
      companyId: movement.companyId,
      actorUserId: adminUser?.id ?? null,
      correlationId,
    });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error aprobando" }, { status: 400 });
  }
}
