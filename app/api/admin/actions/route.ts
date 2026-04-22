export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { listAdminActions } from "@/lib/adminActions";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");
  const q = url.searchParams.get("q");
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");

  const rows = await listAdminActions({ companyId, q, type, status });

  return NextResponse.json({
    ok: true,
    rows,
  });
}
