"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email: email.toLowerCase().trim(),
      password,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push(res.url ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-white">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Accede a tu panel de tesorería en Bitcoin
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-white outline-none"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <input
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-white outline-none"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-sm text-neutral-400">
            ¿Eres nuevo?{" "}
            <a className="underline text-white" href="/auth/register">
              Crear cuenta
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}