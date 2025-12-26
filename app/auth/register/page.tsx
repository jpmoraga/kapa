"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!companyName || !email || !password) {
      setError("Completa todos los campos.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "No se pudo crear la cuenta.");
        return;
      }

      await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });
      
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-sm text-neutral-500">Tesorería BTC</div>
          <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Crea tu empresa y tu usuario administrador.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Empresa</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2"
              placeholder="Empresa Prueba SpA"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2"
              placeholder="finanzas@empresa.cl"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:ring-2"
              placeholder="mínimo 8 caracteres"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-2.5 text-white disabled:opacity-60"
            type="submit"
          >
            {loading ? "Creando…" : "Crear cuenta"}
          </button>

          <div className="text-sm text-neutral-600">
            ¿Ya tienes cuenta?{" "}
            <a className="underline" href="/auth/login">
              Inicia sesión
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}