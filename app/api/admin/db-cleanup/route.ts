// web/app/api/admin/db-cleanup/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { runDbCleanup } from "@/lib/dbCleanup";

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const result = await runDbCleanup(prisma, {
      qaEmailDomain: process.env.QA_EMAIL_DOMAIN ?? null,
    });
    console.log("DB_CLEANUP_RESULT", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("DB_CLEANUP_RESULT", { error: String(e?.message ?? e) });
    return NextResponse.json({ ok: false, message: "Cleanup failed" }, { status: 500 });
  }
}
