export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: loanId } = await context.params;
  const body = await req.json().catch(() => null);
  const sats = Number(body?.sats);

  if (!Number.isFinite(sats) || !Number.isInteger(sats) || sats <= 0) {
    return NextResponse.json(
      { ok: false, error: "Sats inválidos", code: "INVALID_SATS" },
      { status: 400 }
    );
  }

  console.info("LOAN_COLLATERAL_STUB", { loanId, sats, action: "withdraw" });
  return NextResponse.json({ ok: true });
}
