import { Resend } from "resend";

type ResendSendResponse = Awaited<ReturnType<Resend["emails"]["send"]>>;

type PasswordResetEmailResult = {
  ok: boolean;
  error?: string;
  messageId?: string;
  siteUrlUsed: string | null;
  emailFrom: string | null;
  providerResponse: unknown;
};

export async function sendPasswordResetEmail(opts: {
  email: string;
  token: string;
}): Promise<PasswordResetEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const emailFrom = process.env.EMAIL_FROM;
  const isProd = process.env.VERCEL_ENV === "production";

  if (!apiKey) {
    return {
      ok: false,
      error: "RESEND_API_KEY not configured",
      siteUrlUsed: appUrl ?? null,
      emailFrom: emailFrom ?? null,
      providerResponse: null,
    };
  }

  if (!appUrl) {
    return {
      ok: false,
      error: "NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL not configured",
      siteUrlUsed: null,
      emailFrom: emailFrom ?? null,
      providerResponse: null,
    };
  }

  if (isProd && (appUrl.includes("localhost") || appUrl.includes("127.0.0.1"))) {
    return {
      ok: false,
      error: "NEXT_PUBLIC_SITE_URL points to localhost in production",
      siteUrlUsed: appUrl,
      emailFrom: emailFrom ?? null,
      providerResponse: null,
    };
  }

  if (!emailFrom) {
    return {
      ok: false,
      error: "EMAIL_FROM not configured",
      siteUrlUsed: appUrl,
      emailFrom: null,
      providerResponse: null,
    };
  }

  const resetUrl = new URL("/auth/reset-password", appUrl);
  resetUrl.searchParams.set("token", opts.token);

  const resend = new Resend(apiKey);
  const providerResponse: ResendSendResponse = await resend.emails.send({
    from: emailFrom,
    to: opts.email,
    subject: "Recupera tu acceso a Kapa21",
    html: `
      <p>Recibimos una solicitud para restablecer tu contraseña en <strong>Kapa21</strong>.</p>
      <p>Haz click en el siguiente enlace para elegir una nueva contraseña:</p>
      <p><a href="${resetUrl.toString()}">Restablecer contraseña</a></p>
      <p>Este enlace expira en 2 horas y solo puede usarse una vez.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
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
