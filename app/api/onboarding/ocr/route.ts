import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OCR_DISABLED_MESSAGE =
  "OCR server-side no está habilitado. El onboarding no depende de OCR: sube tu documento y continúa con el flujo normal.";

function disabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      code: "OCR_DISABLED",
      required: false,
      error: OCR_DISABLED_MESSAGE,
    },
    { status: 410 }
  );
}

export async function GET() {
  return disabledResponse();
}

export async function POST() {
  return disabledResponse();
}
