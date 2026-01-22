"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../_components/OnboardingShell";
import { onboardingCopy as copy } from "../_copy";

export default function PersonalPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [rut, setRut] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onContinue() {
    const normalizedPhone = phone.trim();
    const normalizedFullName = fullName.trim();
    const normalizedRut = rut.trim();

    if (!normalizedFullName || !normalizedRut || !normalizedPhone) {
      setError("Completa nombre, RUT y teléfono para continuar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: normalizedFullName,
          rut: normalizedRut,
          phone: normalizedPhone,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "No pude guardar tu información.");
        return;
      }

      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell title={copy.personal.title} subtitle={copy.personal.subtitle}>
      <div className="grid gap-3">
        <div>
          <label className="text-xs text-neutral-400">Nombre completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-white/10"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-400">RUT</label>
          <input
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-white/10"
            placeholder="12.345.678-9"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-400">{copy.personal.phoneLabel}</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-white/10"
            placeholder={copy.personal.phonePlaceholder}
          />
        </div>
      </div>

      <div className="mt-5 k21-badge">{copy.personal.badge}</div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={() => router.back()} className="k21-btn-secondary flex-1 h-11">
          {copy.personal.btnBack}
        </button>
        <button
          onClick={onContinue}
          disabled={loading || !fullName.trim() || !rut.trim() || !phone.trim()}
          className="k21-btn-primary flex-1 h-11 disabled:opacity-60"
        >
          {loading ? "Guardando..." : copy.personal.btnContinue}
        </button>
      </div>
    </OnboardingShell>
  );
}
