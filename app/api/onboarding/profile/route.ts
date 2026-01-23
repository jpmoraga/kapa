// web/app/api/onboarding/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
  }

  const profile = await prisma.personProfile.findUnique({
    where: { userId: user.id },
    select: { fullName: true, rut: true, phone: true },
  });

  return NextResponse.json({
    fullName: profile?.fullName ?? null,
    rut: profile?.rut ?? null,
    phone: profile?.phone ?? null,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const rut = typeof body.rut === "string" ? body.rut.trim() : "";

  const existing = await prisma.personProfile.findUnique({
    where: { userId: user.id },
    select: { fullName: true, rut: true, phone: true },
  });

  const existingFullName = typeof existing?.fullName === "string" ? existing.fullName.trim() : "";
  const existingRut = typeof existing?.rut === "string" ? existing.rut.trim() : "";
  const existingPhoneRaw = typeof existing?.phone === "string" ? existing.phone.trim() : "";
  const existingPhone = existingPhoneRaw || null;

  const nextFullName = fullName || existingFullName || "";
  const nextRut = rut || existingRut || "";
  const nextPhone = phone ? phone : existingPhone;

  // Validación mínima (para que no se guarde vacío)
  if (!nextFullName) {
    return NextResponse.json({ error: "Nombre completo requerido" }, { status: 400 });
  }
  if (!nextRut) {
    return NextResponse.json({ error: "RUT requerido" }, { status: 400 });
  }

  await prisma.personProfile.upsert({
    where: { userId: user.id },
    update: { fullName: nextFullName, phone: nextPhone, rut: nextRut },
    create: { userId: user.id, fullName: nextFullName, phone: nextPhone, rut: nextRut },
  });

  return NextResponse.json({ ok: true });
}
