// web/app/api/admin/system-wallet/snapshot/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const latest = await prisma.systemWalletSnapshot.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return NextResponse.json({ ok: true, snapshot: null });
  }

  return NextResponse.json({
    ok: true,
    snapshot: latest.payload,
    at: latest.at.toISOString(),
    createdAt: latest.createdAt.toISOString(),
  });
}
