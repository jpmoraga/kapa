"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptTermsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const termsRef = useRef<HTMLDivElement | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  useEffect(() => {
    const el = termsRef.current;
    if (!el) return;

    const onScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      if (atBottom) setHasScrolledToBottom(true);
    };

    onScroll();

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  async function onAccept() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "No se pudo aceptar términos");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de red");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Términos y condiciones</h1>

      <div
        ref={termsRef}
        className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6"
      >
        <p className="opacity-80">
          Para operar en la plataforma debes aceptar los términos.
        </p>

        <ul className="mt-3 list-disc pl-5 opacity-80">
          <li>Entiendo que esta es una plataforma de prueba/MVP.</li>
          <li>Entiendo que los movimientos pueden requerir aprobación.</li>
          <li>Acepto el uso de mis datos para fines operacionales.</li>
        </ul>
      </div>

      {!hasScrolledToBottom && (
        <div className="mt-2 text-xs text-white/50">
          Desliza hasta el final para habilitar “Aceptar términos”.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onAccept}
          disabled={loading || !hasScrolledToBottom}
          title={!hasScrolledToBottom ? "Desliza hasta el final para habilitar" : undefined}
          className="rounded-lg bg-white px-4 py-2 text-black disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Aceptar términos"}
        </button>

        <button
          onClick={() => router.back()}
          className="rounded-lg border border-white/15 px-4 py-2"
        >
          Volver
        </button>
      </div>
    </div>
  );
}