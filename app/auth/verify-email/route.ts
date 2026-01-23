import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/verifyEmailToken";

function getBaseUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const baseUrl = getBaseUrl(req);
  const loginUrl = new URL("/auth/login", baseUrl);
  loginUrl.searchParams.set("callbackUrl", "/onboarding");

  if (!token) {
    loginUrl.searchParams.set("verified", "0");
    loginUrl.searchParams.set("error", "missing_token");
    return NextResponse.redirect(loginUrl);
  }

  const result = await verifyEmailToken(token);
  loginUrl.searchParams.set("verified", result.ok ? "1" : "0");
  if (!result.ok) {
    loginUrl.searchParams.set("error", "invalid_or_expired");
  }

  return NextResponse.redirect(loginUrl);
}
