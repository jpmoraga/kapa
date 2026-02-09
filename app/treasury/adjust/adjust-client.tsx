"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { displayAsset, formatUsdtClient } from "@/lib/formatUsdt";

type AssetCode = "BTC" | "CLP" | "USD";
type Unit = "BTC" | "sats";

const SATS_PER_BTC = 100_000_000;

function parseNumberLike(input: string) {
  return Number(String(input).replace(",", ".").trim());
}

// permite "+", "-" + dígitos (para sats)
function sanitizeSignedInteger(v: string) {
  const s = String(v ?? "").trim();
  const sign = s.startsWith("-") ? "-" : s.startsWith("+") ? "+" : "";
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return sign ? sign : "";
  return sign + digits;
}

function btcToSatsStrSigned(btcStr: string) {
  const n = parseNumberLike(btcStr);
  if (!Number.isFinite(n)) return "";
  const sats = Math.round(Math.abs(n) * SATS_PER_BTC);
  const sign = n < 0 ? "-" : n > 0 ? "+" : "";
  return sign + sats.toString();
}

function satsToBtcStrSigned(satsStr: string) {
  const s = String(satsStr ?? "").trim();
  if (s === "-" || s === "+" || s === "") return "";
  const neg = s.startsWith("-");
  const n = parseNumberLike(s);
  if (!Number.isFinite(n)) return "";
  const satsAbs = Math.abs(n);
  const btc = satsAbs / SATS_PER_BTC;
  const out = btc.toFixed(8).replace(/\.?0+$/, "");
  return (neg ? "-" : "+") + out;
}

function formatFiat(amountStr: string, code: "CLP" | "USD") {
  const n = parseNumberLike(amountStr);
  if (!Number.isFinite(n)) return code === "CLP" ? "$0 CLP" : formatUsdtClient(0);
  if (code === "CLP") return `$${Math.round(n).toLocaleString("es-CL")} CLP`;
  return formatUsdtClient(amountStr);
}

function formatBTC(balanceStr: string, unit: Unit) {
  const n = parseNumberLike(balanceStr);
  if (!Number.isFinite(n)) return unit === "BTC" ? "0 BTC" : "0 sats";
  if (unit === "BTC") return `${balanceStr} BTC`;
  const sats = Math.round(n * SATS_PER_BTC);
  return `${sats.toLocaleString("es-CL")} sats`;
}

