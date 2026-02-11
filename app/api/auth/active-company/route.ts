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

  const body = await req.json().catch(() => ({}));
  const companyId = String(body.companyId ?? "").trim();
  if (!companyId) {
    return NextResponse.json({ error: "companyId requerido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, companyUsers: { select: { role: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
  }

  const hasAdminRole = user.companyUsers?.some((cu) => String(cu.role).toUpperCase() === "ADMIN");
  if (hasAdminRole) {
    console.info("ACTIVE_COMPANY", { mode: "admin_override", userId: user.id, companyId });
  } else {
    console.info("ACTIVE_COMPANY", { mode: "member_check", userId: user.id, companyId });
    // validar que el usuario pertenezca a la empresa
    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: user.id, companyId } },
      select: { userId: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "No autorizado para esa empresa" }, { status: 403 });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { activeCompanyId: companyId },
  });

  return NextResponse.json({ ok: true, activeCompanyId: companyId });
}
