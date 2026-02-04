"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Credenciales inválidas");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md k21-card p-6">
        <div className="mb-6">
          <div className="text-sm text-white/60">Cava</div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Acceso admin</h1>
          <p className="mt-1 text-sm text-white/60">Gestiona la tesorería manual.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white/80">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
              placeholder="admin@cava.cl"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Contraseña</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
              placeholder="tu contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button disabled={loading} className="w-full k21-btn-primary disabled:opacity-60" type="submit">
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
