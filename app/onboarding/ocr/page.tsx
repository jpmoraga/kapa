"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../_components/OnboardingShell";
import { onboardingCopy as copy } from "../_copy";

type Parsed = {
  nombre: string;
  rut: string;
  nacimiento: string;
  nacionalidad: string;
  serie: string;
};

function normalizeRut(rut: string) {
  return rut
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .replace(/–/g, "-")
    .toUpperCase();
}

function onlyMRZCharsKeepLines(s: string) {
  // Mantener \n, limpiar todo lo demás a MRZ charset (A-Z0-9< y saltos)
  return s
    .toUpperCase()
    .replace(/\r/g, "\n")
    .replace(/[^A-Z0-9<\n]/g, " ");
}

function normalizeMrzLine(line: string) {
  // Quitar espacios internos (MRZ es continuo) y dejar solo A-Z0-9<
  return line.replace(/\s+/g, "").replace(/[^A-Z0-9<]/g, "");
}

function getMrzTriplet(text: string) {
  const t = onlyMRZCharsKeepLines(text);

  // 1) Split real por líneas (no aplastar whitespace)
  const rawLines = t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(normalizeMrzLine)
    .filter((l) => l.length >= 20 && l.includes("<"));

  // 2) Buscar patrón típico: INCHL... luego YYMMDD... luego APELLIDOS<<NOMBRES
  for (let i = 0; i < rawLines.length; i++) {
    const l1 = rawLines[i];
    if (!l1.startsWith("INCHL")) continue;

    const l2 = rawLines[i + 1] ?? "";
    const l3 = rawLines[i + 2] ?? "";

    const ok2 = /^\d{6}[0-9A-Z<]{10,}$/.test(l2); // YYMMDD...
    const ok3 = /^[A-Z<]{5,}<<[A-Z<]{3,}/.test(l3); // APELLIDOS<<NOMBRES

    if (ok2 && ok3) return { l1, l2, l3, ok: true };
  }

  // 3) Fallback: si no están alineadas, intenta “rescatar” por regex desde el texto completo
  const joined = t.replace(/\s+/g, " "); // acá sí da igual, es solo para regex global
  const m1 = joined.match(/INCHL[A-Z0-9<]{15,}/)?.[0] ?? "";
  const m2 = joined.match(/\b\d{6}[0-9A-Z<]{15,}\b/)?.[0] ?? "";
  const m3 = joined.match(/\b[A-Z<]{5,}<<[A-Z<]{3,}[A-Z<]*\b/)?.[0] ?? "";

  if (m1 && m2 && m3) return { l1: normalizeMrzLine(m1), l2: normalizeMrzLine(m2), l3: normalizeMrzLine(m3), ok: true };

  return { l1: "", l2: "", l3: "", ok: false };
}

function parseMrz(text: string) {
  return getMrzTriplet(text);
}

function extractRut(text: string) {
  // 1) MRZ: en línea 2 suele venir ...CHL10216112<2...
  const { l2 } = parseMrz(text);
  const mrzRut = l2.match(/CHL(\d{7,8})<([0-9K])/) || l2.match(/CHL(\d{7,8})([0-9K])/);
  if (mrzRut?.[1] && mrzRut?.[2]) {
    return normalizeRut(`${mrzRut[1]}-${mrzRut[2]}`);
  }

  // 2) Texto normal (fallback)
  const m =
    text.match(/\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/g) ||
    text.match(/\b\d{7,8}-[\dkK]\b/g);

  if (!m || m.length === 0) return "";
  return normalizeRut(m[0]);
}

