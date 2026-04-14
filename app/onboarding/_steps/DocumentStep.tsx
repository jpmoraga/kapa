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

type PerfStore = { navStart?: number; from?: string };

function normalizeRut(rut: string) {
  return rut
    .replace(/\./g, "")
    .replace(/\s/g, "")
    .replace(/–/g, "-")
    .toUpperCase();
}

function onlyMrzCharsKeepLines(value: string) {
  return value
    .toUpperCase()
    .replace(/\r/g, "\n")
    .replace(/[^A-Z0-9<\n]/g, " ");
}

function normalizeMrzLine(line: string) {
  return line.replace(/\s+/g, "").replace(/[^A-Z0-9<]/g, "");
}

function getMrzTriplet(text: string) {
  const normalized = onlyMrzCharsKeepLines(text);

  const rawLines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizeMrzLine)
    .filter((line) => line.length >= 20 && line.includes("<"));

  for (let index = 0; index < rawLines.length; index += 1) {
    const l1 = rawLines[index];
    if (!l1.startsWith("INCHL")) continue;

    const l2 = rawLines[index + 1] ?? "";
    const l3 = rawLines[index + 2] ?? "";

    const ok2 = /^\d{6}[0-9A-Z<]{10,}$/.test(l2);
    const ok3 = /^[A-Z<]{5,}<<[A-Z<]{3,}/.test(l3);

    if (ok2 && ok3) return { l1, l2, l3, ok: true };
  }

  const joined = normalized.replace(/\s+/g, " ");
  const l1 = joined.match(/INCHL[A-Z0-9<]{15,}/)?.[0] ?? "";
  const l2 = joined.match(/\b\d{6}[0-9A-Z<]{15,}\b/)?.[0] ?? "";
  const l3 = joined.match(/\b[A-Z<]{5,}<<[A-Z<]{3,}[A-Z<]*\b/)?.[0] ?? "";

  if (l1 && l2 && l3) {
    return {
      l1: normalizeMrzLine(l1),
      l2: normalizeMrzLine(l2),
      l3: normalizeMrzLine(l3),
      ok: true,
    };
  }

  return { l1: "", l2: "", l3: "", ok: false };
}

function parseMrz(text: string) {
  return getMrzTriplet(text);
}

function extractRut(text: string) {
  const { l2 } = parseMrz(text);
  const mrzRut = l2.match(/CHL(\d{7,8})<([0-9K])/) || l2.match(/CHL(\d{7,8})([0-9K])/);
  if (mrzRut?.[1] && mrzRut?.[2]) {
    return normalizeRut(`${mrzRut[1]}-${mrzRut[2]}`);
  }

  const match =
    text.match(/\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/g) ||
    text.match(/\b\d{7,8}-[\dkK]\b/g);

  if (!match || match.length === 0) return "";
  return normalizeRut(match[0]);
}

function extractBirthDate(text: string) {
  const { l2 } = parseMrz(text);
  const mrzBirth = l2.match(/^(\d{2})(\d{2})(\d{2})/);
  if (mrzBirth) {
    const yy = parseInt(mrzBirth[1], 10);
    const mm = mrzBirth[2];
    const dd = mrzBirth[3];
    const yyyy = yy >= 30 ? `19${String(yy).padStart(2, "0")}` : `20${String(yy).padStart(2, "0")}`;
    return `${yyyy}-${mm}-${dd}`;
  }

  const numericMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (numericMatch) {
    const dd = String(numericMatch[1]).padStart(2, "0");
    const mm = String(numericMatch[2]).padStart(2, "0");
    const yyyy = numericMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }

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

  const cleaned = text.toUpperCase().replace(/[.,]/g, " ").replace(/\s+/g, " ");
  const textualMatch = cleaned.match(
    /\b(\d{1,2})\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|SET|OCT|NOV|DIC)\s+(\d{4})\b/
  );
  if (textualMatch) {
    const dd = String(textualMatch[1]).padStart(2, "0");
    const mm = months[textualMatch[2]] ?? "";
    const yyyy = textualMatch[3];
    if (mm) return `${yyyy}-${mm}-${dd}`;
  }

  return "";
}

function extractNationality(text: string) {
  if (/CHILEN[AO]/i.test(text)) return "Chilena";
  return "";
}

function extractSerie(text: string) {
  const { l1 } = parseMrz(text);
  const mrzDocument = l1.match(/^INCHL(\d{9})/);
  if (mrzDocument?.[1]) return mrzDocument[1];

  const normalized = text
    .toUpperCase()
    .replace(/\r/g, "\n")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const frontMatch = normalized.match(
    /\bNUM(?:ERO)?\s*(?:DE\s*)?DOCUMENTO\b\s*[:\-]?\s*([0-9.\s]{7,15})/
  );
  if (frontMatch?.[1]) {
    const digits = frontMatch[1].replace(/[^\d]/g, "");
    if (digits.length >= 8) return digits;
  }

  const patterns = [
    /\bSERIE\b\s*[:\-]?\s*([A-Z0-9]{6,14})/,
    /\bN[°ºO]?\s*DOCUMENTO\b\s*[:\-]?\s*([A-Z0-9]{6,14})/,
    /\bN[°ºO]?\s*DOC\b\s*[:\-]?\s*([A-Z0-9]{6,14})/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1].trim().toUpperCase();
  }

  return "";
}

