import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();

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

  const form = await req.formData();
  const file = form.get("file");

  const side = (form.get("side") || "front").toString(); // "front" | "back"
  if (!["front", "back"].includes(side)) {
    return NextResponse.json({ error: "side debe ser front o back" }, { status: 400 });
  }

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido (file)" }, { status: 400 });
  }

  // Validación mínima
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
  }

  // ✅ Bucket (créalo en Supabase Storage)
  const bucket = "kyc";

  // ✅ Path: user/<userId>/id-<timestamp>.jpg
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const path = `user/${user.id}/id-${side}-${Date.now()}.${safeExt}`;

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

  // ✅ Guardamos solo el path en DB (lo más sano). El URL lo generas signed cuando lo necesites.
  await prisma.userOnboarding.upsert({
    where: { userId: user.id },
    update: side === "front" ? { idDocumentFrontPath: path } : { idDocumentBackPath: path },
    create:
      side === "front"
        ? { userId: user.id, idDocumentFrontPath: path }
        : { userId: user.id, idDocumentBackPath: path },
  });

  return NextResponse.json({ ok: true, side, path });
}