function extractBirthDate(text: string) {
  // 1) MRZ: la línea 2 comienza con YYMMDD (ej: 790309 -> 1979-03-09)
  const { l2 } = parseMrz(text);
  const mMrz = l2.match(/^(\d{2})(\d{2})(\d{2})/);
  if (mMrz) {
    const yy = parseInt(mMrz[1], 10);
    const mm = mMrz[2];
    const dd = mMrz[3];

    // Heurística siglo (cédulas actuales: 1900/2000)
    const yyyy = yy >= 30 ? `19${String(yy).padStart(2, "0")}` : `20${String(yy).padStart(2, "0")}`;
    return `${yyyy}-${mm}-${dd}`;
  }

  // 2) formatos numéricos: 27/12/1984 o 27-12-1984
  const mNum = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (mNum) {
    const dd = String(mNum[1]).padStart(2, "0");
    const mm = String(mNum[2]).padStart(2, "0");
    const yyyy = mNum[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // 3) formatos típicos cédula: "27 DIC 1984"
  const months: Record<string, string> = {
    ENE: "01",
    FEB: "02",
    MAR: "03",
    ABR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AGO: "08",
    SEP: "09",
    SET: "09",
    OCT: "10",
    NOV: "11",
    DIC: "12",
  };

  const cleaned = text
    .toUpperCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ");

  const mTxt = cleaned.match(
    /\b(\d{1,2})\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|SET|OCT|NOV|DIC)\s+(\d{4})\b/
  );
  if (mTxt) {
    const dd = String(mTxt[1]).padStart(2, "0");
    const mm = months[mTxt[2]] ?? "";
    const yyyy = mTxt[3];
    if (mm) return `${yyyy}-${mm}-${dd}`;
  }

  return "";
}

function extractNationality(text: string) {
  if (/CHILEN[AO]/i.test(text)) return "Chilena";
  return "";
}

function extractDocumentNumberFront(text: string) {
  // En cédula chilena aparece como "NÚMERO DOCUMENTO" o "NUMERO DOCUMENTO"
  // y suele venir con puntos: 532.437.165
  const t = text
    .toUpperCase()
    .replace(/\r/g, "\n")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 1) "NUMERO DOCUMENTO 532.437.165"
  const m1 = t.match(/\bNUM(?:ERO)?\s+DOCUMENTO\b\s*[:\-]?\s*([0-9.\s]{7,15})/);
  if (m1?.[1]) {
    const cleaned = m1[1].replace(/\s/g, "").match(/[0-9.]+/)?.[0] ?? "";
    if (cleaned) return cleaned;
  }

  // 2) "N° DOCUMENTO 532.437.165"
  const m2 = t.match(/\bN[°ºO]?\s*DOCUMENTO\b\s*[:\-]?\s*([0-9.\s]{7,15})/);
  if (m2?.[1]) {
    const cleaned = m2[1].replace(/\s/g, "").match(/[0-9.]+/)?.[0] ?? "";
    if (cleaned) return cleaned;
  }

  // 3) fallback: primer número con puntos tipo 123.456.789 (9 dígitos)
  const m3 = t.match(/\b\d{1,3}\.\d{3}\.\d{3}\b/);
  return m3?.[0] ?? "";
}

function extractSerie(text: string) {
  // 1) MRZ línea 1: INCHL531817142...
  const { l1 } = parseMrz(text);
  const mrzDoc = l1.match(/^INCHL(\d{9})/);
  if (mrzDoc?.[1]) return mrzDoc[1];

  const t = text
    .toUpperCase()
    .replace(/\r/g, "\n")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 2) Frente: "NUMERO DOCUMENTO 531.817.142"
  const mFront = t.match(/\bNUM(?:ERO)?\s*(?:DE\s*)?DOCUMENTO\b\s*[:\-]?\s*([0-9.\s]{7,15})/);
  if (mFront?.[1]) {
    const digits = mFront[1].replace(/[^\d]/g, "");
    if (digits.length >= 8) return digits;
  }

  // 3) patrones explícitos antiguos (fallback)
  const patterns = [
    /\bSERIE\b\s*[:\-]?\s*([A-Z0-9]{6,14})/,
    /\bN[°ºO]?\s*DOCUMENTO\b\s*[:\-]?\s*([A-Z0-9]{6,14})/,
    /\bN[°ºO]?\s*DOC\b\s*[:\-]?\s*([A-Z0-9]{6,14})/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m?.[1]) return m[1].trim().toUpperCase();
  }

  return "";
}

