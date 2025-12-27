import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { TreasuryMovementStatus } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });

  const role = String(membership?.role ?? "").toLowerCase();
  const isAdminOrOwner = role === "admin" || role === "owner";
  if (!isAdminOrOwner) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const rows = await prisma.treasuryMovement.findMany({
    where: { companyId: activeCompanyId, status: TreasuryMovementStatus.PENDING },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      status: true,
      assetCode: true,
      type: true,
      amount: true,
      note: true,
      createdAt: true,
      createdByUserId: true,
      attachmentUrl: true,
    },
  });

  return NextResponse.json({
    ok: true,
    pending: rows.map((m) => ({
      id: m.id,
      status: m.status,
      assetCode: m.assetCode,
      type: m.type,
      amount: m.amount.toString(),
      note: m.note,
      createdAt: m.createdAt.toISOString(),
      createdByUserId: m.createdByUserId,
      attachmentUrl: m.attachmentUrl,
    })),
  });
}