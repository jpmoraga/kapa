"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ApiResp =
  | { ok: true; onboarding?: any }
  | { ok?: false; error: string; onboarding?: any };

export default function OnboardingProfileForm() {
  const router = useRouter();
  const sp = useSearchParams();

  const returnTo = useMemo(() => {
    const r = sp.get("returnTo");
    return r && r.startsWith("/") ? r : "/dashboard";
  }, [sp]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [rut, setRut] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);

    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, phone, rut }),
      });

      const data = (await res.json().catch(() => ({}))) as ApiResp;

      if (!res.ok) {
        setMsg(("error" in data ? (data as any).error : null) ?? "No se pudo guardar.");
        return;
      }

      // si guardó bien: volvemos a donde venías
      router.push(returnTo);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-white/70">Nombre completo</label>
        <input
          className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ej: Juan Pablo Moraga"
        />
      </div>

      <div>
        <label className="text-sm text-white/70">Teléfono</label>
        <input
          className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej: +56 9 1234 5678"
        />
      </div>

      <div>
        <label className="text-sm text-white/70">RUT</label>
        <input
          className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 p-3 outline-none"
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          placeholder="Ej: 12.345.678-9"
        />
      </div>

      {msg ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">
          {msg}
        </div>
      ) : null}

      <button
        disabled={saving}
        className="w-full rounded-xl bg-white text-black py-3 font-medium disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}