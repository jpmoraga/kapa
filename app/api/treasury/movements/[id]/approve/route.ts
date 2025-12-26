// web/app/api/treasury/movements/[id]/approve/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { requireCanOperate } from "@/lib/guards/requireCanOperate";
import { approveMovementAsSystem } from "@/lib/treasury/approveMovement";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const can = await requireCanOperate(user.id);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });

  const role = String(membership?.role ?? "").toLowerCase();
  const isAdminOrOwner = role === "admin" || role === "owner";
  if (!isAdminOrOwner) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id: movementId } = await params;

  try {
    const out = await approveMovementAsSystem({
      movementId,
      companyId: activeCompanyId,
      actorUserId: user.id,
    });
    
    return NextResponse.json({ ok: true, ...out });

  } catch (e: any) {
    console.error("APPROVE_ERROR", e);

    

    // ÚNICA excepción opcional
    if (e?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Movimiento no existe" }, { status: 404 });
    }

    // TODO lo demás: mensaje genérico para el cliente
    return NextResponse.json(
      { error: "Operación pendiente" },
      { status: 400 }
    );
  }