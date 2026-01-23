"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
  companyId: string;
  name: string;
  role: string;
  kind: "PERSONAL" | "BUSINESS";
};

function kindLabel(kind: Company["kind"]) {
  return kind === "PERSONAL" ? "Cuenta personal" : "Empresa";
}

export default function SelectCompanyClient({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Candado: evita que el auto-pick se dispare 2 veces (React StrictMode en dev)
  const didAutoPick = useRef(false);

  async function pick(companyId: string) {
    setError(null);
    setLoadingId(companyId);

    const res = await fetch("/api/auth/active-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });

    setLoadingId(null);

    if (!res.ok) {
      setError("No pude seleccionar la cuenta (no autorizada o error).");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  // ✅ Auto-seleccionar SOLO si hay 1 cuenta total
  useEffect(() => {
    if (didAutoPick.current) return;

    if (companies.length === 1) {
      didAutoPick.current = true;
      pick(companies[0].companyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies.length]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-sm text-white/60">Kapa21</div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Selecciona una cuenta</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Elegir cuenta define el contexto del dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {companies.map((c) => {
            const isLoading = loadingId === c.companyId;

            return (
              <button
                key={c.companyId}
                onClick={() => pick(c.companyId)}
                disabled={!!loadingId}
                className={[
                  "w-full rounded-xl border px-4 py-3 text-left transition",
                  "border-neutral-800 bg-neutral-950 hover:bg-neutral-900",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-white">{c.name}</div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-neutral-200">
                    {kindLabel(c.kind)}
                  </span>
                </div>

                <div className="mt-1 text-sm text-neutral-400">Rol: {c.role}</div>

                {isLoading && (
                  <div className="mt-1 text-xs text-neutral-500">Seleccionando…</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 text-xs text-neutral-500">
          Tip: si no quieres ver esta pantalla casi nunca, deja una cuenta activa seleccionada.
        </div>
      </div>
    </div>
  );
}