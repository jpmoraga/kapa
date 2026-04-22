export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminPricingPageData } from "@/lib/adminCommercial";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");
  const q = url.searchParams.get("q");

  const result = await getAdminPricingPageData({ companyId, q });

  return NextResponse.json({
    ok: true,
    pricing: result,
  });
}
