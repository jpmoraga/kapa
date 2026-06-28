export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getMiningMetrics } from "@/lib/backofficeMining";
import { requireBackofficeSectionAccess } from "@/lib/backofficeAuth";

export async function GET() {
  const auth = await requireBackofficeSectionAccess("mining");
  if (!auth.ok) return auth.response;

  const metrics = await getMiningMetrics();
  return NextResponse.json(metrics);
}
