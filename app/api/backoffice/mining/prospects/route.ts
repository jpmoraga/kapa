export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createMiningProspect, getMiningPageData } from "@/lib/backofficeMining";
import { requireBackofficeSectionAccess } from "@/lib/backofficeAuth";

const BAD_REQUEST_MESSAGES: Record<string, string> = {
  name_required: "Nombre es obligatorio.",
  invalid_source: "Origen inválido.",
  invalid_interest_type: "Modalidad inválida.",
  invalid_status: "Estado inválido.",
  invalid_estimated_amount_usd: "Monto estimado USD inválido.",
  invalid_next_action_at: "Fecha de próxima acción inválida.",
};

function toErrorResponse(error: unknown) {
  if (error instanceof Error && BAD_REQUEST_MESSAGES[error.message]) {
    return NextResponse.json(
      { error: BAD_REQUEST_MESSAGES[error.message] },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: "No fue posible procesar el prospecto." },
    { status: 500 }
  );
}

export async function GET(req: Request) {
  const auth = await requireBackofficeSectionAccess("mining");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const data = await getMiningPageData({
    source: searchParams.get("source"),
    interestType: searchParams.get("interestType"),
    status: searchParams.get("status"),
    country: searchParams.get("country"),
    actionFilter: searchParams.get("actionFilter"),
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireBackofficeSectionAccess("mining");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  try {
    const prospect = await createMiningProspect(body, auth.user.id);
    return NextResponse.json({ ok: true, id: prospect.id }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
