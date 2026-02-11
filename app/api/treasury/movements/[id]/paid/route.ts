import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { TreasuryMovementStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });

  const role = String(membership?.role ?? "").toLowerCase();
  const isAdmin = role === "admin" || role === "owner";
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await context.params;

  // Buscar por id directo en TreasuryMovement primero.
  let m = await prisma.treasuryMovement.findFirst({
    where: { id, companyId: activeCompanyId },
    select: { id: true, type: true, assetCode: true, status: true, paidOut: true, paidOutAt: true },
  });

  if (m) {
    if (m.type !== "withdraw" || m.assetCode !== "CLP") {
      return NextResponse.json({ error: "Solo aplica a retiros CLP" }, { status: 400 });
    }

    if (m.paidOut) {
      return NextResponse.json({
        ok: true,
        updated: { id: m.id, paidOut: true, paidOutAt: m.paidOutAt ?? null, status: m.status },
      });
    }

    const updated = await prisma.treasuryMovement.update({
      where: { id: m.id },
      data: {
        paidOut: true,
        paidOutAt: new Date(),
        status: TreasuryMovementStatus.APPROVED,
      },
      select: { id: true, paidOut: true, paidOutAt: true, status: true },
    });

    return NextResponse.json({ ok: true, updated });
  }

  // Fallback: buscar en tabla Movement (legacy) si existe en el Prisma Client.
  const movementClient = (prisma as any).movement as
    | {
        findFirst: (args: any) => Promise<any>;
        update: (args: any) => Promise<any>;
      }
    | undefined;

  if (movementClient?.findFirst) {
    const legacy = await movementClient.findFirst({
      where: { id, companyId: activeCompanyId },
      select: {
        id: true,
        type: true,
        assetCode: true,
        status: true,
        paidOut: true,
        paidOutAt: true,
      },
    });

    if (legacy) {
      if (legacy.type !== "withdraw" || legacy.assetCode !== "CLP") {
        return NextResponse.json({ error: "Solo aplica a retiros CLP" }, { status: 400 });
      }

      if (legacy.paidOut) {
        return NextResponse.json({
          ok: true,
          updated: {
            id: legacy.id,
            paidOut: true,
            paidOutAt: legacy.paidOutAt ?? null,
            status: legacy.status ?? null,
          },
        });
      }

      const updated = await movementClient.update({
        where: { id: legacy.id },
        data: {
          paidOut: true,
          paidOutAt: new Date(),
        },
        select: { id: true, paidOut: true, paidOutAt: true, status: true },
      });

      return NextResponse.json({ ok: true, updated });
    }
  }

  return NextResponse.json({ error: "Movimiento no existe" }, { status: 404 });
}
