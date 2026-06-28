export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { promoteMiningProspectToOperation } from "@/lib/backofficeMiningOperations";
import { requireBackofficeSectionAccess } from "@/lib/backofficeAuth";

const BAD_REQUEST_MESSAGES: Record<string, string> = {
  prospect_not_found: "Prospecto no encontrado.",
};

function toErrorResponse(error: unknown) {
  if (error instanceof Error && BAD_REQUEST_MESSAGES[error.message]) {
    return NextResponse.json(
      { error: BAD_REQUEST_MESSAGES[error.message] },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { error: "No fue posible promover el prospecto." },
    { status: 500 }
  );
}

export async function POST(req: Request) {
  const auth = await requireBackofficeSectionAccess("mining");
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as { prospectId?: unknown } | null;
  const prospectId =
    body && typeof body === "object" && typeof body.prospectId === "string"
      ? body.prospectId
      : null;

  if (!prospectId) {
    return NextResponse.json({ error: "Prospecto inválido." }, { status: 400 });
  }

  try {
    const result = await promoteMiningProspectToOperation(prospectId, auth.user.id);
    return NextResponse.json({ ok: true, id: result.id, created: result.created });
  } catch (error) {
    return toErrorResponse(error);
  }
}