export default function AdjustClient({ initialAsset }: { initialAsset: AssetCode }) {
  const router = useRouter();

  const [asset, setAsset] = useState<AssetCode>(initialAsset);
  // ✅ Si cambia el prop (por navegación con searchParams), sincroniza el state
  useEffect(() => {
    setAsset(initialAsset);
  }, [initialAsset]);
  const [unit, setUnit] = useState<Unit>("BTC"); // solo relevante para BTC

  const [balances, setBalances] = useState<Record<AssetCode, string>>({
    BTC: "0",
    CLP: "0",
    USD: "0",
  });
  const [balancesLoading, setBalancesLoading] = useState(true);

  // ajuste con signo
  const [amountInput, setAmountInput] = useState<string>("-0.001");
  const [note, setNote] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // unit desde localStorage (para BTC)
  useEffect(() => {
    const saved = localStorage.getItem("unit") as Unit | null;
    if (saved === "BTC" || saved === "sats") setUnit(saved);
  }, []);

  // defaults al cambiar asset
  useEffect(() => {
    setError(null);

    if (asset === "BTC") {
      const saved = (localStorage.getItem("unit") as Unit | null) ?? "BTC";
      const u: Unit = saved === "sats" ? "sats" : "BTC";
      setUnit(u);

      // ajusta default según unidad
      setAmountInput(u === "BTC" ? "-0.001" : "-100000");
    } else if (asset === "CLP") {
      setAmountInput("-10000");
    } else {
      setAmountInput("-10");
    }
  }, [asset]);

  // cargar balances multi-asset
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
        if (mounted) setBalancesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  function toggleUnit() {
    if (asset !== "BTC") return;

    const next: Unit = unit === "BTC" ? "sats" : "BTC";

    setAmountInput((prev) => {
      if (!prev) return prev;
      return unit === "BTC" ? btcToSatsStrSigned(prev) : satsToBtcStrSigned(prev);
    });

    setUnit(next);
    localStorage.setItem("unit", next);
  }

  const amountNum = useMemo(() => {
    const s = String(amountInput).trim();
    if (asset === "BTC" && unit === "sats") {
      if (s === "-" || s === "+" || s === "") return NaN;
      return parseNumberLike(s);
    }
    return parseNumberLike(s);
  }, [amountInput, asset, unit]);

  const amountValid = useMemo(() => {
    if (!Number.isFinite(amountNum)) return false;
    if (amountNum === 0) return false; // adjust no puede ser 0

    if (asset === "BTC") {
      if (unit === "BTC") return true;
      return Number.isInteger(amountNum); // sats entero
    }
    return true;
  }, [amountNum, asset, unit]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!amountValid) {
      if (asset === "BTC" && unit === "sats") setError("Monto inválido (sats debe ser entero y no 0).");
      else setError("Monto inválido (no puede ser 0).");
      return;
    }

    const amountToSend =
      asset === "BTC"
        ? unit === "BTC"
          ? amountInput
          : satsToBtcStrSigned(amountInput)
        : amountInput;

    setLoading(true);
    try {
      const res = await fetch("/api/treasury/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "adjust",
          assetCode: asset,
          amount: amountToSend,
          note: note.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Error aplicando ajuste");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const balanceStr = balances[asset] ?? "0";

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="mx-auto max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-lg">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Ajuste manual</h1>
            <p className="text-sm text-neutral-400">Admin/Owner · afecta el balance del asset seleccionado</p>
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

        <div className="mb-5 grid grid-cols-3 gap-2">
          {(["BTC", "CLP", "USD"] as const).map((a) => {
            const active = asset === a;
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAsset(a)}
                className={[
                  "rounded-xl border px-3 py-2 text-left transition",
                  active ? "border-neutral-600 bg-neutral-900" : "border-neutral-800 bg-neutral-950 hover:bg-neutral-900",
                ].join(" ")}
              >
                <div className="text-xs text-neutral-400">{displayAsset(a)}</div>
                <div className="text-sm font-medium text-neutral-100">
                  {a === "BTC" ? "Bitcoin" : a === "CLP" ? "Pesos" : "Dólares"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mb-5 rounded-xl border border-neutral-800 bg-black/40 p-4">
          <div className="text-xs text-neutral-400">Balance actual</div>
          <div className="mt-1 text-2xl font-semibold">
            {balancesLoading
              ? "Cargando…"
              : asset === "BTC"
              ? formatBTC(balanceStr, unit)
              : asset === "CLP"
              ? formatFiat(balanceStr, "CLP")
              : formatFiat(balanceStr, "USD")}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Ajuste con signo: positivo suma, negativo resta. El backend bloquea dejar el balance negativo.
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-400">
              Monto de ajuste {asset === "BTC" ? `(${unit})` : asset === "CLP" ? "(CLP)" : `(${displayAsset(asset)})`}
            </label>

            <input
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-700"
              value={amountInput}
              onChange={(e) => {
                const v = e.target.value;
                if (asset === "BTC" && unit === "sats") setAmountInput(sanitizeSignedInteger(v));
                else setAmountInput(v);
              }}
              inputMode={asset === "BTC" ? (unit === "BTC" ? "decimal" : "numeric") : "decimal"}
              placeholder={asset === "BTC" ? (unit === "BTC" ? "-0.001" : "-100000") : asset === "CLP" ? "-10000" : "-10"}
              required
            />

            <div className="mt-1 text-xs text-neutral-500">
              No puede ser 0. Ejemplos:{" "}
              {asset === "BTC"
                ? unit === "BTC"
                  ? "-0.001  |  +0.002"
                  : "-100000  |  +25000"
                : "-10000  |  +5000"}
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400">Nota (opcional)</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-700"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Corrección contable"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              disabled={!amountValid || loading || balancesLoading}
              className="flex-1 rounded-xl bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
            >
              {loading ? "Aplicando…" : "Aplicar ajuste"}
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
