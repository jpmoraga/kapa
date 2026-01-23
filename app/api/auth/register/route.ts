import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    const companyName = String(body.companyName ?? "Personal").trim() || "Personal";

    console.info("auth:signup_attempt", { email });

    if (!email || !password) {
      console.error("auth:signup_fail", { email, error: "missing_fields" });
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.error("auth:signup_fail", { email, error: "email_exists" });
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    // 1) crear usuario (NO verificado)
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });

    // 2) crear token (upsert)
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.emailVerificationToken.upsert({
      where: { userId: user.id },
      update: { token: verificationToken, expiresAt },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    const emailResult = await sendVerificationEmail({
      email: user.email,
      token: verificationToken,
    });

    const providerStatus =
      emailResult.providerResponse?.error?.statusCode ?? (emailResult.ok ? 200 : null);

    console.info("auth:signup", {
      status: emailResult.ok ? "ok" : "fail",
      to: email,
      from: emailResult.emailFrom ?? null,
      siteUrlUsed: emailResult.siteUrlUsed ?? null,
      messageId: emailResult.messageId ?? null,
      providerStatus,
      providerError: emailResult.providerResponse?.error?.message ?? emailResult.error ?? null,
    });

    // 4) crear cuenta PERSONAL
    const company = await prisma.company.create({
      data: {
        name: companyName,
        kind: "PERSONAL",
        personalOwnerId: user.id,
        members: { create: { userId: user.id, role: "owner" } },
      },
      select: { id: true },
    });

    // 5) dejar esa cuenta como activa
    await prisma.user.update({
      where: { id: user.id },
      data: { activeCompanyId: company.id },
    });

    if (!emailResult.ok) {
      return NextResponse.json(
        {
          error: `No se pudo enviar el correo de verificación: ${emailResult.error}`,
          hint: "Revisa SPF/SMTP y URLs permitidas. Luego reenvía desde login.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Cuenta creada. Revisa tu correo para verificar.",
      hint: "Si no llega, revisa spam o reenvía desde login.",
    });
  } catch (e: any) {
    console.error("auth:signup_fail", { error: e?.message ?? String(e) });
    return NextResponse.json(
      { error: e?.message ?? "Error creando cuenta" },
      { status: 500 }
    );
  }
}
