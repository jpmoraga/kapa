"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TradeReceiptModal from "./TradeReceiptModal";
import ConfirmTradeModal, { TradeEstimate } from "./ConfirmTradeModal";

type MovementType = "deposit" | "withdraw" | "adjust";
type Mode = "buy" | "sell" | "adjust";
type AssetCode = "BTC" | "CLP" | "USD";

type TradeReceipt = {
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

function modeToType(mode: Mode): MovementType {
  if (mode === "buy") return "deposit"; // comprar => suma asset
  if (mode === "sell") return "withdraw"; // vender => resta asset
  return "adjust";
}

function modeLabels(mode: Mode, assetCode: AssetCode) {
  const isCLP = assetCode === "CLP";

  if (mode === "buy") {
    return {
      title: isCLP ? "Depositar CLP" : `Comprar ${assetCode}`,
      subtitle: isCLP
      ? "Transfiere a la cuenta indicada y sube el comprobante."
      : "Indica el monto y continua.",
      button: isCLP ? "Confirmar depósito" : "Confirmar compra",
      notePlaceholder: isCLP
        ? "Ej: Depósito por transferencia"
        : "Ej: Compra (simulación)",
    };
  }

  if (mode === "sell") {
    return {
      title: isCLP ? "Retirar CLP" : `Vender ${assetCode}`,
      subtitle: isCLP
        ? "Indica el monto. Enviaremos los fondos a tu cuenta bancaria registrada."
        : "Indica el monto y continua.",
      button: isCLP ? "Confirmar retiro" : "Confirmar venta",
      notePlaceholder: isCLP
        ? "Ej: Retiro a cuenta bancaria"
        : "Ej: Venta parcial (simulación)",
    };
  }

  return {
    title: `Ajuste de balance (${assetCode})`,
    subtitle: "Movimiento manual para corregir balance (admin).",
    button: "Guardar ajuste",
    notePlaceholder: "Ej: Ajuste por conciliación",
  };
}

function parseClpInput(value: string) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : NaN;
}

export default function MovementForm({
  mode,
  assetCode = "BTC",
  variant = "page",
  onClose,
}: {
  mode: Mode;
  assetCode?: AssetCode;
  variant?: "page" | "modal";
  onClose?: () => void;
}) {
  const router = useRouter();

  const [amount, setAmount] = useState<string>(() => {
    if (assetCode === "CLP") return "";
    if (mode === "buy" || mode === "sell") return "10000";
    if (assetCode === "USD") return "10";
    return "0.001";
  });
  const [note, setNote] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receipt, setReceipt] = useState<TradeReceipt | null>(null);
  const [receiptPendingMessage, setReceiptPendingMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [estimate, setEstimate] = useState<TradeEstimate | null>(null);
  const pollAttemptsRef = useRef(0);

  useEffect(() => {
    if (!receipt?.movementId) return;
    pollAttemptsRef.current = 0;
  }, [receipt?.movementId]);

  const type = modeToType(mode);
  const labels = modeLabels(mode, assetCode);

  const isDepositCLP = assetCode === "CLP" && mode === "buy";
  const isWithdrawCLP = assetCode === "CLP" && mode === "sell";
  const isTrade = assetCode !== "CLP" && (mode === "buy" || mode === "sell");
  const isTradeBuy = isTrade && mode === "buy";
  const isTradeSell = isTrade && mode === "sell";
  const isTradeClpInput = isTradeBuy || isTradeSell;
  const primaryLabel = isTrade ? "Continuar" : labels.button;
  const parsedAmount = Number(amount);
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const showDepositHelp = isDepositCLP && (!receiptFile || !isAmountValid);
  const [spotPreview, setSpotPreview] = useState<string | null>(null);
  const [spotPreviewAt, setSpotPreviewAt] = useState<string | null>(null);
  const [spotPreviewError, setSpotPreviewError] = useState<string | null>(null);
  const [spotPreviewLoading, setSpotPreviewLoading] = useState(false);
  const [clpBalance, setClpBalance] = useState<string>("0");
  const [clpBalanceLoading, setClpBalanceLoading] = useState(false);

  // Por ahora NO bloqueamos el retiro (la cuenta bancaria viene en otra capa)
  const bankNotConfigured = false;

  const bankDetails = {
    name: "Kapa21 SpA",
    rut: "76.303.591-3",
    bank: "Banco de Chile",
    accountType: "Cuenta Corriente",
    accountNumber: "3561497801",
    email: "contacto@kapa21.cl",
  };

  async function copyBankDetails() {
    const text =
      `Nombre: ${bankDetails.name}\n` +
      `RUT: ${bankDetails.rut}\n` +
      `Banco: ${bankDetails.bank}\n` +
      `Tipo: ${bankDetails.accountType}\n` +
      `Cuenta: ${bankDetails.accountNumber}\n` +
      `Email: ${bankDetails.email}\n`;
  
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Copia estos datos:", text);
    }
  }

