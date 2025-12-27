import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { TreasuryMovementStatus } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const { id: movementId } = await params;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });
  const role = String(membership?.role ?? "").toLowerCase();
  const isAdminOrOwner = role === "admin" || role === "owner";
  if (!isAdminOrOwner) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const movement = await prisma.treasuryMovement.findFirst({
    where: {
      id: movementId,
      companyId: activeCompanyId,
      status: TreasuryMovementStatus.PENDING,
    },
    select: { id: true },
  });

  if (!movement) {
    return NextResponse.json({ error: "Movimiento no encontrado o no pendiente" }, { status: 404 });
  }

  const updated = await prisma.treasuryMovement.update({
    where: { id: movementId },
    data: {
      status: TreasuryMovementStatus.REJECTED,
      approvedByUserId: user.id,
      approvedAt: new Date(),
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, ...updated });
}