function extractName(text: string) {
  // 1) MRZ línea 3: MORAGA<LEIGH<<JUAN<PABLO<<<<<
  const { l3 } = parseMrz(text);
  if (l3 && l3.includes("<<")) {
    const [lastRaw, firstRaw] = l3.split("<<");
    const last = (lastRaw || "").split("<").filter(Boolean).join(" ").trim();
    const first = (firstRaw || "").split("<").filter(Boolean).join(" ").trim();

    const full = `${first} ${last}`.replace(/\s+/g, " ").trim();
    if (full.length >= 6) return full;
  }

  // 2) fallback: NOMBRES/APELLIDOS si aparecen
  const t = text
    .toUpperCase()
    .replace(/\r/g, "\n")
    .replace(/[|]/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .trim();

  const nombres = t.match(/NOMBRES?\s*\n+([A-ZÁÉÍÓÚÑ ]{3,})/i)?.[1]?.trim() ?? "";
  const apellidos = t.match(/APELLIDOS?\s*\n+([A-ZÁÉÍÓÚÑ ]{3,})/i)?.[1]?.trim() ?? "";
  const full1 = `${nombres} ${apellidos}`.trim().replace(/\s+/g, " ");
  if (full1 && full1.length >= 8) return full1;

  return nombres ? nombres.replace(/\s+/g, " ").trim() : "";
}

function parseMrzFromBack(text: string): Partial<Parsed> {
  const lines = text
    .toUpperCase()
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Candidatos MRZ: líneas con muchos "<"
  const mrz = lines.filter((l) => l.includes("<") && l.length >= 20);
  if (mrz.length < 2) return {};

  // Normalmente las dos últimas líneas son las buenas
  const line1 = mrz[mrz.length - 2];
  const line2 = mrz[mrz.length - 1];

  // NOMBRE: viene como APELLIDO1<APELLIDO2<<NOMBRES...
  let nombre = "";
  const namePart = line1.split("<<");
  if (namePart.length >= 2) {
    const apellidos = (namePart[0] ?? "").replace(/</g, " ").replace(/\s+/g, " ").trim();
    const nombres = (namePart[1] ?? "").replace(/</g, " ").replace(/\s+/g, " ").trim();
    const full = `${nombres} ${apellidos}`.replace(/\s+/g, " ").trim();
    if (full.length >= 6) nombre = full;
  }

  // RUT: en la línea 2 suele venir "...CHL15962234<7..."
  // Tomamos 8 dígitos + DV que viene después de "<"
  let rut = "";
  const mRut = line2.match(/\bCHL(\d{7,8})<([0-9K])\b/);
  if (mRut) {
    const num = mRut[1];
    const dv = mRut[2];
    rut = normalizeRut(`${num}-${dv}`);
  }

  // NACIMIENTO: en MRZ viene como YYMMDD (posiciones típicas después del primer bloque),
  // aquí lo sacamos por regex simple: 6 dígitos seguidos de letra sexo (F/M).
  let nacimiento = "";
  const mBirth = line2.match(/\b(\d{6})([FM])\b/);
  if (mBirth) {
    const yymmdd = mBirth[1];
    const yy = yymmdd.slice(0, 2);
    const mm = yymmdd.slice(2, 4);
    const dd = yymmdd.slice(4, 6);
    // Heurística siglo (para cédulas actuales, casi siempre 19xx o 20xx).
    // Si yy > 30 => 19yy, si no => 20yy
    const yyyy = Number(yy) > 30 ? `19${yy}` : `20${yy}`;
    nacimiento = `${yyyy}-${mm}-${dd}`;
  }

  const out: Partial<Parsed> = {};
  if (nombre) out.nombre = nombre;
  if (rut) out.rut = rut;
  if (nacimiento) out.nacimiento = nacimiento;
  return out;
}

async function getImageOrientationHint(file: File): Promise<"ok" | "rotate90"> {
  // MVP: si es MUCHO más alto que ancho, probablemente viene girado/vertical.
  const imgUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("No pude leer la imagen"));
      img.src = imgUrl;
    });
    return img.height > img.width * 1.25 ? "rotate90" : "ok";
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

