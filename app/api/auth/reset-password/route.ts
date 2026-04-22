export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/passwordReset";

function resetErrorMessage(reason: string) {
  switch (reason) {
    case "missing_token":
      return "Falta el token de recuperación.";
    case "weak_password":
      return "La nueva contraseña debe tener al menos 8 caracteres.";
    case "expired":
      return "El enlace expiró. Solicita uno nuevo.";
    case "used":
      return "Este enlace ya fue utilizado. Solicita uno nuevo.";
    default:
      return "El enlace es inválido o ya no está disponible.";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");

    const result = await resetPasswordWithToken(token, password);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: resetErrorMessage(result.reason) },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Contraseña actualizada. Ya puedes iniciar sesión.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("auth:reset_password_fail", { error: message });
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar la contraseña." },
      { status: 500 }
    );
  }
}
