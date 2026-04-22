export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminActionDetail } from "@/lib/adminActions";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const detail = await getAdminActionDetail(id);

  if (!detail) {
    return NextResponse.json({ ok: false, error: "Admin action no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    action: detail,
  });
}
