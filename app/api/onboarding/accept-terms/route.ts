export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getOnboardingStatus } from "@/lib/onboardingStatus";

export async function POST() {
  const perfEnabled = process.env.DEBUG_PERF === "1";
  const t0 = Date.now();
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();

  if (!email) {
    if (perfEnabled) {
      console.info("perf:onboarding_terms", {
        method: "POST",
        action: "unauthenticated",
        ms: Date.now() - t0,
      });
    }
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    if (perfEnabled) {
      console.info("perf:onboarding_terms", {
        method: "POST",
        action: "missing_user",
        ms: Date.now() - t0,
      });
    }
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
  }

  const onboarding = await getOnboardingStatus(user.id);
  if (!onboarding.hasIdDocument) {
    return NextResponse.json(
      { error: "Debes subir tu documento antes de aceptar los términos." },
      { status: 409 }
    );
  }
  if (!onboarding.hasProfile) {
    return NextResponse.json(
      { error: "Completa tu perfil antes de aceptar los términos." },
      { status: 409 }
    );
  }
  if (!onboarding.hasBankAccount) {
    return NextResponse.json(
      { error: "Registra tu cuenta bancaria antes de aceptar los términos." },
      { status: 409 }
    );
  }

  await prisma.userOnboarding.upsert({
    where: { userId: user.id },
    update: { termsAcceptedAt: new Date() },
    create: { userId: user.id, termsAcceptedAt: new Date() },
  });

  if (perfEnabled) {
    console.info("perf:onboarding_terms", {
      method: "POST",
      action: "ok",
      userId: user.id,
      ms: Date.now() - t0,
      queries: 5,
    });
  }

  return NextResponse.json({ ok: true });
}
