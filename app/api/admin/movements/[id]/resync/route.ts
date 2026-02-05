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
    select: { companyId: true },
  });
  if (!movement) {
    return NextResponse.json({ error: "Movimiento no existe" }, { status: 404 });
  }

  void approveMovementAsSystem({
    movementId,
    companyId: movement.companyId,
    actorUserId: null,
  }).catch((e: any) => {
    console.error("ADMIN_RESYNC_ERROR", e);
  });

  return NextResponse.json({ ok: true });
}
