"use client";

import { useEffect, useMemo, useState } from "react";
import { displayAsset, formatUsdtClient } from "@/lib/formatUsdt";

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
  inputClp?: string | null;
};

function formatAmount(value: string | null, currency: "CLP" | "BTC" | "USD") {
  if (!value) return "—";
  if (currency === "USD") return formatUsdtClient(value);
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (currency === "CLP") {
    return `$${Math.round(n).toLocaleString("es-CL")}`;
  }
  return `${n.toLocaleString("es-CL", { maximumFractionDigits: 8 })} ${displayAsset(currency)}`;
}

function formatQty(value: string, currency: "BTC" | "USD") {
  if (currency === "USD") return formatUsdtClient(value);
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
  inputClp,
}: {
  open: boolean;
  estimate: TradeEstimate | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (qtyOverride?: string | null) => void;
  inputClp?: string | null;
}) {
  const [spotPrice, setSpotPrice] = useState<string | null>(null);
  const [spotTimestamp, setSpotTimestamp] = useState<string | null>(null);
  const [spotLoading, setSpotLoading] = useState(false);
  const [spotError, setSpotError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!open || !estimate) {
      setSpotPrice(null);
      setSpotTimestamp(null);
      setSpotError(null);
      setSpotLoading(false);
      return () => {
        alive = false;
      };
    }

    const pair = estimate.baseAsset === "BTC" ? "BTC_CLP" : "USDT_CLP";

    const loadSpot = async () => {
      setSpotLoading(true);
      setSpotError(null);
      setSpotPrice(null);
      setSpotTimestamp(null);
      try {
        const res = await fetch(`/api/prices/spot?pair=${pair}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.price) {
          throw new Error(data?.message ?? data?.error ?? "No se pudo obtener precio spot. Reintenta.");
        }
        if (!alive) return;
        setSpotPrice(String(data.price));
        setSpotTimestamp(data.timestamp ?? null);
      } catch (err: any) {
        if (!alive) return;
        setSpotError(err?.message ?? "No se pudo obtener precio spot. Reintenta.");
      } finally {
        if (!alive) return;
        setSpotLoading(false);
      }
    };

    void loadSpot();

    return () => {
      alive = false;
    };
  }, [open, estimate?.baseAsset, estimate?.price]);

  const title = useMemo(() => {
    if (!estimate) return "Confirmar operación";
    return estimate.side === "buy" ? "Confirmar compra" : "Confirmar venta";
  }, [estimate]);

  if (!open || !estimate) return null;

  const spotValue = spotPrice ? Number(spotPrice) : null;
  const feePercent = Number(estimate.feePercent);
  const inputClpValue = inputClp ? Number(inputClp) : null;
  const qtyFallback = Number(estimate.qty);
  let computedQty: number | null = Number.isFinite(qtyFallback) ? qtyFallback : null;
  const buyFeeClp =
    estimate.side === "buy" &&
    inputClpValue &&
    Number.isFinite(inputClpValue) &&
    Number.isFinite(feePercent)
      ? inputClpValue * feePercent
      : null;
  const buyGrossClp =
    estimate.side === "buy" && buyFeeClp !== null && inputClpValue != null
      ? inputClpValue - buyFeeClp
      : null;

  if (spotValue && inputClpValue && Number.isFinite(inputClpValue) && inputClpValue > 0) {
    if (estimate.side === "buy") {
      computedQty = spotValue > 0 && buyGrossClp !== null ? buyGrossClp / spotValue : null;
    } else {
      computedQty = spotValue > 0 ? inputClpValue / spotValue : null;
    }
  }

  const hasValidQty =
    computedQty !== null && Number.isFinite(computedQty) && computedQty > 0;
  const confirmDisabled =
    loading || spotLoading || Boolean(spotError) || !spotValue || !hasValidQty;

  const qtyForDisplay =
    computedQty && Number.isFinite(computedQty) && computedQty > 0 ? computedQty : null;
  const priceForDisplay = spotValue && Number.isFinite(spotValue) ? spotValue : null;
  const grossQuote = qtyForDisplay && priceForDisplay ? qtyForDisplay * priceForDisplay : null;
  const feeOnQuote =
    grossQuote && Number.isFinite(feePercent) ? grossQuote * feePercent : null;
  const feeOnBase =
    qtyForDisplay && Number.isFinite(feePercent) ? qtyForDisplay * feePercent : null;
  const displayPrice = priceForDisplay ? priceForDisplay.toString() : estimate.price;
  const displayGross =
    estimate.side === "buy" && buyGrossClp !== null
      ? buyGrossClp.toString()
      : grossQuote !== null
      ? grossQuote.toString()
      : estimate.grossQuote;
  const displayFee =
    estimate.side === "buy"
      ? buyFeeClp !== null
        ? buyFeeClp.toString()
        : feeOnQuote !== null
        ? feeOnQuote.toString()
        : estimate.feeAmount
      : feeOnBase !== null
      ? feeOnBase.toString()
      : estimate.feeAmount;
  const displayNet =
    estimate.side === "buy"
      ? inputClpValue !== null && Number.isFinite(inputClpValue)
        ? inputClpValue.toString()
        : estimate.netAmount
      : qtyForDisplay !== null && feeOnBase !== null
      ? (qtyForDisplay - feeOnBase).toString()
      : estimate.netAmount;
  const displayQty = qtyForDisplay ? qtyForDisplay.toString() : estimate.qty;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950 p-6 text-neutral-100 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {spotPrice && spotTimestamp
                ? `Precio de mercado (Buda): ${formatAmount(spotPrice, "CLP")} — actualizado ${new Date(
                    spotTimestamp
                  ).toLocaleTimeString("es-CL")}`
                : "Precio de mercado (Buda): —"}
            </p>
            {spotError ? (
              <p className="mt-1 text-sm text-red-200">
                No se pudo obtener precio de mercado. Reintenta.
              </p>
            ) : null}
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
                  {estimate ? formatQty(displayQty, estimate.baseAsset) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">
                  {estimate?.side === "buy" ? "CLP bruto (trade)" : "CLP bruto"}
                </div>
                <div className="mt-1 font-medium">
                  {estimate ? formatAmount(displayGross, "CLP") : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Fee</div>
                <div className="mt-1 font-medium">
                  {estimate ? `${(Number(estimate.feePercent) * 100).toFixed(2)}%` : "—"} ·{" "}
                  {estimate ? formatAmount(displayFee, estimate.feeCurrency) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">
                  {estimate?.side === "buy" ? "Pagas" : "Neto base"}
                </div>
                <div className="mt-1 font-medium">
                  {estimate ? formatAmount(displayNet, estimate.netCurrency) : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Precio estimado</div>
                <div className="mt-1 font-medium">
                  {estimate ? formatAmount(displayPrice, "CLP") : "—"}
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
            onClick={() => {
              if (!computedQty || !Number.isFinite(computedQty) || computedQty <= 0) {
                onConfirm(null);
                return;
              }
              const decimals = estimate.baseAsset === "BTC" ? 8 : 6;
              onConfirm(computedQty.toFixed(decimals));
            }}
            className={confirmDisabled ? "k21-btn-disabled" : "k21-btn-primary"}
            disabled={confirmDisabled || !estimate}
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
