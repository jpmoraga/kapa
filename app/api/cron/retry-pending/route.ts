export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TreasuryMovementStatus } from "@prisma/client";
import { approveMovementAsSystem } from "@/lib/treasury/approveMovement";
import { syncSystemWalletAndRetry } from "@/lib/syncSystemWallet";

export async function POST(req: Request) {
  // 🔒 protección simple con secret
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ quién aparece como approvedBy: usa tu primer admin/owner (MVP)
  const actor = await prisma.user.findFirst({ select: { id: true } });
  if (!actor) return NextResponse.json({ error: "No users found" }, { status: 500 });

  const batch = Number(process.env.CRON_RETRY_BATCH ?? "20");

  // ✅ sincroniza pool y reintenta pendientes por liquidez
  await syncSystemWalletAndRetry();

  const pendings = await prisma.treasuryMovement.findMany({
    where: { status: TreasuryMovementStatus.PENDING },
    orderBy: { createdAt: "asc" },
    take: batch,
    select: { id: true, companyId: true },
  });

  const results: any[] = [];

  for (const m of pendings) {
    try {
      const r = await approveMovementAsSystem({
        movementId: m.id,
        companyId: m.companyId,
        actorUserId: actor.id,
      });
      results.push({ id: m.id, ok: true, venue: (r as any).venue });
    } catch (e: any) {
      // ✅ no exponemos razón al cliente; acá solo dejamos log interno
      results.push({ id: m.id, ok: false, error: String(e?.message ?? "ERROR") });
    }
  }

  return NextResponse.json({
    ok: true,
    tried: pendings.length,
    results,
  });
}
