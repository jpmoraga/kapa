// web/app/treasury/pending/pending-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { displayAsset, formatUsdtClient } from "@/lib/formatUsdt";

type AssetCode = "BTC" | "CLP" | "USD";
type MovementType = "deposit" | "withdraw" | "adjust";

type PendingMovement = {
  id: string;
  assetCode: AssetCode;
  type: MovementType;
  amount: string;
  note: string | null;
  createdAt: string;
  createdByUserId?: string | null;
};

function labelType(t: MovementType) {
  return t === "deposit" ? "Compra" : t === "withdraw" ? "Venta" : "Ajuste";
}

function badgeClass(t: MovementType) {
  if (t === "withdraw") return "k21-pill-rejected";
  if (t === "deposit") return "k21-pill-approved";
  return "k21-pill-pending";
}

function fmtAmount(asset: AssetCode, amount: string) {
  const n = Number(String(amount).replace(",", "."));
  if (!Number.isFinite(n)) return amount;

  if (asset === "BTC") return `${amount} BTC`;
  if (asset === "CLP") return `$${Math.round(n).toLocaleString("es-CL")} CLP`;
  return formatUsdtClient(amount);
}

export default function PendingClient() {
  const [rows, setRows] = useState<PendingMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/treasury/movements/pending", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "No pude cargar pendientes");
        setRows([]);
      } else {
        setRows(Array.isArray(data?.pending) ? data.pending : []);
      }
    } catch (e: any) {
      setError(e?.message ?? "No pude cargar pendientes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/treasury/movements/${id}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Error aprobando");
        return;
      }
      await load();
    } catch {
      setError("Error inesperado aprobando");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/treasury/movements/${id}/reject`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Error rechazando");
        return;
      }
      await load();
    } catch {
      setError("Error inesperado rechazando");
    } finally {
      setBusyId(null);
    }
  }

  const count = useMemo(() => rows.length, [rows]);

  return (
    <div className="k21-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-neutral-400">
          Pendientes: <span className="text-neutral-100 font-semibold">{loading ? "…" : count}</span>
        </div>

        <button
          type="button"
          onClick={load}
          className="k21-btn-secondary py-2"
          disabled={loading || !!busyId}
        >
          {loading ? "Cargando…" : "Refrescar"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-neutral-500">Cargando pendientes…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-neutral-500">No hay movimientos pendientes.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-neutral-500 border-b border-neutral-800">
              <tr>
                <th className="py-2 text-left">Fecha</th>
                <th className="py-2 text-left">Tipo</th>
                <th className="py-2 text-left">Asset</th>
                <th className="py-2 text-right">Monto</th>
                <th className="py-2 text-left">Nota</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((m) => {
                const disabled = !!busyId && busyId !== m.id;
                const busy = busyId === m.id;

                return (
                  <tr key={m.id} className="border-b border-neutral-900 last:border-0">
                    <td className="py-3">{new Date(m.createdAt).toLocaleString("es-CL")}</td>

                    <td className="py-3">
                      <span className={badgeClass(m.type)}>
                        {labelType(m.type)}
                      </span>
                    </td>

                    <td className="py-3">{displayAsset(m.assetCode)}</td>

                    <td className="py-3 text-right font-medium">{fmtAmount(m.assetCode, m.amount)}</td>

                    <td className="py-3 text-neutral-400">{m.note || "—"}</td>

                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => approve(m.id)}
                          disabled={disabled || busy}
                          className="k21-btn-primary py-1.5 px-3 text-xs disabled:opacity-50"
                          title="Aprueba y aplica el movimiento al balance"
                        >
                          {busy ? "…" : "Aprobar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => reject(m.id)}
                          disabled={disabled || busy}
                          className="k21-btn-secondary py-1.5 px-3 text-xs border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          title="Rechaza (no cambia el balance)"
                        >
                          {busy ? "…" : "Rechazar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-3 text-xs text-neutral-500">
            Aprobar aplica el balance. Rechazar solo cambia el status.
          </div>
        </div>
      )}
    </div>
  );
}
