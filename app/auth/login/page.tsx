"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl") || "/onboarding";
    return raw.startsWith("/") ? raw : "/onboarding";
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setResendStatus("idle");
    setResendMessage(null);
    setResendError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email: email.toLowerCase().trim(),
      password,
      callbackUrl,
    });

    setLoading(false);

    if (!res || res.error) {
      if (res?.error === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
        setError(null);
      } else {
        setError("Email o contraseña incorrectos.");
      }
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function resendVerification() {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) {
      setError("Ingresa tu email para reenviar la verificacion.");
      return;
    }

    setResendStatus("sending");
    setResendMessage(null);
    setResendError(null);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.ok) {
      setResendStatus("sent");
      const id = data?.messageId ? `✅ Enviado (id: ${data.messageId}).` : "✅ Enviado.";
      setResendMessage(`${id} Revisa spam/promociones.`);
      return;
    }

    setResendStatus("error");
    const baseError = data?.error ?? "No se pudo reenviar. Intenta de nuevo.";
    setResendError(
      `${baseError} Revisa RESEND_API_KEY / dominio FROM verificado / modo sandbox / deliverability.`
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md k21-card p-6">
        <div className="mb-6">
          <div className="text-sm text-white/60">Kapa21</div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-white/60">Accede a tu cuenta.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="text-sm font-medium text-white/80">Email</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
              placeholder="tucorreo@correo.cl"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
          {needsVerification && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-100">
              <div className="mb-2">Debes verificar tu correo para ingresar.</div>
              <button
                type="button"
                className="rounded-lg border border-yellow-200/30 px-3 py-1 text-sm text-yellow-100 hover:bg-yellow-500/10 disabled:opacity-60"
                onClick={resendVerification}
                disabled={resendStatus === "sending"}
              >
                {resendStatus === "sending" ? "Reenviando..." : "Reenviar verificacion"}
              </button>
              {resendStatus === "sent" && (
                <div className="mt-2 text-xs text-yellow-200">
                  {resendMessage ?? "✅ Enviado. Revisa spam/promociones."}
                </div>
              )}
              {resendStatus === "error" && (
                <div className="mt-2 text-xs text-yellow-200">
                  {resendError ?? "No se pudo reenviar. Intenta de nuevo."}
                </div>
              )}
            </div>
          )}

          <button disabled={loading} className="w-full k21-btn-primary disabled:opacity-60" type="submit">
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <div className="text-sm text-white/60">
            ¿Eres nuevo?{" "}
            <a className="underline" href="/auth/register">
              Crear cuenta
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
