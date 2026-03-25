import { NextResponse } from "next/server";
import { parseTreasuryReviewApplicationPayload } from "@/app/tesoreria-kapa21-biterva/_lib/treasuryReviewApplication";
import { insertTreasuryReviewApplication } from "@/lib/treasuryReviewApplications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "No pudimos procesar tu postulación. Intenta nuevamente." },
      { status: 400 }
    );
  }

  const parsed = parseTreasuryReviewApplicationPayload(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const payload = parsed.data;

  try {
    const record = await insertTreasuryReviewApplication(payload);

    if (!record?.id) {
      console.error("treasury_review_applications_insert_failed", {
        message: "Insert completed without returning an id",
      });

      return NextResponse.json(
        { error: "No pudimos guardar tu postulación en este momento. Intenta nuevamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: record.id });
  } catch (error) {
    console.error("treasury_review_applications_insert_failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "No pudimos guardar tu postulación en este momento. Intenta nuevamente." },
      { status: 500 }
    );
  }
}
