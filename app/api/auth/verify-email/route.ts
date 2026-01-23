import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/verifyEmailToken";

function getBaseUrl(req: Request) {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  // Guardrails should only apply in true production (not preview/dev).
  const isProd = process.env.VERCEL_ENV === "production";

  if (envUrl) return envUrl;
  if (isProd) {
    throw new Error("NEXT_PUBLIC_SITE_URL not configured in production");
  }

  return new URL(req.url).origin;
}

async function handleVerify(token: string | null, req: Request) {
  if (!token) {
    return NextResponse.json({ error: "Token faltante" }, { status: 400 });
  }

  const result = await verifyEmailToken(token);
  if (!result.ok) {
    return NextResponse.json({ error: "Token invalido o expirado" }, { status: 400 });
  }

  const baseUrl = getBaseUrl(req);
  const loginUrl = new URL("/auth/login", baseUrl);
  loginUrl.searchParams.set("verified", "1");
  loginUrl.searchParams.set("callbackUrl", "/onboarding");
  return NextResponse.redirect(loginUrl);
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  return handleVerify(token, req);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "").trim() || null;
  return handleVerify(token, req);
}
