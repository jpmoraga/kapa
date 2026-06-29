export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { requireBackofficeSectionAccess } from "@/lib/backofficeAuth";
import { commitConsultingCsvImport } from "@/lib/backofficeConsultingImport";

const BAD_REQUEST_MESSAGES: Record<string, string> = {
  csv_empty: "Debes subir o pegar contenido CSV.",
  csv_too_large: "El CSV es demasiado grande para este importador.",
  csv_unclosed_quote: "El CSV tiene comillas sin cerrar.",
  csv_no_data: "El CSV no contiene filas de datos.",
};

function emptyCommitPayload(error: string) {
  return {
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    rowErrors: [],
    omitted: 0,
    errors: [],
    error,
  };
}

function toErrorResponse(error: unknown) {
  if (error instanceof Error && BAD_REQUEST_MESSAGES[error.message]) {
    return NextResponse.json(emptyCommitPayload(BAD_REQUEST_MESSAGES[error.message]), { status: 400 });
  }

  return NextResponse.json(
    emptyCommitPayload("No fue posible confirmar la importación del CSV."),
    { status: 500 }
  );
}

export async function POST(req: Request) {
  const auth = await requireBackofficeSectionAccess("consulting");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(emptyCommitPayload("Payload inválido."), { status: 400 });
  }

  const csvText = typeof body.csvText === "string" ? body.csvText : "";
  const mode = typeof body.mode === "string" ? body.mode : "create_only";

  try {
    const result = await commitConsultingCsvImport(csvText, mode, auth.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
