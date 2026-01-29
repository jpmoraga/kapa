export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { requireCanOperate } from "@/lib/guards/requireCanOperate";
import { approveMovementAsSystem } from "@/lib/treasury/approveMovement";
import {
  AssetCode,
  InternalMovementReason,
  InternalMovementState,
  TreasuryMovementStatus,
} from "@prisma/client";

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const can = await requireCanOperate(user.id);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });
  const role = String(membership?.role ?? "").toLowerCase();
  const isAdminOrOwner = role === "admin" || role === "owner";
  if (!isAdminOrOwner) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "25")));

  const pendings = await prisma.treasuryMovement.findMany({
    where: {
      companyId: activeCompanyId,
      status: TreasuryMovementStatus.PENDING,
      internalReason: InternalMovementReason.INSUFFICIENT_LIQUIDITY,
      internalState: InternalMovementState.WAITING_LIQUIDITY,
      assetCode: { in: [AssetCode.BTC, AssetCode.USD] },
      type: { in: ["deposit", "withdraw"] },
    },
    select: { id: true, companyId: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const claimed: Array<{ id: string; companyId: string }> = [];
  const failures: Array<{ id: string; error: string }> = [];
  let approved = 0;

  for (const m of pendings) {
    const updated = await prisma.treasuryMovement.updateMany({
      where: {
        id: m.id,
        companyId: activeCompanyId,
        status: TreasuryMovementStatus.PENDING,
        internalState: InternalMovementState.WAITING_LIQUIDITY,
        internalReason: InternalMovementReason.INSUFFICIENT_LIQUIDITY,
      },
      data: {
        internalState: InternalMovementState.RETRYING_BUDA,
        nextRetryAt: null,
        retryCount: { increment: 1 },
      },
    });

    if (!updated.count) continue;
    claimed.push(m);
    console.info("retry_pending_db:claimed", { movementId: m.id, companyId: m.companyId });
  }

  for (const m of claimed) {
    try {
      await approveMovementAsSystem({
        movementId: m.id,
        companyId: m.companyId,
        actorUserId: user.id,
        skipSync: true,
      });
      approved += 1;
      console.info("retry_pending_db:approved", { movementId: m.id, companyId: m.companyId });
    } catch (e: any) {
      const error = String(e?.message ?? "RETRY_ERROR");
      failures.push({ id: m.id, error });
      console.error("retry_pending_db:failed", { movementId: m.id, companyId: m.companyId, error });
    }
  }

  return NextResponse.json({
    ok: true,
    claimed: claimed.length,
    approved,
    failed: failures.length,
    failures,
  });
}
