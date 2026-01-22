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
  searchParams?: Promise<{ step?: string | string[] }> | { step?: string | string[] };
}) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) {
    redirect("/auth/login?callbackUrl=/onboarding");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    redirect("/auth/login?callbackUrl=/onboarding");
  }

  const onboarding = await getOnboardingStatus(user.id);
  if (onboarding.isComplete) {
    redirect("/dashboard");
  }

  const sp = (await searchParams) ?? {};
  const desiredStep = getOnboardingStep(onboarding);
  const stepParam = Array.isArray(sp.step) ? sp.step[0] : sp.step;
  if (stepParam !== desiredStep) {
    redirect(`/onboarding?step=${desiredStep}`);
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-400">Cargando…</div>}>
      <OnboardingClient />
    </Suspense>
  );
}
