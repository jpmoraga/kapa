import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const ALLOWED_BUCKETS = ["deposit-slips", "kyc"] as const;

function isSafePath(path: string) {
  if (!path) return false;
  if (path.startsWith("/")) return false;
  if (path.includes("..")) return false;
  return true;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const bucket = url.searchParams.get("bucket");
  const path = url.searchParams.get("path");

  if (!bucket || !path) {
    return NextResponse.json({ error: "bucket y path requeridos" }, { status: 400 });
  }

  if (!ALLOWED_BUCKETS.includes(bucket as (typeof ALLOWED_BUCKETS)[number])) {
    return NextResponse.json({ error: "Bucket inválido" }, { status: 400 });
  }

  if (!isSafePath(path)) {
    return NextResponse.json({ error: "Path inválido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
  }

  if (bucket === "deposit-slips") {
    if (!activeCompanyId) {
      return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });
    }

    const membership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
      select: { userId: true },
    });
    if (!membership) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const slip = await prisma.depositSlip.findFirst({
      where: { filePath: path },
      select: { userId: true },
    });
    if (!slip) {
      return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });
    }

    const slipMembership = await prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: slip.userId, companyId: activeCompanyId } },
      select: { userId: true },
    });
    if (!slipMembership) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  if (bucket === "kyc") {
    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId: user.id },
      select: { idDocumentFrontPath: true, idDocumentBackPath: true },
    });

    const matches =
      onboarding &&
      (path === onboarding.idDocumentFrontPath || path === onboarding.idDocumentBackPath);
    if (!matches) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  const { data, error } = await supabaseServer.storage
    .from(bucket)
    .createSignedUrl(path, 600);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message ?? "No pude generar URL firmada" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    signedUrl: data.signedUrl,
    bucket,
    path,
  });
}
