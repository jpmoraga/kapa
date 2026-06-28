export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  createConsultingProspect,
  getConsultingPageData,
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
  const auth = await requireBackofficeSectionAccess("consulting");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const data = await getConsultingPageData({
    businessLine: searchParams.get("businessLine"),
    country: searchParams.get("country"),
    contactStatus: searchParams.get("contactStatus"),
    pipelineStage: searchParams.get("pipelineStage"),
    actionFilter: searchParams.get("actionFilter"),
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireBackofficeSectionAccess("consulting");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  try {
    const prospect = await createConsultingProspect(body, auth.user.id);
    return NextResponse.json({ ok: true, id: prospect.id }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
