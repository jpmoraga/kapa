"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MovementType = "deposit" | "withdraw" | "adjust";
type Mode = "buy" | "sell" | "adjust";
type AssetCode = "BTC" | "CLP" | "USD";

function modeToType(mode: Mode): MovementType {
  if (mode === "buy") return "deposit"; // comprar => suma asset
  if (mode === "sell") return "withdraw"; // vender => resta asset
  return "adjust";
}

function modeLabels(mode: Mode, assetCode: AssetCode) {
  const assetLabel = assetCode;

  if (mode === "buy") {
    return {
      title: `Comprar ${assetLabel}`,
      subtitle: `Crea una solicitud de compra: aumentará el balance ${assetLabel} cuando se apruebe.`,
      button: "Confirmar compra",
      notePlaceholder: "Ej: Compra (simulación)",
    };
  }

  if (mode === "sell") {
    return {
      title: `Vender ${assetLabel}`,
      subtitle: `Crea una solicitud de venta: disminuirá el balance ${assetLabel} cuando se apruebe.`,
      button: "Confirmar venta",
      notePlaceholder: "Ej: Venta parcial (simulación)",
    };
  }

  return {
    title: `Ajuste de balance (${assetLabel})`,
    subtitle: "Movimiento manual para corregir balance (admin).",
    button: "Guardar ajuste",
    notePlaceholder: "Ej: Ajuste por conciliación",
  };
}

export default function MovementForm({
  mode,
  assetCode = "BTC",
}: {
  mode: Mode;
  assetCode?: AssetCode;
}) {
  const router = useRouter();

  const [amount, setAmount] = useState<string>(assetCode === "CLP" ? "10000" : assetCode === "USD" ? "10" : "0.001");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const type = modeToType(mode);
  const labels = modeLabels(mode, assetCode);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/treasury/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          assetCode, // ✅ importante para multi-asset
          amount,
          note,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "Error creando movimiento");
        return;
      }

      // ✅ para que el dashboard no vuelva a BTC por defecto
      localStorage.setItem("activeAsset", assetCode);

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-lg rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">{labels.title}</h1>
          <p className="text-sm text-neutral-600">{labels.subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-600">Monto ({assetCode})</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder={assetCode === "BTC" ? "0.001" : assetCode === "CLP" ? "10000" : "10"}
              required
            />
            <div className="mt-1 text-xs text-neutral-500">
              {assetCode === "BTC" ? "Usa punto decimal. Ej: 0.001" : "Monto > 0"}
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-600">Nota (opcional)</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={labels.notePlaceholder}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              disabled={loading}
              className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              {loading ? "Guardando..." : labels.button}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}