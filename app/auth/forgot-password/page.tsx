"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) {
      setError("Ingresa tu email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "No se pudo procesar la solicitud.");
        return;
      }

      setMessage(
        data?.message ??
          "Si el correo existe, enviaremos instrucciones para restablecer la contraseña."
      );
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 px-4 text-neutral-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center">
        <div className="w-full k21-card p-6">
          <div className="mb-6">
            <div className="text-sm text-white/60">Kapa21</div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Recuperar contraseña
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Te enviaremos un enlace temporal para restablecer tu acceso.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/80">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="tucorreo@correo.cl"
              />
            </div>

            {message ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              disabled={loading}
              type="submit"
              className="w-full k21-btn-primary disabled:opacity-60"
            >
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>

          <div className="mt-4 text-sm text-white/60">
            <Link href="/auth/login" className="underline">
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
