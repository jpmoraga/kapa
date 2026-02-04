export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    email: auth.admin.email,
    role: auth.admin.role,
  });
}
