// web/app/api/onboarding/profile/route.ts
import { NextResponse } from "next/server";
import {
  getAuthenticatedOnboardingUser,
  getExistingOnboardingProfile,
  saveOnboardingProfile,
} from "@/lib/onboardingProfile";

export async function GET() {
  const perfEnabled = process.env.DEBUG_PERF === "1";
  const t0 = Date.now();
  const user = await getAuthenticatedOnboardingUser();
  if (!user) {
    if (perfEnabled) {
      console.info("perf:onboarding_profile", {
        method: "GET",
        action: "unauthenticated",
        ms: Date.now() - t0,
      });
    }
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const profile = await getExistingOnboardingProfile(user.id);

  if (perfEnabled) {
    console.info("perf:onboarding_profile", {
      method: "GET",
      action: "ok",
      userId: user.id,
      ms: Date.now() - t0,
      queries: 2,
    });
  }

  return NextResponse.json({
    fullName: profile?.fullName ?? null,
    rut: profile?.rut ?? null,
    phone: profile?.phone ?? null,
    birthDate: profile?.birthDate ?? null,
    nationality: profile?.nationality ?? null,
    documentSerial: profile?.documentSerial ?? null,
  });
}

export async function POST(req: Request) {
  const perfEnabled = process.env.DEBUG_PERF === "1";
  const t0 = Date.now();
  const user = await getAuthenticatedOnboardingUser();
  if (!user) {
    if (perfEnabled) {
      console.info("perf:onboarding_profile", {
        method: "POST",
        action: "unauthenticated",
        ms: Date.now() - t0,
      });
    }
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await saveOnboardingProfile(user.id, body);
  if (!result.ok) {
    const action =
      result.error === "Nombre completo requerido"
        ? "missing_full_name"
        : result.error === "RUT requerido"
        ? "missing_rut"
        : "validation_error";

    if (perfEnabled) {
      console.info("perf:onboarding_profile", {
        method: "POST",
        action,
        userId: user.id,
        ms: Date.now() - t0,
      });
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (perfEnabled) {
    console.info("perf:onboarding_profile", {
      method: "POST",
      action: "ok",
      userId: user.id,
      ms: Date.now() - t0,
      queries: 3,
    });
  }

  return NextResponse.json({ ok: true });
}
