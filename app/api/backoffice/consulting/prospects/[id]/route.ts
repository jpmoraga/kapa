export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  deleteConsultingProspect,
  getConsultingProspectById,
  updateConsultingProspect,
} from "@/lib/backofficeConsulting";
import { requireBackofficeSectionAccess } from "@/lib/backofficeAuth";

const BAD_REQUEST_MESSAGES: Record<string, string> = {
  invalid_business_line: "Línea de negocio inválida.",
  invalid_email_status: "Estado de email inválido.",
  invalid_contact_status: "Estado de contacto inválido.",
  invalid_pipeline_stage: "Etapa de pipeline inválida.",
  invalid_next_action_at: "Fecha de próxima acción inválida.",
  country_required: "País es obligatorio.",
  company_name_required: "Empresa es obligatoria.",
  contact_name_required: "Nombre de contacto es obligatorio.",
  contact_role_required: "Cargo de contacto es obligatorio.",
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
  const auth = await requireBackofficeSectionAccess("consulting");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const prospect = await getConsultingProspectById(id);
  if (!prospect) {
    return NextResponse.json({ error: "Prospecto no encontrado." }, { status: 404 });
  }

  return NextResponse.json(prospect);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireBackofficeSectionAccess("consulting");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const prospect = await updateConsultingProspect(id, body, auth.user.id);
    return NextResponse.json({ ok: true, id: prospect.id });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireBackofficeSectionAccess("consulting");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const prospect = await deleteConsultingProspect(id);
    return NextResponse.json({ ok: true, id: prospect.id });
  } catch (error) {
    return toErrorResponse(error);
  }
}