export default function OCRPage() {
  const router = useRouter();

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  const [frontOk, setFrontOk] = useState(false);
  const [backOk, setBackOk] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrOk, setOcrOk] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [orientationHint, setOrientationHint] = useState<string | null>(null);

  const empty = useMemo<Parsed>(
    () => ({
      nombre: "",
      rut: "",
      nacimiento: "",
      nacionalidad: "",
      serie: "",
    }),
    []
  );

  // Inputs editables
  const [form, setForm] = useState<Parsed>(empty);

  const doneUploads = frontOk && backOk;
  const canContinue = doneUploads;

  async function uploadSide(side: "front" | "back", file: File) {
    const fd = new FormData();
    fd.append("side", side);
    fd.append("file", file);

    const res = await fetch("/api/onboarding/id-document", {
      method: "POST",
      body: fd,
    });

    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) throw new Error(data?.error ?? "No pude subir el documento");
    return data as { ok: boolean; side: string; path: string };
  }

  async function runOcrClient() {
    if (!frontFile || !backFile) return;

    setError(null);
    setOrientationHint(null);
    setOcrLoading(true);
    setOcrOk(false);
    setOcrProgress(0);

    try {
      // MVP: obligar a subir “derecho”
      const hintFront = await getImageOrientationHint(frontFile);
      const hintBack = await getImageOrientationHint(backFile);
      if (hintFront === "rotate90" || hintBack === "rotate90") {
        setOrientationHint("Sube el carnet DERECHO (horizontal). Si está girado, el OCR no funciona.");
        setOcrOk(false);
        setOcrProgress(0);
        return;
      }

      // Import dinámico
      const Tesseract = await import("tesseract.js");

      const worker = await Tesseract.createWorker("eng+spa", 1, {
        logger: (m: any) => {
          if (m?.status === "recognizing text" && typeof m?.progress === "number") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      // reducir basura de caracteres
      await worker.setParameters({
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑabcdefghijklmnopqrstuvwxyzáéíóúñ0123456789<->./ ",
      });

      const front = await worker.recognize(frontFile);
      setOcrProgress(60);
      const back = await worker.recognize(backFile);
      setOcrProgress(95);

      await worker.terminate();

      const rawTextFront = (front?.data?.text ?? "").trim();
      const rawTextBack = (back?.data?.text ?? "").trim();
      console.log("=== OCR BACK RAW ===");
      console.log(rawTextBack);
      console.log("=== MRZ PARSED ===", parseMrz(rawTextBack));
      const rawAll = `${rawTextFront}\n${rawTextBack}`;

      const mrz = parseMrzFromBack(rawTextBack);

      const parsed: Parsed = {
        // 1) Nombre: MRZ manda. Si no hay MRZ, cae a heurística.
        nombre: mrz.nombre || extractName(rawAll) || "",

        // 2) RUT: MRZ manda. Si no hay MRZ, cae a regex general.
        rut: mrz.rut || extractRut(rawAll) || "",

        // 3) Nacimiento: MRZ o heurística (y tu extractor ya soporta "27 DIC 1984")
        nacimiento: mrz.nacimiento || extractBirthDate(rawAll) || "",

        // 4) Nacionalidad: en tu caso basta "CHILENA"
        nacionalidad: extractNationality(rawAll) || "",

        // 5) "Serie": sacar desde MRZ del reverso (más confiable). Fallback al frente.
        serie: extractSerie(rawTextBack) || extractSerie(rawTextFront) || "",
      };

      setForm(parsed);
      setOcrOk(true);
      setOcrProgress(100);
    } catch (e: any) {
      setError(e?.message ?? "OCR falló");
      setOcrOk(false);
      setOcrProgress(0);
    } finally {
      setOcrLoading(false);
    }
  }

  return (
    <OnboardingShell title={copy.ocr.title} subtitle={copy.ocr.subtitle}>
      <div className="space-y-4">
        {/* Upload front/back */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UploadCard
            title="Documento – Frente"
            previewUrl={frontPreview}
            uploading={uploadingFront}
            ok={frontOk}
            onPick={async (file) => {
              setError(null);
              setOrientationHint(null);
              setFrontFile(file);
              setFrontPreview(URL.createObjectURL(file));

              setUploadingFront(true);
              setFrontOk(false);
              setOcrOk(false);
              try {
                await uploadSide("front", file);
                setFrontOk(true);
              } catch (e: any) {
                setFrontOk(false);
                setError(e?.message ?? "Error subiendo frente");
              } finally {
                setUploadingFront(false);
              }
            }}
          />

          <UploadCard
            title="Documento – Reverso"
            previewUrl={backPreview}
            uploading={uploadingBack}
            ok={backOk}
            onPick={async (file) => {
              setError(null);
              setOrientationHint(null);
              setBackFile(file);
              setBackPreview(URL.createObjectURL(file));

              setUploadingBack(true);
              setBackOk(false);
              setOcrOk(false);
              try {
                await uploadSide("back", file);
                setBackOk(true);
              } catch (e: any) {
                setBackOk(false);
                setError(e?.message ?? "Error subiendo reverso");
              } finally {
                setUploadingBack(false);
              }
            }}
          />
        </div>

        {/* OCR button */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (!doneUploads) return;
              runOcrClient();
            }}
            disabled={!doneUploads || ocrLoading}
            className="k21-btn-secondary flex-1 h-11 disabled:opacity-50"
            title={!doneUploads ? "Sube frente y reverso para ejecutar OCR" : ""}
          >
            {ocrLoading
              ? `Leyendo OCR… ${ocrProgress}%`
              : ocrOk
              ? "OCR listo ✅ (releer)"
              : "Leer datos"}
          </button>
        </div>

        {/* orientación */}
        {orientationHint && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            {orientationHint}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Inputs editables */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-medium mb-2 text-white">{copy.ocr.detectedTitle}</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <InputField
              label="Nombre"
              placeholder="Nombre completo"
              value={form.nombre}
              disabled={!doneUploads}
              onChange={(v) => setForm((p) => ({ ...p, nombre: v }))}
            />
            <InputField
              label="RUT"
              placeholder="12345678-9"
              value={form.rut}
              disabled={!doneUploads}
              onChange={(v) => setForm((p) => ({ ...p, rut: v }))}
            />
            <InputField
              label="Nacimiento"
              placeholder="YYYY-MM-DD"
              value={form.nacimiento}
              disabled={!doneUploads}
              onChange={(v) => setForm((p) => ({ ...p, nacimiento: v }))}
            />
            <InputField
              label="Nacionalidad"
              placeholder="Chilena"
              value={form.nacionalidad}
              disabled={!doneUploads}
              onChange={(v) => setForm((p) => ({ ...p, nacionalidad: v }))}
            />
            <InputField
              label="N° Documento"
              placeholder="Ej: 531817142"
              value={form.serie}
              disabled={!doneUploads}
              onChange={(v) => setForm((p) => ({ ...p, serie: v }))}
            />
          </div>

          <div className="mt-3 text-xs text-white/50">
            {!doneUploads
              ? "Sube frente y reverso para habilitar edición."
              : ocrOk
              ? "OCR corrió. Revisa y edita los datos antes de continuar."
              : "Sube ambos lados y ejecuta OCR. (Recomendación MVP: foto derecha, sin reflejos)."}
          </div>
        </div>

        {/* Continue */}
        <div className="mt-2 flex gap-3">
          <button
            onClick={async () => {
              if (!canContinue) return;

              const res = await fetch("/api/onboarding/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fullName: form.nombre,
                  rut: form.rut,
                  birthDate: form.nacimiento,
                  nationality: form.nacionalidad,
                  documentSerial: form.serie,
                }),
              });

              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                alert((data as any)?.error ?? "No pude guardar el perfil");
                return;
              }

              router.refresh();
            }}
            disabled={!canContinue}
            className="k21-btn-primary flex-1 h-11 disabled:opacity-50"
            title={!canContinue ? "Sube frente y reverso para continuar" : ""}
          >
            {copy.ocr.btnContinue}
          </button>

          <button onClick={() => router.back()} className="k21-btn-secondary flex-1 h-11">
            {copy.ocr.btnBack}
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}

