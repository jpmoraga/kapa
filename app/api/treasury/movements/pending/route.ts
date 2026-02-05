import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { TreasuryMovementStatus } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isAdminMode = url.searchParams.get("admin") === "1";

  if (isAdminMode) {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const rows = await prisma.treasuryMovement.findMany({
      where: {
        status: { in: [TreasuryMovementStatus.PENDING, TreasuryMovementStatus.PROCESSING] },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        companyId: true,
        company: { select: { name: true } },
        createdByUserId: true,
        createdBy: { select: { email: true } },
        status: true,
        assetCode: true,
        type: true,
        amount: true,
        note: true,
        createdAt: true,
        paidOut: true,
        paidOutAt: true,
        attachmentUrl: true,
      },
    });

    const pending = rows.map((m) => ({
      id: m.id,
      movementId: m.id,
      companyId: m.companyId,
      createdByUserId: m.createdByUserId ?? null,
      userId: m.createdByUserId ?? null,
      createdByEmail: m.createdBy?.email ?? null,
      userEmail: m.createdBy?.email ?? null,
      companyName: m.company?.name ?? null,
      status: m.status,
      assetCode: m.assetCode,
      type: m.type,
      amount: m.amount.toString(),
      note: m.note ?? null,
      createdAt: m.createdAt.toISOString(),
      paidOut: m.paidOut,
      paidOutAt: m.paidOutAt?.toISOString() ?? null,
      attachmentUrl: m.attachmentUrl ?? null,
      source: "movement" as const,
    }));

    console.log("ADMIN_OPS_PENDING_COUNT", { count: pending.length });

    return NextResponse.json({ ok: true, pending });
  }

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
