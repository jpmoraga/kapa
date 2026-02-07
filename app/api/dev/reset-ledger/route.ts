import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetLedgerFromBuda } from "@/lib/dev/resetLedgerFromBuda";
import { budaGetBalances } from "@/lib/buda";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const balances = await budaGetBalances();
  const started = Date.now();
  const out = await prisma.$transaction(async (tx) => resetLedgerFromBuda(tx, balances));
  console.info("PRISMA_TX", { op: "reset_ledger", ms: Date.now() - started });

  return NextResponse.json({ ok: true, ...out });
}
