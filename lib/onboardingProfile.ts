import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type ExistingProfile = {
  fullName: string | null;
  rut: string | null;
  phone: string | null;
  birthDate: string | null;
  nationality: string | null;
  documentSerial: string | null;
};

type NormalizedProfileInput = {
  fullName: string;
  rut: string;
  phone: string;
  birthDate: string;
  nationality: string;
  documentSerial: string;
};

type SaveProfileOptions = {
  requirePhone?: boolean;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeOnboardingProfileInput(body: unknown): NormalizedProfileInput {
  const source = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  return {
    fullName: normalizeString(source.fullName),
    rut: normalizeString(source.rut),
    phone: normalizeString(source.phone),
    birthDate: normalizeString(source.birthDate),
    nationality: normalizeString(source.nationality),
    documentSerial: normalizeString(source.documentSerial),
  };
}

function mergeProfile(existing: ExistingProfile | null, input: NormalizedProfileInput) {
  const existingFullName = normalizeString(existing?.fullName);
  const existingRut = normalizeString(existing?.rut);
  const existingPhone = normalizeString(existing?.phone);
  const existingBirthDate = normalizeString(existing?.birthDate);
  const existingNationality = normalizeString(existing?.nationality);
  const existingDocumentSerial = normalizeString(existing?.documentSerial);

  return {
    fullName: input.fullName || existingFullName || "",
    rut: input.rut || existingRut || "",
    phone: input.phone ? input.phone : existingPhone || null,
    birthDate: input.birthDate ? input.birthDate : existingBirthDate || null,
    nationality: input.nationality ? input.nationality : existingNationality || null,
    documentSerial: input.documentSerial ? input.documentSerial : existingDocumentSerial || null,
  };
}

export async function getAuthenticatedOnboardingUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

export async function getExistingOnboardingProfile(userId: string) {
  return prisma.personProfile.findUnique({
    where: { userId },
    select: {
      fullName: true,
      rut: true,
      phone: true,
      birthDate: true,
      nationality: true,
      documentSerial: true,
    },
  });
}

export async function saveOnboardingProfile(
  userId: string,
  body: unknown,
  options: SaveProfileOptions = {}
) {
  const existing = await getExistingOnboardingProfile(userId);
  const input = normalizeOnboardingProfileInput(body);
  const next = mergeProfile(existing, input);

  if (!next.fullName) {
    return { ok: false as const, status: 400, error: "Nombre completo requerido" };
  }

  if (!next.rut) {
    return { ok: false as const, status: 400, error: "RUT requerido" };
  }

  if (options.requirePhone && !next.phone) {
    return { ok: false as const, status: 400, error: "Teléfono requerido" };
  }

  await prisma.personProfile.upsert({
    where: { userId },
    update: next,
    create: {
      userId,
      ...next,
    },
  });

  return { ok: true as const };
}
