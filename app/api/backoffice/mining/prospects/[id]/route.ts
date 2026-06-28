export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  getMiningProspectById,
  updateMiningProspect,
} from "@/lib/backofficeMining";
import { requireBackofficeSectionAccess } from "@/lib/backofficeAuth";

const BAD_REQUEST_MESSAGES: Record<string, string> = {
  name_required: "Nombre es obligatorio.",
  invalid_source: "Origen inválido.",
  invalid_interest_type: "Modalidad inválida.",
  invalid_status: "Estado inválido.",
  invalid_estimated_amount_usd: "Monto estimado USD inválido.",
  invalid_next_action_at: "Fecha de próxima acción inválida.",
  prospect_not_found: "Prospecto no encontrado.",
};

function toErrorResponse(error: unknown) {
  if (error instanceof Error && BAD_REQUEST_MESSAGES[error.message]) {
    const status = error.message === "prospect_not_found" ? 404 : 400;
    return NextResponse.json(
      { error: BAD_REQUEST_MESSAGES[error.message] },
      { status }
    );
  }

  return NextResponse.json(
    { error: "No fue posible procesar el prospecto." },
    { status: 500 }
  );
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireBackofficeSectionAccess("mining");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const prospect = await getMiningProspectById(id);
  if (!prospect) {
    return NextResponse.json({ error: "Prospecto no encontrado." }, { status: 404 });
  }

  return NextResponse.json(prospect);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireBackofficeSectionAccess("mining");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const prospect = await updateMiningProspect(id, body, auth.user.id);
    return NextResponse.json({ ok: true, id: prospect.id });
  } catch (error) {
    return toErrorResponse(error);
  }
}