function onPickReceipt(file: File | null) {
  if (!file) return;
  setReceiptFile(file);
}

  function getTradeFeePercent(code: AssetCode) {
    if (code === "BTC") return 0.006;
    if (code === "USD") return 0.004;
    return 0;
  }

  async function fetchSpotPrice(code: AssetCode) {
    const pair = code === "BTC" ? "BTC_CLP" : "USDT_CLP";
    const res = await fetch(`/api/prices/spot?pair=${pair}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.price) {
      throw new Error(data?.message ?? data?.error ?? "No pude obtener precio spot");
    }
    return { price: String(data.price), timestamp: data.timestamp ?? null };
  }

  function buildTradeEstimate(opts: {
    side: "buy" | "sell";
    baseAsset: "BTC" | "USD";
    qty: number;
    price: number;
  }): TradeEstimate {
    const feePercent = getTradeFeePercent(opts.baseAsset);
    const grossQuote = opts.qty * opts.price;
    const feeOnQuote = grossQuote * feePercent;
    const feeOnBase = opts.qty * feePercent;

    if (opts.side === "buy") {
      return {
        side: "buy",
        baseAsset: opts.baseAsset,
        quoteAsset: "CLP",
        qty: opts.qty.toString(),
        price: opts.price.toString(),
        grossQuote: grossQuote.toString(),
        feePercent: feePercent.toString(),
        feeAmount: feeOnQuote.toString(),
        feeCurrency: "CLP",
        netAmount: (grossQuote + feeOnQuote).toString(),
        netCurrency: "CLP",
      };
    }

    return {
      side: "sell",
      baseAsset: opts.baseAsset,
      quoteAsset: "CLP",
      qty: opts.qty.toString(),
      price: opts.price.toString(),
      grossQuote: grossQuote.toString(),
      feePercent: feePercent.toString(),
      feeAmount: feeOnBase.toString(),
      feeCurrency: opts.baseAsset,
      netAmount: (opts.qty - feeOnBase).toString(),
      netCurrency: opts.baseAsset,
    };
  }

  async function openConfirm() {
    setError(null);
    setEstimate(null);
    const qty = isTradeBuy ? parseClpInput(amount) : Number(amount);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Monto invalido");
      return;
    }

    setConfirmLoading(true);
    try {
      const previewPrice = spotPreview ? Number(spotPreview) : null;
      let qtyForEstimate = qty;
      if (isTradeClpInput && previewPrice && Number.isFinite(previewPrice) && previewPrice > 0) {
        const feePct = getTradeFeePercent(assetCode);
        if (mode === "buy") {
          const denom = previewPrice * (1 + feePct);
          qtyForEstimate = denom > 0 ? qty / denom : 0;
        } else {
          qtyForEstimate = previewPrice > 0 ? qty / previewPrice : 0;
        }
      }
      const estimateValue = buildTradeEstimate({
        side: mode === "buy" ? "buy" : "sell",
        baseAsset: assetCode as "BTC" | "USD",
        qty: qtyForEstimate,
        price: previewPrice && previewPrice > 0 ? previewPrice : 0,
      });
      if (isTradeClpInput) {
        estimateValue.inputClp = isTradeBuy ? String(qty) : amount;
      }
      setEstimate(estimateValue);
      setConfirmOpen(true);
    } catch (err: any) {
      setConfirmOpen(false);
      setEstimate(null);
      setError(err?.message ?? "No pude obtener la estimacion");
    } finally {
      setConfirmLoading(false);
    }
  }

  async function handleConfirm(qtyOverride?: string | null) {
    console.log("trade:confirm_clicked", { assetCode, amount, mode });
    setError(null);
    setLoading(true);
    try {
      const clpToSend = isTradeBuy ? parseClpInput(amount) : null;
      const amountToSend = isTradeBuy ? clpToSend : qtyOverride ?? (isTradeClpInput ? null : amount);
      if (!amountToSend || Number(amountToSend) <= 0) {
        setError("No se pudo calcular el monto. Reintenta.");
        setLoading(false);
        return;
      }
      if (process.env.NODE_ENV !== "production") {
        console.log("trade:post_body", { side: mode, assetCode, amountSent: amountToSend });
      }
      const res = await fetch("/api/treasury/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          assetCode,
          amount: amountToSend,
          note,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "Error creando movimiento");
        setConfirmOpen(false);
        setEstimate(null);
        return;
      }

      localStorage.setItem("activeAsset", assetCode);

      const movementId = data?.movementId ? String(data.movementId) : null;
      if (!movementId) {
        setError("No pude crear la operacion");
        setConfirmOpen(false);
        setEstimate(null);
        return;
      }

      console.log("trade:post_ok", { movementId });

      let next = await fetchReceipt(movementId);
      if (!isReceiptComplete(next)) {
        next = await pollReceiptComplete(movementId);
      }

      if (shouldOpenVoucher(next)) {
        setReceiptPendingMessage(null);
        setReceiptOpen(true);
        setConfirmOpen(false);
        setEstimate(null);
        console.log("trade:receipt_ok", { status: next?.status, movementId });
      } else if (isReceiptPendingNotReady(next)) {
        setReceiptPendingMessage(
          "Voucher aún no disponible (operación en proceso). Reintenta en unos segundos."
        );
        setReceiptOpen(true);
        setConfirmOpen(false);
        setEstimate(null);
      } else {
        setError("No pude obtener el voucher. Reintenta.");
        setConfirmOpen(false);
        setEstimate(null);
      }
    } catch (err: any) {
      setError(err?.message ?? "Error inesperado");
      setConfirmOpen(false);
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReceipt(movementId: string) {
    setReceiptLoading(true);
    try {
      const res = await fetch(`/api/treasury/movements/${movementId}/receipt`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setReceipt(data as TradeReceipt);
        return data as TradeReceipt;
      }
      setReceipt(null);
      return null;
    } finally {
      setReceiptLoading(false);
    }
  }

  function isReceiptPendingNotReady(next: TradeReceipt | null) {
    if (!next) return true;
    const status = String(next.status ?? "").toUpperCase();
    return status === "PENDING" || status === "PROCESSING";
  }

  function isReceiptComplete(next: TradeReceipt | null) {
    if (!next) return false;
    return (
      Boolean(next.status) &&
      next.grossAmount !== null &&
      next.feeAmount !== null &&
      next.netAmount !== null &&
      next.price !== null &&
      Boolean(next.qty)
    );
  }

  async function pollReceiptComplete(movementId: string) {
    const started = Date.now();
    let last: TradeReceipt | null = null;
    while (Date.now() - started < 10000) {
      last = await fetchReceipt(movementId);
      if (isReceiptComplete(last)) return last;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return last;
  }

  function shouldOpenVoucher(next: TradeReceipt | null) {
    if (!next) return false;
    if (!isReceiptComplete(next)) return false;
    if (next.status === "APPROVED") return true;
    if (next.status === "PROCESSING" && next.externalOrderId) return true;
    if (next.status === "PENDING" && next.internalReason === "INSUFFICIENT_LIQUIDITY") return true;
    return false;
  }

  useEffect(() => {
    if (!receiptOpen) {
      pollAttemptsRef.current = 0;
      return;
    }
    if (!receipt || receipt.status !== "PROCESSING") {
      pollAttemptsRef.current = 0;
      return;
    }
    if (pollAttemptsRef.current >= 40) return;

    const id = receipt.movementId;
    const interval = setInterval(() => {
      pollAttemptsRef.current += 1;
      if (pollAttemptsRef.current > 40) {
        clearInterval(interval);
        return;
      }
      fetchReceipt(id);
    }, 1800);

    return () => clearInterval(interval);
  }, [receiptOpen, receipt?.status, receipt?.movementId]);

  useEffect(() => {
    let alive = true;
    if (!isTrade) return;
    setSpotPreviewLoading(true);
    setSpotPreviewError(null);
    fetchSpotPrice(assetCode)
      .then((data) => {
        if (!alive) return;
        setSpotPreview(data.price);
        setSpotPreviewAt(data.timestamp ?? null);
      })
      .catch((err: any) => {
        if (!alive) return;
        setSpotPreview(null);
        setSpotPreviewAt(null);
        setSpotPreviewError(err?.message ?? "No pude cargar precio spot");
      })
      .finally(() => {
        if (!alive) return;
        setSpotPreviewLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [assetCode, isTrade]);

  useEffect(() => {
    let alive = true;
    if (!isTradeBuy) return;
    setClpBalanceLoading(true);
    fetch("/api/treasury/summary", { cache: "no-store" })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (!alive) return;
        const raw = data?.balances?.CLP ?? "0";
        setClpBalance(String(raw ?? "0"));
      })
      .catch(() => {
        if (!alive) return;
        setClpBalance("0");
      })
      .finally(() => {
        if (!alive) return;
        setClpBalanceLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isTradeBuy]);

  async function triggerRetry() {
    if (!receipt?.movementId) return;
    setReceiptLoading(true);
    try {
      await fetch("/api/treasury/sync-wallet", { method: "POST" });
    } finally {
      setReceiptLoading(false);
    }
    fetchReceipt(receipt.movementId);
  }

  async function createMovement() {
    setError(null);
    setLoading(true);

    try {
      let res: Response;

      if (isDepositCLP) {
        // ✅ multipart para subir comprobante
        const fd = new FormData();
        fd.append("type", type);
        fd.append("assetCode", assetCode);
        fd.append("amount", amount);
        if (note) fd.append("note", note);
        if (receiptFile) fd.append("receipt", receiptFile); // 🔑 OJO: el backend espera "receipt"

        res = await fetch("/api/treasury/movements", {
          method: "POST",
          body: fd,
          // ⚠️ NO pongas Content-Type acá
        });
      } else {
        // ✅ JSON para BTC/USD, y cualquier cosa sin comprobante
        res = await fetch("/api/treasury/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            assetCode,
            amount,
            note,
          }),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "Error creando movimiento");
        return;
      }

      // ✅ para que el dashboard no vuelva a BTC por defecto
      localStorage.setItem("activeAsset", assetCode);

      if (isTrade && data?.movementId) {
        const next = await fetchReceipt(String(data.movementId));
        if (shouldOpenVoucher(next)) {
          setReceiptOpen(true);
        } else {
          setReceiptOpen(false);
        }
        return;
      }

      if (variant === "modal") {
        onClose?.();
        router.refresh();
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isTrade) {
      await openConfirm();
      return;
    }
    await createMovement();
  }

  return (
    <div className={variant === "modal" ? "bg-neutral-950 p-6 text-neutral-100 max-h-[85vh] overflow-y-auto" : "min-h-screen bg-neutral-950 p-6 text-neutral-100"}>
      <div className={variant === "modal" ? "mx-auto w-full" : "mx-auto max-w-lg"}>
        <div className="k21-card p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-100">
              {labels.title}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">{labels.subtitle}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
  {isDepositCLP && (
    <div className="k21-card p-5 border border-white/10 bg-white/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-wide">Depósito</div>
          <div className="mt-1 text-sm text-neutral-200">Transfiere a esta cuenta</div>
        </div>

        <button
          type="button"
          onClick={copyBankDetails}
          className="k21-btn-secondary text-xs !px-3 !py-2 h-9"
          title="Copiar datos de transferencia"
        >
          Copiar
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="text-neutral-300">
          <div className="text-xs text-neutral-500">Banco</div>
          <div className="mt-1">{bankDetails.bank}</div>
        </div>
        <div className="text-neutral-300">
          <div className="text-xs text-neutral-500">Tipo</div>
          <div className="mt-1">{bankDetails.accountType}</div>
        </div>
        <div className="text-neutral-300">
          <div className="text-xs text-neutral-500">Cuenta</div>
          <div className="mt-1 font-medium">{bankDetails.accountNumber}</div>
        </div>
        <div className="text-neutral-300">
          <div className="text-xs text-neutral-500">RUT</div>
          <div className="mt-1">{bankDetails.rut}</div>
        </div>
        <div className="text-neutral-300 sm:col-span-2">
          <div className="text-xs text-neutral-500">Nombre</div>
          <div className="mt-1">{bankDetails.name}</div>
        </div>
        <div className="text-neutral-300 sm:col-span-2">
          <div className="text-xs text-neutral-500">Contacto</div>
          <div className="mt-1">{bankDetails.email}</div>
        </div>
      </div>
    </div>
  )}

  {isWithdrawCLP && (
    <div className="k21-card p-4 border border-white/10 bg-white/5">
      <div className="text-xs text-neutral-500 uppercase tracking-wide">Retiro</div>
      <div className="mt-1 text-sm text-neutral-200">
        Se enviará a tu cuenta bancaria registrada
      </div>

      <div className="mt-3 text-xs text-neutral-500">
        Procesamos retiros en horario hábil.
      </div>
    </div>
  )}

            <div>
              <label className="text-xs text-neutral-400">
                Monto ({isTradeClpInput ? "CLP" : assetCode})
              </label>
              <div className="relative mt-1">
                <input
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-700"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder={
                    isTradeClpInput
                      ? "10000"
                      : assetCode === "BTC"
                      ? "0.001"
                      : assetCode === "CLP"
                      ? "10000"
                      : "10"
                  }
                  required
                />
                {isTradeBuy && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 px-2 py-1 text-xs text-neutral-200 hover:bg-white/10 disabled:opacity-60"
                    disabled={clpBalanceLoading}
                    onClick={() => {
                    const n = parseClpInput(String(clpBalance ?? "0"));
                    if (!Number.isFinite(n) || n <= 0) return;
                    setAmount(Math.floor(n).toString());
                  }}
                  >
                    MAX
                  </button>
                )}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {isTradeClpInput
                  ? "Ingresa el monto en CLP."
                  : assetCode === "BTC"
                  ? "Usa punto decimal. Ej: 0.001"
                  : "Monto > 0"}
              </div>
              {isTradeBuy && spotPreview && !spotPreviewError ? (
                <div className="mt-2 text-xs text-neutral-400">
                  Recibirás aprox:{" "}
                  {(() => {
                    const clp = parseClpInput(amount);
                    const price = Number(spotPreview);
                    const feePct = getTradeFeePercent(assetCode);
                    if (!Number.isFinite(clp) || clp <= 0 || !Number.isFinite(price) || price <= 0) {
                      return "—";
                    }
                    const qty =
                      price > 0 ? clp / (price * (1 + feePct)) : 0;
                    const decimals = assetCode === "BTC" ? 8 : 6;
                    const label = assetCode === "USD" ? "USDT" : assetCode;
                    return `${qty.toFixed(decimals)} ${label}`;
                  })()}
                </div>
              ) : null}
            </div>

            {isDepositCLP && (
            <div>
              <label className="text-xs text-neutral-400">Comprobante (obligatorio)</label>

              <div
                className={
                  "mt-2 rounded-2xl border border-dashed p-4 transition " +
                  (dragOver ? "border-white/30 bg-white/10" : "border-white/15 bg-white/5")
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) onPickReceipt(f);
                }}
                onClick={() => {
                  const el = document.getElementById("k21-receipt-input") as HTMLInputElement | null;
                  el?.click();
                }}
                role="button"
                tabIndex={0}
              >
                <input
                  id="k21-receipt-input"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => onPickReceipt(e.target.files?.[0] ?? null)}
                />

                {!receiptFile ? (
                  <div className="text-sm text-neutral-300">
                    <div className="font-medium">Arrastra el comprobante aquí</div>
                    <div className="mt-1 text-xs text-neutral-500">o haz click para subirlo (JPG, PNG o PDF)</div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-neutral-200 truncate">{receiptFile.name}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>

                    <button
                      type="button"
                      className="k21-btn-secondary text-xs !px-3 !py-2 h-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceiptFile(null);
                      }}
                    >
                      Reemplazar
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-neutral-500">
                Revisamos y acreditamos apenas esté validado.
              </div>
            </div>
          )}

          {showDepositHelp && (
            <div className="text-xs text-neutral-500">
              Ingresa monto y adjunta comprobante.
            </div>
          )}

            <div>
              <label className="text-xs text-neutral-400">Nota (opcional)</label>
              <input
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-700"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={labels.notePlaceholder}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                disabled={loading || confirmLoading || (isDepositCLP && (!receiptFile || !isAmountValid))}
                className={loading ? "k21-btn-disabled" : "k21-btn-primary"}
              >
                {loading ? "Guardando..." : confirmLoading ? "Calculando..." : primaryLabel}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (variant === "modal") {
                    onClose?.();
                    return;
                  }
                  router.push("/dashboard");
                }}
                className="k21-btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmTradeModal
        open={confirmOpen}
        estimate={estimate}
        loading={confirmLoading || loading}
        onCancel={() => {
          setConfirmOpen(false);
          setEstimate(null);
        }}
        onConfirm={handleConfirm}
        inputClp={
          isTradeBuy
            ? Number.isFinite(parseClpInput(amount))
              ? String(parseClpInput(amount))
              : null
            : isTradeClpInput
            ? amount
            : null
        }
      />

      <TradeReceiptModal
        open={receiptOpen}
        receipt={receipt}
        loading={receiptLoading}
        pendingMessage={receiptPendingMessage}
        onClose={async () => {
          setReceiptOpen(false);
          setReceipt(null);
          setReceiptPendingMessage(null);
          try {
            await fetch("/api/treasury/summary", { cache: "no-store" });
          } catch {}
          router.refresh();
          console.log("trade:summary_refreshed");
        }}
        onRefresh={async () => {
          if (!receipt?.movementId) return;
          try {
            await fetch(`/api/treasury/movements/${receipt.movementId}/reconcile`, {
              method: "POST",
            });
          } catch {}
          fetchReceipt(receipt.movementId);
        }}
        onRetry={triggerRetry}
      />
    </div>
  );
}
