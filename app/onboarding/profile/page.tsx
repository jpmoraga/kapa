"use client";

import { useMemo, useState } from "react";
import OnboardingShell from "../_components/OnboardingShell";

type OcrData = {
  fullName: string;
  rut: string;
  birthDate: string;
  docNumber: string;
};

function normalizeRut(raw: string) {
  return raw.replace(/[^\dkK]/g, "").toUpperCase();
}

export default function ProfilePage() {
  const [fileName, setFileName] = useState<string | null>(null);

  const [ocr, setOcr] = useState<OcrData>({
    fullName: "",
    rut: "",
    birthDate: "",
    docNumber: "",
  });

  const isReady = useMemo(() => {
    return (
      ocr.fullName.trim().length >= 3 &&
      normalizeRut(ocr.rut).length >= 8 &&
      ocr.birthDate.trim().length >= 8
    );
  }, [ocr]);

  return (
    <OnboardingShell
      title="Verificación de identidad"
      subtitle="Sube una foto del carnet. (Demo: OCR simulado)"
    >
      <div className="grid gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-medium text-white">Foto del carnet</div>

          <label className="mt-3 block cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFileName(f?.name ?? null);
              }}
            />
            {fileName ? `Archivo: ${fileName}` : "Seleccionar imagen (JPG/PNG)"}
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setOcr({
                  fullName: "Juan Pablo Moraga",
                  rut: "12.345.678-5",
                  birthDate: "1979-01-01",
                  docNumber: "A1234567",
                })
              }
              className="k21-btn-primary h-10 px-4"
            >
              Simular OCR
            </button>

            <button
              type="button"
              onClick={() =>
                setOcr({
                  fullName: "",
                  rut: "",
                  birthDate: "",
                  docNumber: "",
                })
              }
              className="k21-btn-secondary h-10 px-4"
            >
              Limpiar
            </button>

            {!isReady && (
              <span className="self-center text-xs text-white/50">
                Completa nombre, RUT y fecha de nacimiento para continuar.
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="text-xs text-white/60">Nombre completo</label>
            <input
              value={ocr.fullName}
              onChange={(e) => setOcr((p) => ({ ...p, fullName: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/10"
              placeholder="Tu nombre"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-white/60">RUT</label>
              <input
                value={ocr.rut}
                onChange={(e) => setOcr((p) => ({ ...p, rut: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/10"
                placeholder="12.345.678-5"
              />
            </div>

            <div>
              <label className="text-xs text-white/60">Fecha de nacimiento</label>
              <input
                value={ocr.birthDate}
                onChange={(e) => setOcr((p) => ({ ...p, birthDate: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/10"
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/60">N° documento (opcional)</label>
            <input
              value={ocr.docNumber}
              onChange={(e) => setOcr((p) => ({ ...p, docNumber: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/10"
              placeholder="A1234567"
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
          Nota: hoy no guardamos en DB. Solo dejamos el flujo y UI listos para mostrarlo.
        </div>
      </div>
    </OnboardingShell>
  );
}