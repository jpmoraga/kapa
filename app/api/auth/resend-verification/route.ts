import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";
import crypto from "crypto";

export const runtime = "nodejs";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "***";
  const safeName = name.length <= 2 ? `${name[0] ?? ""}***` : `${name.slice(0, 2)}***`;
  return `${safeName}@${domain}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").toLowerCase().trim();

    console.info("auth:resend_attempt", { email });

    if (!email) {
      console.error("auth:resend_fail", { email, error: "missing_email" });
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerifiedAt: true },
    });

    if (!user) {
      console.error("auth:resend_fail", { email, error: "user_not_found" });
      return NextResponse.json({ ok: false, error: "Email no registrado" }, { status: 404 });
    }

    if (user.emailVerifiedAt) {
      console.error("auth:resend_fail", { email, error: "already_verified" });
      return NextResponse.json({ ok: false, error: "Email ya verificado" }, { status: 400 });
    }

    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

    console.info("auth:resend", {
      runtimeBaseUrl: {
        host: req.headers.get("host"),
        url: req.url,
      },
      to: maskEmail(user.email),
      resendFrom: emailResult.emailFrom,
      siteUrlUsed: emailResult.siteUrlUsed,
      providerResponse: emailResult.providerResponse
        ? {
          status: providerStatus,
          data: emailResult.providerResponse.data ?? null,
          error: emailResult.providerResponse.error ?? null,
        }
        : null,
      messageId: emailResult.messageId ?? null,
      providerError: emailResult.providerResponse?.error?.message ?? emailResult.error ?? null,
    });

    if (!emailResult.ok || !emailResult.messageId) {
      return NextResponse.json(
        {
          ok: false,
          error: emailResult.error ?? "Resend failed",
          debug: {
            providerStatus,
            messageId: emailResult.messageId ?? null,
            siteUrlUsed: emailResult.siteUrlUsed ?? null,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: emailResult.messageId,
      siteUrlUsed: emailResult.siteUrlUsed,
    });
  } catch (e: any) {
    console.error("auth:resend_fail", { error: e?.message ?? String(e) });
    return NextResponse.json(
      { error: e?.message ?? "No se pudo reenviar" },
      { status: 500 }
    );
  }
}
