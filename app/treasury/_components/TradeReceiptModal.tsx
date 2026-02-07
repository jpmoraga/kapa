"use client";

import { useMemo } from "react";

type Receipt = {
  movementId: string;
  side: "buy" | "sell";
  baseAsset: "BTC" | "USD";
  quoteAsset: "CLP";
  status: string;
  grossAmount: string | null;
  feePercent: string;
  feeAmount: string | null;
  feeCurrency: "CLP" | "BTC" | "USD";
  netAmount: string | null;
  qty: string;
  price: string | null;
  isEstimated?: boolean;
  message?: string | null;
  internalReason?: string | null;
  externalOrderId?: string | null;
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

function statusLabel(status: string, side: "buy" | "sell", internalReason?: string | null) {
  if (status === "APPROVED") return side === "buy" ? "Compra ejecutada" : "Venta ejecutada";
  if (status === "PROCESSING") return "Ejecutando…";
  if (status === "PENDING" && internalReason === "INSUFFICIENT_LIQUIDITY") {
    return "Pendiente por liquidez";
  }
  if (status === "PENDING") return "En revisión / pendiente";
  return status;
}

export default function TradeReceiptModal({
  open,
  receipt,
  loading,
  onClose,
}: {
  open: boolean;
  receipt: Receipt | null;
  loading: boolean;
  onClose: () => void;
}) {
  const status = String(receipt?.status ?? "").toUpperCase();

  const title = useMemo(() => {
    if (!receipt) return "Detalle de operación";
    return receipt.side === "buy" ? "Compra exitosa" : "Venta exitosa";
  }, [receipt]);

  const buyGrossTradeClp = useMemo(() => {
    if (!receipt || receipt.side !== "buy") return null;
    const grossPaid = Number(receipt.grossAmount ?? "");
    const fee = Number(receipt.feeAmount ?? "");
    if (!Number.isFinite(grossPaid) || !Number.isFinite(fee)) return null;
    return (grossPaid - fee).toString();
  }, [receipt]);

  if (!open || !receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950 p-6 text-neutral-100 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {receipt ? statusLabel(receipt.status, receipt.side, receipt.internalReason) : "Cargando…"}
            </p>
            {receipt?.isEstimated ? (
              <p className="mt-1 text-xs text-neutral-500">Valores estimados hasta confirmar ejecución.</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Resumen</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-neutral-500">Activo</div>
                <div className="mt-1 font-medium">
                  {receipt ? displayAsset(receipt.baseAsset) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Cantidad</div>
                <div className="mt-1 font-medium">
                  {receipt ? formatQty(receipt.qty, receipt.baseAsset) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">
                  {receipt?.side === "sell" ? "Monto base" : "CLP bruto (trade)"}
                </div>
                <div className="mt-1 font-medium">
                  {receipt
                    ? formatAmount(
                        receipt.side === "buy" && buyGrossTradeClp
                          ? buyGrossTradeClp
                          : receipt.grossAmount,
                        receipt.side === "sell" ? receipt.baseAsset : "CLP"
                      )
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Fee</div>
                <div className="mt-1 font-medium">
                  {receipt ? `${(Number(receipt.feePercent) * 100).toFixed(2)}%` : "—"} ·{" "}
                  {receipt ? formatAmount(receipt.feeAmount, receipt.feeCurrency) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">
                  {receipt?.side === "sell" ? "Neto base" : "Pagas"}
                </div>
                <div className="mt-1 font-medium">
                  {receipt
                    ? formatAmount(
                        receipt.side === "buy" ? receipt.grossAmount : receipt.netAmount,
                        receipt.side === "sell" ? receipt.baseAsset : "CLP"
                      )
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Precio</div>
                <div className="mt-1 font-medium">
                  {receipt ? formatAmount(receipt.price, "CLP") : "—"}
                </div>
              </div>
            </div>
          </div>

          {receipt?.message ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
              {receipt.message}
            </div>
          ) : null}

          {receipt?.externalOrderId ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-neutral-400">
              Orden: {receipt.externalOrderId}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onClose}
            className="k21-btn-secondary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
