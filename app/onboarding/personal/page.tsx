"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PersonalOnboardingPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [rut, setRut] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/onboarding/personal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, rut, phone }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("No pudimos guardar tus datos. Intenta nuevamente.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold mb-2">
          Completa tu perfil personal
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          Necesitamos estos datos para habilitar funciones financieras.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm">Nombre completo</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm">RUT</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="12.345.678-9"
              required
            />
          </div>

          <div>
            <label className="text-sm">Teléfono</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-black py-2 text-white disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}