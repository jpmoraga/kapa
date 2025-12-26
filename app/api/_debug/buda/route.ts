import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    buda: process.env.BUDA_API_BASE ?? null,
  });
}