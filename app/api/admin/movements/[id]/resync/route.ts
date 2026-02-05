// web/app/api/admin/movements/[id]/resync/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { approveMovementAsSystem } from "@/lib/treasury/approveMovement";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: movementId } = await context.params;
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const movement = await prisma.treasuryMovement.findUnique({
    where: { id: movementId },
    select: { companyId: true, assetCode: true, status: true, type: true, amount: true },
  });
  if (!movement) {
    return NextResponse.json(
      { ok: false, code: "not_found", message: "Movimiento no existe", error: "Movimiento no existe" },
      { status: 404 }
    );
  }

  const statusValue = String(movement.status ?? "").toUpperCase();
  const assetCode = String(movement.assetCode ?? "").toUpperCase();
  const typeValue = String(movement.type ?? "").toLowerCase();

  const isTradeAsset = assetCode === "BTC" || assetCode === "USD";
  const isResyncStatus = statusValue === "PENDING" || statusValue === "PROCESSING";

  if (!isTradeAsset) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_trade_asset",
        message: "Resync aplica solo a BTC o USD.",
        error: "Resync aplica solo a BTC o USD.",
      },
      { status: 400 }
    );
  }

  if (!isResyncStatus) {
    return NextResponse.json(
      {
        ok: false,
        code: "status_not_resyncable",
        message: "Resync solo aplica a movimientos PENDING o PROCESSING.",
        error: "Resync solo aplica a movimientos PENDING o PROCESSING.",
      },
      { status: 400 }
    );
  }

  const missingFields: string[] = [];
  if (!typeValue || (typeValue !== "deposit" && typeValue !== "withdraw")) {
    missingFields.push("type(deposit|withdraw)");
  }
  if (movement.amount == null) {
    missingFields.push("amount");
  }

  if (missingFields.length) {
    return NextResponse.json(
      {
        ok: false,
        code: "legacy_movement_missing_fields",
        message: "Movimiento legacy incompleto para resync.",
        error: "Movimiento legacy incompleto para resync.",
        details: { missingFields },
      },
      { status: 409 }
    );
  }

  void approveMovementAsSystem({
    movementId,
    companyId: movement.companyId,
    actorUserId: null,
  }).catch((e: any) => {
    console.error("ADMIN_RESYNC_ERROR", e);
  });

  return NextResponse.json({
    ok: true,
    code: "resync_queued",
    message: "Resync encolado.",
  });
}
