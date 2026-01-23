import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const emailFrom = process.env.EMAIL_FROM ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const siteUrlUsed = siteUrl || appUrl || "";
  const resendDomainFrom = emailFrom.includes("@") ? emailFrom.split("@")[1] : "";

  return NextResponse.json({
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    hasEmailFrom: Boolean(emailFrom),
    emailFrom,
    siteUrlUsed,
    resendDomainFrom,
    env: {
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      vercelEnv: process.env.VERCEL_ENV ?? "unknown",
    },
  });
}
