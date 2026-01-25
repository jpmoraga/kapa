"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../_components/OnboardingShell";
import { onboardingCopy as copy } from "../_copy";

type PerfStore = { navStart?: number; from?: string };

export default function PersonalPage() {
  const router = useRouter();
  const perfEnabled = process.env.NEXT_PUBLIC_DEBUG_PERF === "1";

  const [fullName, setFullName] = useState("");
  const [rut, setRut] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [needsNameRut, setNeedsNameRut] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const res = await fetch("/api/onboarding/profile");
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !active) return;

        const existingFullName = typeof data.fullName === "string" ? data.fullName.trim() : "";
        const existingRut = typeof data.rut === "string" ? data.rut.trim() : "";
        const existingPhone = typeof data.phone === "string" ? data.phone.trim() : "";

        if (existingFullName) setFullName(existingFullName);
        if (existingRut) setRut(existingRut);
        if (existingPhone) setPhone(existingPhone);

        setNeedsNameRut(!(existingFullName && existingRut));
      } catch {
        // ignore
      } finally {
        if (active) setProfileLoaded(true);
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  if (!profileLoaded) {
    return (
      <OnboardingShell title="Cargando...">
        <div className="text-sm text-neutral-400">Cargando…</div>
      </OnboardingShell>
    );
  }

  async function onContinue() {
    const normalizedPhone = phone.trim();
    const normalizedFullName = fullName.trim();
    const normalizedRut = rut.trim();
    const phoneOnly = profileLoaded && !needsNameRut;

    if (phoneOnly) {
      if (!normalizedPhone) {
        setError("Completa tu teléfono para continuar.");
        return;
      }
    } else {
      if (!normalizedFullName || !normalizedRut || !normalizedPhone) {
        setError("Completa nombre, RUT y teléfono para continuar.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (perfEnabled) {
        const now = performance.now();
        (globalThis as typeof globalThis & { __k21Perf?: PerfStore }).__k21Perf = {
          navStart: now,
          from: "personal",
        };
        console.info("perf:onboarding_click", {
          step: "personal",
          t: Math.round(now),
        });
      }
      const payload: { fullName?: string; rut?: string; phone: string } = {
        phone: normalizedPhone,
      };

      if (!phoneOnly) {
        payload.fullName = normalizedFullName;
        payload.rut = normalizedRut;
      }

      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const phoneOnly = !needsNameRut;
  const canContinue = profileLoaded
    ? phoneOnly
      ? Boolean(phone.trim())
      : Boolean(fullName.trim() && rut.trim() && phone.trim())
    : false;

  return (
    <OnboardingShell
      title={phoneOnly ? copy.personal.titlePhoneOnly : copy.personal.title}
      subtitle={phoneOnly ? copy.personal.subtitlePhoneOnly : copy.personal.subtitle}
    >
      <div className="grid gap-3">
        {!phoneOnly ? (
          <>
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
          </>
        ) : null}

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
          disabled={loading || !canContinue}
          className="k21-btn-primary flex-1 h-11 disabled:opacity-60"
        >
          {loading ? "Guardando..." : copy.personal.btnContinue}
        </button>
      </div>
    </OnboardingShell>
  );
}
