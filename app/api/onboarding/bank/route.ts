// app/api/onboarding/bank/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const bankAccount = await prisma.bankAccount.findUnique({
    where: { userId: user.id },
    select: {
      bankName: true,
      accountType: true,
      accountNumber: true,
      holderRut: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ bankAccount });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, personProfile: { select: { rut: true } } },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));

    const bankName = String(body.bankName ?? "").trim();
    const accountType = String(body.accountType ?? "").trim();
    const accountNumber = String(body.accountNumber ?? "").trim();
    const holderRut = String(body.holderRut ?? user.personProfile?.rut ?? "").trim();

    if (!bankName) return NextResponse.json({ error: "Banco requerido" }, { status: 400 });
    if (!accountType) return NextResponse.json({ error: "Tipo de cuenta requerido" }, { status: 400 });
    if (!accountNumber) return NextResponse.json({ error: "Número de cuenta requerido" }, { status: 400 });
    const finalRut = holderRut || "PENDIENTE";

    console.info("auth:bank", {
      userId: user.id,
      payload: {
        bankName,
        accountType,
        accountNumberLast4: accountNumber.slice(-4),
        holderRut: finalRut ? `${finalRut.slice(0, 4)}***` : null,
      },
    });

    await prisma.bankAccount.upsert({
      where: { userId: user.id },
      update: {
        bankName,
        accountType,
        accountNumber,
        holderRut: finalRut,
      },
      create: {
        userId: user.id,
        bankName,
        accountType,
        accountNumber,
        holderRut: finalRut,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const message = e?.message ?? "unknown";
    const code = e?.code;
    console.error("auth:bank", {
      userId: user.id,
      error: message,
      code,
    });

    if (code === "P2002") {
      return NextResponse.json({ error: "Cuenta bancaria ya registrada" }, { status: 409 });
    }

    return NextResponse.json({ error: "Error guardando cuenta bancaria" }, { status: 500 });
  }
}
