export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { issuePasswordResetForEmail } from "@/lib/passwordReset";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const result = await issuePasswordResetForEmail(email);

    console.info("auth:forgot_password", {
      email,
      delivered: result.delivered,
      reason: result.reason,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Si el correo existe en Kapa21, enviaremos instrucciones para restablecer la contraseña.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("auth:forgot_password_fail", { error: message });
    return NextResponse.json(
      {
        ok: true,
        message:
          "Si el correo existe en Kapa21, enviaremos instrucciones para restablecer la contraseña.",
      },
      { status: 200 }
    );
  }
}
