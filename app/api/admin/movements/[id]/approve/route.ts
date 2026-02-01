export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { requireCanOperate } from "@/lib/guards/requireCanOperate";
import { approveClpDepositByMovement } from "@/lib/treasury/manualClpDeposits";
import { randomUUID } from "crypto";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const correlationId =
    req.headers.get("x-correlation-id") ??
    req.headers.get("x-request-id") ??
    randomUUID();
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
  const adminSecret = process.env.ADMIN_SECRET;
  const providedSecret = req.headers.get("x-admin-secret");
  const secretOk = Boolean(adminSecret && providedSecret === adminSecret);
  if (!isAdminOrOwner && !secretOk) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id: movementId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const amountClp = body?.amountClp ? Number(body.amountClp) : undefined;

  try {
    const result = await approveClpDepositByMovement({
      movementId,
      companyId: activeCompanyId,
      actorUserId: user.id,
      amountClp,
      channel: "admin",
      correlationId,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error aprobando" }, { status: 400 });
  }
}
