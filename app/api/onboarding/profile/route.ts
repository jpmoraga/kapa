// web/app/api/onboarding/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

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
  const fullName = String(body.fullName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const rut = String(body.rut ?? "").trim();

  const existing = await prisma.personProfile.findUnique({
    where: { userId: user.id },
    select: { fullName: true, rut: true, phone: true },
  });

  const existingFullName = String(existing?.fullName ?? "").trim();
  const existingRut = String(existing?.rut ?? "").trim();
  const existingPhone = String(existing?.phone ?? "").trim();

  const nextFullName = fullName || existingFullName || "";
  const nextRut = rut || existingRut || "";
  const nextPhone = phone || existingPhone || null;

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
