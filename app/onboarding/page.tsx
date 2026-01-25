import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getOnboardingStatus, getOnboardingStep } from "@/lib/onboardingStatus";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ step?: string | string[] }>;
}) {
  const perfEnabled = process.env.DEBUG_PERF === "1";
  const t0 = Date.now();

  const tSession = Date.now();
  const session = await getServerSession(authOptions);
  const sessionMs = Date.now() - tSession;
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) {
    if (perfEnabled) {
      console.info("perf:onboarding_guard", {
        route: "/onboarding",
        action: "redirect_login",
        sessionMs,
        totalMs: Date.now() - t0,
      });
    }
    redirect("/auth/login?callbackUrl=/onboarding");
  }

  const tUser = Date.now();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  const userMs = Date.now() - tUser;
  if (!user) {
    if (perfEnabled) {
      console.info("perf:onboarding_guard", {
        route: "/onboarding",
        action: "redirect_login_missing_user",
        sessionMs,
        userMs,
        totalMs: Date.now() - t0,
      });
    }
    redirect("/auth/login?callbackUrl=/onboarding");
  }

  const tStatus = Date.now();
  const onboarding = await getOnboardingStatus(user.id);
  const onboardingMs = Date.now() - tStatus;
  if (onboarding.isComplete) {
    if (perfEnabled) {
      console.info("perf:onboarding_guard", {
        route: "/onboarding",
        action: "redirect_dashboard_complete",
        sessionMs,
        userMs,
        onboardingMs,
        totalMs: Date.now() - t0,
      });
    }
    redirect("/dashboard");
  }

  const sp = searchParams ? await searchParams : {};
  const desiredStep = getOnboardingStep(onboarding);
  const stepParam = Array.isArray(sp.step) ? sp.step[0] : sp.step;
  if (stepParam !== desiredStep) {
    if (perfEnabled) {
      console.info("perf:onboarding_guard", {
        route: "/onboarding",
        action: "redirect_step_mismatch",
        stepParam: stepParam ?? null,
        desiredStep,
        sessionMs,
        userMs,
        onboardingMs,
        totalMs: Date.now() - t0,
      });
    }
    redirect(`/onboarding?step=${desiredStep}`);
  }

  if (perfEnabled) {
    console.info("perf:onboarding_guard", {
      route: "/onboarding",
      action: "render",
      stepParam: stepParam ?? null,
      desiredStep,
      sessionMs,
      userMs,
      onboardingMs,
      totalMs: Date.now() - t0,
    });
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-400">Cargando…</div>}>
      <OnboardingClient />
    </Suspense>
  );
}