function InputField({
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-xs text-white/50">{label}</div>
      <input
        className="mt-1 w-full bg-transparent text-white/90 outline-none placeholder:text-white/30"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function UploadCard({
  title,
  previewUrl,
  uploading,
  ok,
  onPick,
}: {
  title: string;
  previewUrl: string | null;
  uploading: boolean;
  ok: boolean;
  onPick: (f: File) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs">
          {uploading ? (
            <span className="text-white/60">Subiendo…</span>
          ) : ok ? (
            <span className="text-emerald-300">Listo ✅</span>
          ) : (
            <span className="text-white/40">Pendiente</span>
          )}
        </div>
      </div>

      {previewUrl ? (
        <img
          src={previewUrl}
          alt={title}
          className="w-full h-48 object-contain rounded-lg border border-white/10 bg-black/20"
        />
      ) : (
        <div className="h-48 flex items-center justify-center rounded-lg border border-dashed border-white/20 text-white/40 text-sm">
          Sube una foto DERECHA (horizontal)
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
        className="text-sm text-white/80"
        disabled={uploading}
      />

      <div className="text-[11px] text-white/40">
        {uploading ? "No cierres la pestaña mientras sube." : "JPG/PNG/WebP. Foto derecha, sin reflejos."}
      </div>
    </div>
  );
}
