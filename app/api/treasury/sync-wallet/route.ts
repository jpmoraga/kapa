export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { requireCanOperate } from "@/lib/guards/requireCanOperate";
import { syncSystemWalletAndRetry } from "@/lib/syncSystemWallet";

export async function POST() {
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

  if (!membership) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const snapshot = await syncSystemWalletAndRetry();
  return NextResponse.json({ ok: true, snapshot });
}
