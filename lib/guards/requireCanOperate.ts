import { getOnboardingStatus } from "@/lib/onboardingStatus";

export async function requireCanOperate(userId: string) {
  const onboarding = await getOnboardingStatus(userId);

  if (!onboarding.hasIdDocument) {
    return { ok: false, error: "Debes subir tu documento de identidad para operar." };
  }

  if (!onboarding.hasProfile) {
    return { ok: false, error: "Debes completar tu perfil para operar." };
  }

  if (!onboarding.hasBankAccount) {
    return { ok: false, error: "Debes registrar tu cuenta bancaria para operar." };
  }

  if (!onboarding.termsAccepted) {
    return { ok: false, error: "Debes aceptar los términos para operar." };
  }

  return { ok: true };
}
