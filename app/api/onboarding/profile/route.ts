// web/app/api/onboarding/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

  // Validación mínima (para que no se guarde vacío)
  if (!fullName) {
    return NextResponse.json({ error: "Nombre completo requerido" }, { status: 400 });
  }
  if (!rut) {
    return NextResponse.json({ error: "RUT requerido" }, { status: 400 });
  }

  await prisma.personProfile.upsert({
    where: { userId: user.id },
    update: { fullName, phone, rut },
    create: { userId: user.id, fullName, phone, rut },
  });

  return NextResponse.json({ ok: true });
}