import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import NewMovementClient from "./NewMovementClient";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getOnboardingStatus } from "@/lib/onboardingStatus";

export default async function NewMovementPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) redirect("/auth/login");

  const activeCompanyId = (session as any).activeCompanyId as string | undefined;
  if (!activeCompanyId) redirect("/select-company");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) redirect("/auth/login");

  const onboarding = await getOnboardingStatus(user.id);
  if (!onboarding.canOperate) redirect("/onboarding");

  return (
    <Suspense fallback={<div className="k21-card p-6 text-sm text-neutral-400">Cargando…</div>}>
      <NewMovementClient />
    </Suspense>
  );
}
