import { NextResponse } from "next/server";

import {
  MAX_MINING_SIMULATION_REQUEST_BYTES,
  MiningSimulationEventValidationError,
  createMiningSimulationEvent,
} from "@/lib/miningSimulationEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    {
      ok: false,
      error,
    },
    { status },
  );
}

export async function POST(req: Request) {
  const rawBody = await req.text().catch(() => "");

  if (!rawBody) {
    return errorResponse("Payload inválido.", 400);
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_MINING_SIMULATION_REQUEST_BYTES) {
    return errorResponse("Payload demasiado grande.", 413);
  }

  try {
    const body = JSON.parse(rawBody) as unknown;
    const event = await createMiningSimulationEvent(body);

    return NextResponse.json(
      {
        ok: true,
        id: event.id,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return errorResponse("Payload inválido.", 400);
    }

    if (error instanceof MiningSimulationEventValidationError) {
      return errorResponse(error.message, 400);
    }

    console.error("Failed to create mining simulation event", error);

    return errorResponse("No fue posible guardar el evento.", 500);
  }
}
