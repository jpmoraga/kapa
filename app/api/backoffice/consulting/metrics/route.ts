export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getConsultingMetrics } from "@/lib/backofficeConsulting";
import { requireBackofficeSectionAccess } from "@/lib/backofficeAuth";

export async function GET() {
  const auth = await requireBackofficeSectionAccess("consulting");
  if (!auth.ok) return auth.response;

  const metrics = await getConsultingMetrics();
  return NextResponse.json(metrics);
}
