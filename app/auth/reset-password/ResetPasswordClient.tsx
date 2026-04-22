"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordClient({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Falta el token de recuperación.");
      return;
    }
    if (password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "No se pudo actualizar la contraseña.");
        return;
      }

      setSuccess(data?.message ?? "Contraseña actualizada.");
      setTimeout(() => {
        router.replace("/auth/login?reset=1");
      }, 900);
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
              Restablecer contraseña
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Elige una nueva contraseña para recuperar tu acceso.
            </p>
          </div>

          {!token ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              Este enlace no incluye un token válido. Solicita uno nuevo desde el login.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/80">Nueva contraseña</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white/80">Confirmar contraseña</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="repite la contraseña"
                />
              </div>

              {success ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  {success}
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
                {loading ? "Actualizando…" : "Guardar nueva contraseña"}
              </button>
            </form>
          )}

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
