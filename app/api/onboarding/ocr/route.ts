import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";
import * as Tesseract from "tesseract.js";

type OcrResult = {
  nombre: string;
  rut: string;
  nacimiento: string;
  nacionalidad: string;
  serie: string;
  rawTextFront?: string;
  rawTextBack?: string;
};

function normalizeRut(rut: string) {
  return rut
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .replace(/–/g, "-")
    .toUpperCase();
}

function extractRut(text: string) {
  const m =
    text.match(/\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/g) ||
    text.match(/\b\d{7,8}-[\dkK]\b/g);
  if (!m || m.length === 0) return "";
  return normalizeRut(m[0]);
}

function extractBirthDate(text: string) {
  // Busca dd/mm/yyyy o dd-mm-yyyy, luego lo convierte a yyyy-mm-dd
  const m = text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
  if (!m) return "";
  const dd = m[1];
  const mm = m[2];
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}

function extractNationality(text: string) {
  // Heurística simple: busca "CHILENA/CHILENO"
  if (/CHILEN[AO]/i.test(text)) return "Chilena";
  return "";
}

function extractSerie(text: string) {
  // Serie / N° Documento / Document No heurístico
  const patterns = [
    /SERIE\s*[:\-]?\s*([A-Z0-9]{6,12})/i,
    /N[°ºO]\s*DOCUMENTO\s*[:\-]?\s*([A-Z0-9]{6,12})/i,
    /DOCUMENT\s*NO\s*[:\-]?\s*([A-Z0-9]{6,12})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].toUpperCase();
  }
  // fallback: cualquier token tipo A1234567
  const m2 = text.match(/\b[A-Z]\d{6,9}\b/);
  return m2?.[0]?.toUpperCase() ?? "";
}

function extractName(text: string) {
  // Heurístico: intenta capturar NOMBRES / APELLIDOS
  const t = text.replace(/\r/g, "\n");
  const nombres =
    t.match(/NOMBRES?\s*\n+([A-ZÁÉÍÓÚÑ ]{3,})/i)?.[1]?.trim() ?? "";
  const apellidos =
    t.match(/APELLIDOS?\s*\n+([A-ZÁÉÍÓÚÑ ]{3,})/i)?.[1]?.trim() ?? "";

  const full = `${nombres} ${apellidos}`.trim().replace(/\s+/g, " ");
  // Si no salió nada, devolvemos vacío (usuario lo edita)
  return full;
}

async function ocrImage(buffer: Buffer) {
  // OJO: tesseract necesita lang data; le ponemos un langPath por defecto (internet).
  const res = await Tesseract.recognize(buffer, "spa", {
    langPath: "https://tessdata.projectnaptha.com/4.0.0",
    logger: () => {},
  });
  return (res.data.text || "").trim();
}

export async function POST() {
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

  const onboarding = await prisma.userOnboarding.findUnique({
    where: { userId: user.id },
    select: { idDocumentFrontPath: true, idDocumentBackPath: true },
  });

  if (!onboarding?.idDocumentFrontPath || !onboarding?.idDocumentBackPath) {
    return NextResponse.json(
      { error: "Faltan imágenes (sube frente y reverso antes del OCR)" },
      { status: 400 }
    );
  }

  const bucket = "kyc";

  // Descarga front/back desde Supabase Storage
  const frontDl = await supabaseServer.storage.from(bucket).download(onboarding.idDocumentFrontPath);
  if (frontDl.error || !frontDl.data) {
    return NextResponse.json(
      { error: `No pude bajar frente: ${frontDl.error?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  const backDl = await supabaseServer.storage.from(bucket).download(onboarding.idDocumentBackPath);
  if (backDl.error || !backDl.data) {
    return NextResponse.json(
      { error: `No pude bajar reverso: ${backDl.error?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  const frontBuf = Buffer.from(await frontDl.data.arrayBuffer());
  const backBuf = Buffer.from(await backDl.data.arrayBuffer());

  // OCR (MVP)
  const [rawTextFront, rawTextBack] = await Promise.all([ocrImage(frontBuf), ocrImage(backBuf)]);
  const rawAll = `${rawTextFront}\n${rawTextBack}`;

  const out: OcrResult = {
    nombre: extractName(rawAll),
    rut: extractRut(rawAll),
    nacimiento: extractBirthDate(rawAll),
    nacionalidad: extractNationality(rawAll),
    serie: extractSerie(rawAll),
    rawTextFront,
    rawTextBack,
  };

  return NextResponse.json({ ok: true, parsed: out });
}