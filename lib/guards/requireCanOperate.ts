import { prisma } from "@/lib/prisma";

export async function requireCanOperate(userId: string) {
  const [profile, onboarding] = await prisma.$transaction([
    prisma.personProfile.findUnique({
      where: { userId },
      select: { userId: true },
    }),
    prisma.userOnboarding.findUnique({
      where: { userId },
      select: { termsAcceptedAt: true },
    }),
  ]);

  if (!profile) {
    return { ok: false, error: "Debes completar tu perfil para operar." };
  }

  if (!onboarding?.termsAcceptedAt) {
    return { ok: false, error: "Debes aceptar los términos para operar." };
  }

  return { ok: true };
}