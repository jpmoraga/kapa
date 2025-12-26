"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type MovementType = "deposit" | "withdraw" | "adjust";
type AllowedType = "deposit" | "withdraw";
type Unit = "BTC" | "sats";
type AssetCode = "BTC" | "CLP" | "USD";

const SATS_PER_BTC = 100_000_000;
const MIN_BTC = 0.00000001; // 1 sat
const MIN_SATS = 1;

function normalizeType(input: any): MovementType {
  const t = String(input ?? "").trim().toLowerCase();
  if (t === "deposit" || t === "withdraw" || t === "adjust") return t;
  return "deposit";
}

function normalizeAsset(input: any): AssetCode {
  const a = String(input ?? "").trim().toUpperCase();
  if (a === "BTC" || a === "CLP" || a === "USD") return a;
  return "BTC";
}

function normalizeUnit(input: any): Unit {
  const u = String(input ?? "").trim().toLowerCase();
  if (u === "sats" || u === "sat") return "sats";
  return "BTC";
}

function parseNumberLike(input: string) {
  return Number(String(input).replace(",", ".").trim());
}
function btcToSatsStr(btcStr: string) {
  const btc = parseNumberLike(btcStr);
  if (!Number.isFinite(btc)) return "";
  return Math.round(btc * SATS_PER_BTC).toString();
}
function satsToBtcStr(satsStr: string) {
  const sats = parseNumberLike(satsStr);
  if (!Number.isFinite(sats)) return "";
  const btc = sats / SATS_PER_BTC;
  return btc.toFixed(8).replace(/\.?0+$/, "");
}
function sanitizeSatsInput(v: string) {
  return String(v ?? "").replace(/[^\d]/g, "");
}

function formatBalance(balance: string, asset: AssetCode, unit: Unit) {
  if (asset === "BTC") {
    if (unit === "BTC") return `${balance} BTC`;
    const sats = Math.round(parseNumberLike(balance) * SATS_PER_BTC);
    return `${sats.toLocaleString("es-CL")} sats`;
  }
  const n = parseNumberLike(balance);
  if (!Number.isFinite(n)) return asset === "CLP" ? "$0 CLP" : "$0.00 USDT";
  if (asset === "CLP") return `$${Math.round(n).toLocaleString("es-CL")} CLP`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
}

