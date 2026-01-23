"use client";

import { useMemo } from "react";

export type TradeEstimate = {
  side: "buy" | "sell";
  baseAsset: "BTC" | "USD";
  quoteAsset: "CLP";
  qty: string;
  price: string | null;
  grossQuote: string | null;
  feePercent: string;
  feeAmount: string | null;
  feeCurrency: "CLP" | "BTC" | "USD";
  netAmount: string | null;
  netCurrency: "CLP" | "BTC" | "USD";
};

function displayAsset(code: "CLP" | "BTC" | "USD") {
  return code === "USD" ? "USDT" : code;
}

function formatAmount(value: string | null, currency: "CLP" | "BTC" | "USD") {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (currency === "CLP") {
    return `$${Math.round(n).toLocaleString("es-CL")}`;
  }
  return `${n.toLocaleString("es-CL", { maximumFractionDigits: 8 })} ${displayAsset(currency)}`;
}

function formatQty(value: string, currency: "BTC" | "USD") {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return `${n.toLocaleString("es-CL", { maximumFractionDigits: 8 })} ${displayAsset(currency)}`;
}

export default function ConfirmTradeModal({
  open,
  estimate,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  estimate: TradeEstimate | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const title = useMemo(() => {
    if (!estimate) return "Confirmar operación";
    return estimate.side === "buy" ? "Confirmar compra" : "Confirmar venta";
  }, [estimate]);

  if (!open || !estimate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950 p-6 text-neutral-100 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-neutral-400">Estimacion basada en el precio actual.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Estimacion</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-neutral-500">Activo</div>
                <div className="mt-1 font-medium">
                  {estimate ? displayAsset(estimate.baseAsset) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Cantidad</div>
                <div className="mt-1 font-medium">
                  {estimate ? formatQty(estimate.qty, estimate.baseAsset) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">CLP bruto</div>
                <div className="mt-1 font-medium">
                  {estimate ? formatAmount(estimate.grossQuote, "CLP") : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Fee</div>
                <div className="mt-1 font-medium">
                  {estimate ? `${(Number(estimate.feePercent) * 100).toFixed(2)}%` : "—"} ·{" "}
                  {estimate ? formatAmount(estimate.feeAmount, estimate.feeCurrency) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">
                  {estimate?.side === "buy" ? "CLP neto" : "Neto base"}
                </div>
                <div className="mt-1 font-medium">
                  {estimate
                    ? formatAmount(estimate.netAmount, estimate.netCurrency)
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Precio estimado</div>
                <div className="mt-1 font-medium">
                  {estimate ? formatAmount(estimate.price, "CLP") : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onCancel}
            className="k21-btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={loading ? "k21-btn-disabled" : "k21-btn-primary"}
            disabled={loading || !estimate}
          >
            {loading
              ? "Procesando..."
              : estimate?.side === "buy"
              ? "Confirmar compra"
              : "Confirmar venta"}
          </button>
        </div>
        {loading ? (
          <div className="mt-2 text-xs text-neutral-500">Procesando...</div>
        ) : null}
      </div>
    </div>
  );
}
