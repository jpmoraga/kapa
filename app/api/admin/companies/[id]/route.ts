export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminCompanyDetail } from "@/lib/companyLifecycle";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const company = await getAdminCompanyDetail(id);

  if (!company) {
    return NextResponse.json({ ok: false, error: "Empresa no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, company });
}
