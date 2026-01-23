// lib/sendVerificationEmail.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(opts: {
  email: string;
  token: string;
}) {
  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const emailFrom = process.env.EMAIL_FROM;
  // Guardrails should only apply in true production (not preview/dev).
  const isProd = process.env.VERCEL_ENV === "production";

  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      error: "RESEND_API_KEY not configured",
      siteUrlUsed: appUrl ?? null,
      emailFrom: emailFrom ?? null,
      providerResponse: null as any,
    };
  }

  if (!appUrl) {
    console.warn("NEXT_PUBLIC_SITE_URL/NEXT_PUBLIC_APP_URL not configured.");
    return {
      ok: false,
      error: "NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL not configured",
      siteUrlUsed: null,
      emailFrom: emailFrom ?? null,
      providerResponse: null as any,
    };
  }

  if (isProd && (appUrl.includes("localhost") || appUrl.includes("127.0.0.1"))) {
    return {
      ok: false,
      error: "NEXT_PUBLIC_SITE_URL points to localhost in production",
      siteUrlUsed: appUrl,
      emailFrom: emailFrom ?? null,
      providerResponse: null as any,
    };
  }

  if (!emailFrom) {
    return {
      ok: false,
      error: "EMAIL_FROM not configured",
      siteUrlUsed: appUrl,
      emailFrom: null,
      providerResponse: null as any,
    };
  }

  if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    console.warn("App URL points to localhost; verification links may not work externally.");
  }

  const verifyUrl = new URL("/auth/verify-email", appUrl);
  verifyUrl.searchParams.set("token", opts.token);

  const providerResponse = await resend.emails.send({
    from: emailFrom,
    to: opts.email,
    subject: "Verifica tu correo en Kapa21",
    html: `
      <p>Bienvenido a <strong>Kapa21</strong>.</p>
      <p>Haz click en el siguiente enlace para verificar tu correo:</p>
      <p>
        <a href="${verifyUrl.toString()}">Verificar correo</a>
      </p>
      <p>Este enlace expira en 24 horas.</p>
    `,
  });

  if (providerResponse.error || !providerResponse.data?.id) {
    return {
      ok: false,
      error: providerResponse.error?.message || "Resend send failed",
      siteUrlUsed: appUrl,
      emailFrom,
      providerResponse,
    };
  }

  return {
    ok: true,
    messageId: providerResponse.data.id,
    siteUrlUsed: appUrl,
    emailFrom,
    providerResponse,
  };
}
