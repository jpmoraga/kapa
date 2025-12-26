"use client";

import { useEffect, useState } from "react";
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

  async function pick(companyId: string) {
    setLoadingId(companyId);

    const res = await fetch("/api/auth/active-company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });

    setLoadingId(null);

    if (!res.ok) {
      alert("No pude seleccionar la cuenta (no autorizada o error).");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  // ✅ Auto-seleccionar SOLO si hay 1 cuenta total
  useEffect(() => {
    if (companies.length === 1) pick(companies[0].companyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Selecciona una cuenta</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Elegir cuenta define el contexto del dashboard.
        </p>

        <div className="mt-6 space-y-2">
          {companies.map((c) => (
            <button
              key={c.companyId}
              onClick={() => pick(c.companyId)}
              disabled={!!loadingId}
              className="w-full rounded-xl border px-4 py-3 text-left hover:bg-neutral-50 disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{c.name}</div>
                <span className="rounded-full border px-2 py-0.5 text-xs text-neutral-700">
                  {kindLabel(c.kind)}
                </span>
              </div>

              <div className="mt-1 text-sm text-neutral-600">Rol: {c.role}</div>

              {loadingId === c.companyId && (
                <div className="text-xs text-neutral-500 mt-1">Seleccionando...</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}