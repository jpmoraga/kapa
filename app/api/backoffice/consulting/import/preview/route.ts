export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBackofficeSectionAccess } from "@/lib/backofficeAuth";
import { previewConsultingCsvImport } from "@/lib/backofficeConsultingImport";

const BAD_REQUEST_MESSAGES: Record<string, string> = {
  csv_empty: "Debes subir o pegar contenido CSV.",
  csv_too_large: "El CSV es demasiado grande para este importador.",
  csv_unclosed_quote: "El CSV tiene comillas sin cerrar.",
  csv_no_data: "El CSV no contiene filas de datos.",
};

function toErrorResponse(error: unknown) {
  if (error instanceof Error && BAD_REQUEST_MESSAGES[error.message]) {
    return NextResponse.json({ error: BAD_REQUEST_MESSAGES[error.message] }, { status: 400 });
  }

  return NextResponse.json(
    { error: "No fue posible generar la preview del CSV." },
    { status: 500 }
  );
}

export async function POST(req: Request) {
  const auth = await requireBackofficeSectionAccess("consulting");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const csvText = typeof body?.csvText === "string" ? body.csvText : "";

  try {
    const preview = await previewConsultingCsvImport(csvText);
    return NextResponse.json(preview);
  } catch (error) {
    return toErrorResponse(error);
  }
}
