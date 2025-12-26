import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetLedgerFromBuda } from "@/lib/dev/resetLedgerFromBuda";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const out = await prisma.$transaction(async (tx) => {
    return resetLedgerFromBuda(tx);
  });

  return NextResponse.json({ ok: true, ...out });
}