export default function NewMovementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  

  const typeFromUrl = useMemo<MovementType>(() => normalizeType(searchParams.get("type")), [searchParams]);

  // ✅ LEE assetCode (nuevo) y soporta asset (viejo)
  const assetFromUrl = useMemo<AssetCode>(() => {
    return normalizeAsset(searchParams.get("assetCode") ?? searchParams.get("asset"));
  }, [searchParams]);

  // ✅ LEE unit desde URL (solo aplica si asset=BTC)
  const unitFromUrl = useMemo<Unit | null>(() => {
    const raw = searchParams.get("unit");
    if (!raw) return null;
    return normalizeUnit(raw);
  }, [searchParams]);

  const [type, setType] = useState<AllowedType>("deposit");
  const [asset, setAsset] = useState<AssetCode>("BTC");

  const assetUI = asset === "USD" ? "USDT" : asset;

  const [unit, setUnit] = useState<Unit>("BTC"); // solo para BTC
  const [amountInput, setAmountInput] = useState<string>("0.001");
  const [note, setNote] = useState<string>("");

  const [balances, setBalances] = useState<Record<AssetCode, string>>({ BTC: "0", CLP: "0", USD: "0" });
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const needsReceipt = type === "deposit" && asset === "CLP";

  // 🔹 unidad desde localStorage (fallback)
  useEffect(() => {
    const saved = localStorage.getItem("unit") as Unit | null;
    if (saved === "BTC" || saved === "sats") setUnit(saved);
  }, []);

  // ✅ aplica type + asset + unit desde URL (unit URL tiene prioridad si asset=BTC)
  useEffect(() => {
    // new-movement NO maneja adjust (lo manejas en /treasury/adjust)
    if (typeFromUrl === "adjust") {
      router.replace("/dashboard");
      return;
    }

    const nextType: AllowedType = typeFromUrl === "withdraw" ? "withdraw" : "deposit";
    const nextAsset: AssetCode = assetFromUrl;

    setType(nextType);
    setAsset(nextAsset);

    // Defaults de monto por asset
    if (nextAsset === "BTC") {
      // prioridad: unit en URL > localStorage > BTC
      const u: Unit =
        unitFromUrl ??
        (((localStorage.getItem("unit") as Unit | null) === "sats" ? "sats" : "BTC") as Unit);

      setUnit(u);

      // si viene unit en URL, lo persistimos para que el resto de la app quede alineado
      if (unitFromUrl) localStorage.setItem("unit", u);

      setAmountInput(u === "BTC" ? "0.001" : "100000");
    } else if (nextAsset === "CLP") {
      setAmountInput("10000");
    } else {
      setAmountInput("10");
    }
  }, [typeFromUrl, assetFromUrl, unitFromUrl, router]);

  // 🔹 traer balances multi-asset
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/treasury/summary");
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;

        if (!res.ok) {
          setError(data?.error ?? "No pude cargar balances");
          setBalances({ BTC: "0", CLP: "0", USD: "0" });
        } else {
          setBalances({
            BTC: String(data?.balances?.BTC ?? data?.balance ?? "0"),
            CLP: String(data?.balances?.CLP ?? "0"),
            USD: String(data?.balances?.USD ?? "0"),
          });
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "No pude cargar balances");
      } finally {
        if (mounted) setBalanceLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // toggle sats solo si asset=BTC
  function toggleUnit() {
    if (asset !== "BTC") return;

    const next: Unit = unit === "BTC" ? "sats" : "BTC";
    setAmountInput((prev) => {
      if (!prev) return prev;
      return unit === "BTC" ? btcToSatsStr(prev) : satsToBtcStr(prev);
    });
    setUnit(next);
    localStorage.setItem("unit", next);
  }

  // validaciones
  const amountNum = useMemo(() => parseNumberLike(amountInput), [amountInput]);

  const balanceStr = balances[asset] ?? "0";
  const balanceNum = useMemo(() => parseNumberLike(balanceStr), [balanceStr]);

  const amountValid = useMemo(() => {
    if (asset === "BTC") {
      if (unit === "BTC") return Number.isFinite(amountNum) && amountNum >= MIN_BTC;
      return Number.isFinite(amountNum) && Number.isInteger(amountNum) && amountNum >= MIN_SATS;
    }
    return Number.isFinite(amountNum) && amountNum > 0;
  }, [asset, unit, amountNum]);

  const insufficientFunds = useMemo(() => {
    if (type !== "withdraw" || !amountValid) return false;

    if (asset === "BTC") {
      if (unit === "BTC") return amountNum > balanceNum;
      return amountNum > Math.round(balanceNum * SATS_PER_BTC);
    }
    return amountNum > balanceNum;
  }, [type, amountValid, asset, unit, amountNum, balanceNum]);

  const canSubmit = !loading && !balanceLoading && amountValid && !insufficientFunds;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!amountValid) {
      if (asset === "BTC") setError(unit === "BTC" ? "Monto mínimo: 0.00000001 BTC" : "Monto mínimo: 1 sat");
      else setError("Monto inválido");
      return;
    }
    if (insufficientFunds) {
      setError("Fondos insuficientes");
      return;
    }

    // ✅ regla MVP: Depósito CLP requiere comprobante
    if (needsReceipt && !receiptFile) {
      setError("Tienes que subir el comprobante del depósito (PDF/JPG/PNG).");
      return;
    }

    const amountToSend =
      asset === "BTC" ? (unit === "BTC" ? amountInput : satsToBtcStr(amountInput)) : amountInput;

    setLoading(true);
    try {
      let res: Response;

      if (needsReceipt) {
        const fd = new FormData();
        fd.append("type", type);
        fd.append("assetCode", asset);
        fd.append("amount", amountToSend);
        fd.append("note", note);
        fd.append("receipt", receiptFile as File);

        res = await fetch("/api/treasury/movements", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/treasury/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, assetCode: asset, amount: amountToSend, note }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Error creando movimiento");
        return;
      }

      localStorage.setItem("activeAsset", asset);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="mx-auto max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">
            {type === "deposit"
                ? asset === "CLP"
                  ? "Depositar"
                  : "Comprar"
                : "Vender"}{" "}
              {assetUI}
            </h1>
            <p className="text-sm text-neutral-400">Empresa activa</p>
          </div>

          {asset === "BTC" && (
            <button
              onClick={toggleUnit}
              className="text-xs rounded-lg border border-neutral-700 px-2 py-1 hover:bg-neutral-800"
              type="button"
            >
              {unit === "BTC" ? "Ver en sats" : "Ver en BTC"}
            </button>
          )}
        </div>

        <div className="mb-5 rounded-xl border border-neutral-800 bg-black/40 p-4">
          <div className="text-xs text-neutral-400">Balance actual</div>
          <div className="mt-1 text-2xl font-semibold">
            {balanceLoading ? "Cargando…" : formatBalance(balanceStr, asset, unit)}
          </div>
          {type === "withdraw" && !balanceLoading && (
            <div className="mt-2 text-xs text-neutral-400">
              En venta, el monto no puede superar el balance.
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-400">
              Monto {asset === "BTC" ? `(${unit})` : asset === "CLP" ? "(CLP)" : "(USDT)"}
            </label>

            <input
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-700"
              value={amountInput}
              onChange={(e) => {
                const v = e.target.value;
                if (asset === "BTC" && unit === "sats") setAmountInput(sanitizeSatsInput(v));
                else setAmountInput(v);
              }}
              inputMode={asset === "BTC" ? (unit === "BTC" ? "decimal" : "numeric") : "decimal"}
              placeholder={
                asset === "BTC"
                  ? unit === "BTC"
                    ? "0.001"
                    : "100000"
                  : asset === "CLP"
                  ? "10000"
                  : "10"
              }
              required
            />

            <div className="mt-1 text-xs text-neutral-500">
              {asset === "BTC"
                ? unit === "BTC"
                  ? "Mínimo: 0.00000001 BTC"
                  : "Mínimo: 1 sat (solo enteros)"
                : "Monto > 0"}
            </div>
          </div>
          {needsReceipt && (
            <div>
              <label className="text-xs text-neutral-400">Comprobante de depósito (requerido)</label>

              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-700"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                required
              />

              <div className="mt-1 text-xs text-neutral-500">
                Sube PDF/JPG/PNG. Este depósito quedará <b>PENDIENTE</b> hasta aprobación del admin.
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-neutral-400">Nota (opcional)</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-700"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === "deposit" ? "Ej: Compra" : "Ej: Venta"}
            />
          </div>

          {(insufficientFunds || error) && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {insufficientFunds ? "Fondos insuficientes" : error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
            >
                                {loading
                  ? "Guardando…"
                  : type === "deposit"
                  ? asset === "CLP"
                    ? `Depositar ${assetUI}`
                    : `Comprar ${assetUI}`
                  : `Vender ${assetUI}`}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 hover:bg-neutral-900"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}