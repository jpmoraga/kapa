import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";
import { sendDepositSlipWhatsApp } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
  }

  console.info("deposit_slip:create_entry", {
    companyId: activeCompanyId ?? null,
    userId: user.id,
    amount: "unknown",
  });

  const form = await req.formData();
  const file = form.get("file");

  // (deposit slip) no usamos "side"

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido (file)" }, { status: 400 });
  }

  // Validación mínima (imagen o PDF)
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  if (!isImage && !isPdf) {
  return NextResponse.json({ error: "El archivo debe ser una imagen o PDF" }, { status: 400 });
  }

  // ✅ Bucket (créalo en Supabase Storage)
  const bucket = "deposit-slips";

  // ✅ Path: user/<userId>/deposit-slip-<timestamp>.<ext>
  const extRaw = (file.name.split(".").pop() || "").toLowerCase();
  const ext = isPdf
    ? "pdf"
    : (["jpg", "jpeg", "png", "webp"].includes(extRaw) ? extRaw : "jpg");

  const path = `user/${user.id}/deposit-slip-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabaseServer.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `No pude subir imagen: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // ✅ Crear registro de comprobante en DB
  const slip = await prisma.depositSlip.create({
    data: {
      userId: user.id,
      filePath: path,
      fileMime: file.type || null,
      fileSizeBytes: typeof file.size === "number" ? BigInt(file.size) : null,
      ocrStatus: "received",
      status: "received",
    },
    select: { id: true, filePath: true, ocrStatus: true, status: true },
  });

  console.info("deposit_slip:created", {
    slipId: slip.id,
    companyId: activeCompanyId ?? null,
    amount: "unknown",
    status: slip.status,
  });

  await sendDepositSlipWhatsApp({
    slipId: slip.id,
    companyId: activeCompanyId ?? null,
    amount: "unknown",
    currency: "CLP",
    status: slip.status,
    ocrStatus: slip.ocrStatus,
  });

  return NextResponse.json({
    ok: true,
    depositSlipId: slip.id,
    path: slip.filePath,
    ocrStatus: slip.ocrStatus,
    status: slip.status,
  });
  
}
