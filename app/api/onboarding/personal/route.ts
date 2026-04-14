import { NextResponse } from "next/server";
import {
  getAuthenticatedOnboardingUser,
  saveOnboardingProfile,
} from "@/lib/onboardingProfile";

export async function POST(req: Request) {
  const user = await getAuthenticatedOnboardingUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await saveOnboardingProfile(user.id, body, { requirePhone: true });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
