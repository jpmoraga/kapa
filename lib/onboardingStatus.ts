import { prisma } from "@/lib/prisma";

export type OnboardingStatus = {
  hasIdDocument: boolean;
  hasProfile: boolean;
  hasBankAccount: boolean;
  termsAccepted: boolean;
  canOperate: boolean;
  isComplete: boolean;
};

export type OnboardingStep = "ocr" | "personal" | "bank" | "terms" | "complete";

export function getOnboardingStep(status: OnboardingStatus): OnboardingStep {
  if (!status.hasIdDocument) return "ocr";
  if (!status.hasProfile) return "personal";
  if (!status.hasBankAccount) return "bank";
  if (!status.termsAccepted) return "terms";
  return "complete";
}

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const [profile, onboarding, bankAccount] = await prisma.$transaction([
    prisma.personProfile.findUnique({
      where: { userId },
      select: { fullName: true, rut: true, phone: true },
    }),
    prisma.userOnboarding.findUnique({
      where: { userId },
      select: { termsAcceptedAt: true, idDocumentFrontPath: true, idDocumentBackPath: true },
    }),
    prisma.bankAccount.findUnique({
      where: { userId },
      select: { userId: true },
    }),
  ]);

  const hasIdDocument = Boolean(onboarding?.idDocumentFrontPath) && Boolean(onboarding?.idDocumentBackPath);
  const hasProfile =
    Boolean(profile?.fullName?.trim()) &&
    Boolean(profile?.rut?.trim()) &&
    Boolean(profile?.phone?.trim());
  const hasBankAccount = Boolean(bankAccount?.userId);
  const termsAccepted = Boolean(onboarding?.termsAcceptedAt);
  const isComplete = hasIdDocument && hasProfile && hasBankAccount && termsAccepted;

  return {
    hasIdDocument,
    hasProfile,
    hasBankAccount,
    termsAccepted,
    canOperate: isComplete,
    isComplete,
  };
}