function extractName(text: string) {
  const { l3 } = parseMrz(text);
  if (l3 && l3.includes("<<")) {
    const [lastRaw, firstRaw] = l3.split("<<");
    const last = (lastRaw || "").split("<").filter(Boolean).join(" ").trim();
    const first = (firstRaw || "").split("<").filter(Boolean).join(" ").trim();
    const full = `${first} ${last}`.replace(/\s+/g, " ").trim();
    if (full.length >= 6) return full;
  }

  const normalized = text
    .toUpperCase()
    .replace(/\r/g, "\n")
    .replace(/[|]/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .trim();

  const nombres = normalized.match(/NOMBRES?\s*\n+([A-ZÁÉÍÓÚÑ ]{3,})/i)?.[1]?.trim() ?? "";
  const apellidos = normalized.match(/APELLIDOS?\s*\n+([A-ZÁÉÍÓÚÑ ]{3,})/i)?.[1]?.trim() ?? "";
  const full = `${nombres} ${apellidos}`.trim().replace(/\s+/g, " ");
  if (full && full.length >= 8) return full;

  return nombres ? nombres.replace(/\s+/g, " ").trim() : "";
}

function parseMrzFromBack(text: string): Partial<Parsed> {
  const lines = text
    .toUpperCase()
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const mrzLines = lines.filter((line) => line.includes("<") && line.length >= 20);
  if (mrzLines.length < 2) return {};

  const line1 = mrzLines[mrzLines.length - 2];
  const line2 = mrzLines[mrzLines.length - 1];

  let nombre = "";
  const namePart = line1.split("<<");
  if (namePart.length >= 2) {
    const apellidos = (namePart[0] ?? "").replace(/</g, " ").replace(/\s+/g, " ").trim();
    const nombres = (namePart[1] ?? "").replace(/</g, " ").replace(/\s+/g, " ").trim();
    const full = `${nombres} ${apellidos}`.replace(/\s+/g, " ").trim();
    if (full.length >= 6) nombre = full;
  }

  let rut = "";
  const rutMatch = line2.match(/\bCHL(\d{7,8})<([0-9K])\b/);
  if (rutMatch) {
    const num = rutMatch[1];
    const dv = rutMatch[2];
    rut = normalizeRut(`${num}-${dv}`);
  }

  let nacimiento = "";
  const birthMatch = line2.match(/\b(\d{6})([FM])\b/);
  if (birthMatch) {
    const yymmdd = birthMatch[1];
    const yy = yymmdd.slice(0, 2);
    const mm = yymmdd.slice(2, 4);
    const dd = yymmdd.slice(4, 6);
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

export default function DocumentStep() {
  const router = useRouter();
  const perfEnabled = process.env.NEXT_PUBLIC_DEBUG_PERF === "1";

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [frontOk, setFrontOk] = useState(false);
  const [backOk, setBackOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillOk, setPrefillOk] = useState(false);
  const [prefillProgress, setPrefillProgress] = useState<number>(0);
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

  const [form, setForm] = useState<Parsed>(empty);

  const doneUploads = frontOk && backOk;
  const hasRequiredIdentityFields = Boolean(form.nombre.trim() && form.rut.trim());
  const canContinue = doneUploads && hasRequiredIdentityFields;

  async function uploadSide(side: "front" | "back", file: File) {
    const formData = new FormData();
    formData.append("side", side);
    formData.append("file", file);

    const res = await fetch("/api/onboarding/id-document", {
      method: "POST",
      body: formData,
    });

    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) throw new Error(data?.error ?? "No pude subir el documento");
    return data as { ok: boolean; side: string; path: string };
  }

  async function runPrefillClient() {
    if (!frontFile || !backFile) return;

    setError(null);
    setOrientationHint(null);
    setPrefillLoading(true);
    setPrefillOk(false);
    setPrefillProgress(0);

    try {
      const hintFront = await getImageOrientationHint(frontFile);
      const hintBack = await getImageOrientationHint(backFile);
      if (hintFront === "rotate90" || hintBack === "rotate90") {
        setOrientationHint(
          "Sube el documento derecho (horizontal). Si está girado, el prellenado automático suele fallar."
        );
        setPrefillOk(false);
        setPrefillProgress(0);
        return;
      }

      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker("eng+spa", 1, {
        logger: (message: any) => {
          if (message?.status === "recognizing text" && typeof message?.progress === "number") {
            setPrefillProgress(Math.round(message.progress * 100));
          }
        },
      });

      await worker.setParameters({
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑabcdefghijklmnopqrstuvwxyzáéíóúñ0123456789<->./ ",
      });

      const front = await worker.recognize(frontFile);
      setPrefillProgress(60);
      const back = await worker.recognize(backFile);
      setPrefillProgress(95);
      await worker.terminate();

      const rawTextFront = (front?.data?.text ?? "").trim();
      const rawTextBack = (back?.data?.text ?? "").trim();
      const rawAll = `${rawTextFront}\n${rawTextBack}`;
      const mrz = parseMrzFromBack(rawTextBack);

      setForm({
        nombre: mrz.nombre || extractName(rawAll) || "",
        rut: mrz.rut || extractRut(rawAll) || "",
        nacimiento: mrz.nacimiento || extractBirthDate(rawAll) || "",
        nacionalidad: extractNationality(rawAll) || "",
        serie: extractSerie(rawTextBack) || extractSerie(rawTextFront) || "",
      });
      setPrefillOk(true);
      setPrefillProgress(100);
    } catch (e: any) {
      setError(
        e?.message ??
          "No pudimos prellenar los datos automáticamente. Puedes continuar completándolos manualmente."
      );
      setPrefillOk(false);
      setPrefillProgress(0);
    } finally {
      setPrefillLoading(false);
    }
  }

  return (
    <OnboardingShell title={copy.document.title} subtitle={copy.document.subtitle}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              setPrefillOk(false);

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
              setPrefillOk(false);

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

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (!doneUploads) return;
              runPrefillClient();
            }}
            disabled={!doneUploads || prefillLoading}
            className="k21-btn-secondary flex-1 h-11 disabled:opacity-50"
            title={!doneUploads ? "Sube frente y reverso para intentar el prellenado opcional" : ""}
          >
            {prefillLoading
              ? `${copy.document.prefillLoading} ${prefillProgress}%`
              : prefillOk
              ? copy.document.prefillReady
              : copy.document.prefillAction}
          </button>
        </div>

        {orientationHint && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            {orientationHint}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-medium text-white">{copy.document.detectedTitle}</div>

          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <InputField
              label="Nombre"
              placeholder="Nombre completo"
              value={form.nombre}
              disabled={!doneUploads}
              onChange={(value) => setForm((prev) => ({ ...prev, nombre: value }))}
            />
            <InputField
              label="RUT"
              placeholder="12345678-9"
              value={form.rut}
              disabled={!doneUploads}
              onChange={(value) => setForm((prev) => ({ ...prev, rut: value }))}
            />
            <InputField
              label="Nacimiento"
              placeholder="YYYY-MM-DD"
              value={form.nacimiento}
              disabled={!doneUploads}
              onChange={(value) => setForm((prev) => ({ ...prev, nacimiento: value }))}
            />
            <InputField
              label="Nacionalidad"
              placeholder="Chilena"
              value={form.nacionalidad}
              disabled={!doneUploads}
              onChange={(value) => setForm((prev) => ({ ...prev, nacionalidad: value }))}
            />
            <InputField
              label="N° Documento"
              placeholder="Ej: 531817142"
              value={form.serie}
              disabled={!doneUploads}
              onChange={(value) => setForm((prev) => ({ ...prev, serie: value }))}
            />
          </div>

          <div className="mt-3 text-xs text-white/50">
            {!doneUploads
              ? copy.document.manualHintLocked
              : prefillOk
              ? copy.document.manualHintPrefilled
              : copy.document.manualHintOptional}
          </div>
        </div>

        <div className="mt-2 flex gap-3">
          <button
            onClick={async () => {
              if (!canContinue) return;
              if (perfEnabled) {
                const now = performance.now();
                (globalThis as typeof globalThis & { __k21Perf?: PerfStore }).__k21Perf = {
                  navStart: now,
                  from: "document",
                };
                console.info("perf:onboarding_click", {
                  step: "document",
                  t: Math.round(now),
                });
              }

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

              router.push("/onboarding?step=personal");
            }}
            disabled={!canContinue}
            className="k21-btn-primary flex-1 h-11 disabled:opacity-50"
            title={
              !canContinue
                ? "Sube frente y reverso y confirma nombre y RUT para continuar"
                : ""
            }
          >
            {copy.document.btnContinue}
          </button>

          <button onClick={() => router.back()} className="k21-btn-secondary flex-1 h-11">
            {copy.document.btnBack}
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
  onChange: (value: string) => void;
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
  onPick: (file: File) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
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
          className="h-48 w-full rounded-lg border border-white/10 bg-black/20 object-contain"
        />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-white/20 text-sm text-white/40">
          Sube una foto derecha (horizontal)
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
        }}
        className="text-sm text-white/80"
        disabled={uploading}
      />

      <div className="text-[11px] text-white/40">
        {uploading
          ? "No cierres la pestaña mientras sube."
          : "JPG/PNG/WebP. Guardamos la imagen como respaldo."}
      </div>
    </div>
  );
}
