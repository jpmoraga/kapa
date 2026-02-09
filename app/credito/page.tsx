"use client";

import { useEffect, useMemo, useState } from "react";

const FALLBACK_BTC_AVAILABLE = 0.02594742;
const FALLBACK_BTC_PRICE_CLP = 60867616;
const MONTHLY_RATE = 0.013; // 1.30%

function parseNumberLike(input: string | number | null | undefined) {
  const v = typeof input === "number" ? input : Number(String(input ?? "").replace(/,/g, "."));
  return Number.isFinite(v) ? v : null;
}

function formatClpNumber(n: number) {
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString("es-CL");
}

function formatClp(n: number) {
  return `$${formatClpNumber(n)} CLP`;
}

function formatBtc(n: number) {
  if (!Number.isFinite(n)) return "0.00000000 BTC";
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  })} BTC`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function ltvBadge(ltvPct: number) {
  if (ltvPct >= 80) {
    return { label: "Liquidación", cls: "border-red-500/30 bg-red-500/10 text-red-300" };
  }
  if (ltvPct >= 70) {
    return { label: "Margin call", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" };
  }
  if (ltvPct >= 65) {
    return { label: "Riesgoso", cls: "border-orange-500/30 bg-orange-500/10 text-orange-300" };
  }
  return { label: "Saludable", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" };
}

export default function CreditoPage() {
  const [btcAvailable, setBtcAvailable] = useState<number | null>(null);
  const [basePriceClp, setBasePriceClp] = useState<number | null>(null);
  const [btcPriceClp, setBtcPriceClp] = useState<number | null>(null);
  const [btcPriceInput, setBtcPriceInput] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [amountClp, setAmountClp] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>("");
  const [months, setMonths] = useState<number>(3);
  const [ltvPct, setLtvPct] = useState<number>(50);
  const [isSubscriber, setIsSubscriber] = useState<boolean>(false);

  useEffect(() => {
    const loadSummary = async () => {
      setLoadingData(true);
      setDataError(null);
      try {
        const res = await fetch("/api/credito/sim-data", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          setDataError(data?.error ?? "No pudimos cargar datos del simulador.");
          return;
        }

        const btcBal = parseNumberLike(data?.btcAvailable ?? null);
        const btcPrice = parseNumberLike(data?.basePriceClp ?? null);

        if (
          process.env.NODE_ENV === "development" &&
          (btcBal === null || btcPrice === null || btcPrice <= 0)
        ) {
          setBtcAvailable(FALLBACK_BTC_AVAILABLE);
          setBasePriceClp(FALLBACK_BTC_PRICE_CLP);
          setBtcPriceClp(FALLBACK_BTC_PRICE_CLP);
          setBtcPriceInput(formatClpNumber(FALLBACK_BTC_PRICE_CLP));
          setDataError("Usando valores de ejemplo (solo dev).");
          return;
        }

        if (btcBal !== null) setBtcAvailable(btcBal);
        if (btcPrice !== null && btcPrice > 0) {
          setBasePriceClp(btcPrice);
          setBtcPriceClp(btcPrice);
          setBtcPriceInput(formatClpNumber(btcPrice));
        }

        if (btcBal === null || btcPrice === null) {
          setDataError("Datos incompletos para simular. Reintenta.");
        }
      } catch {
        setDataError("No pudimos cargar datos del simulador.");
      }
      setLoadingData(false);
    };

    void loadSummary();
  }, []);

  useEffect(() => {
    if (!isSubscriber && ltvPct > 50) setLtvPct(50);
  }, [isSubscriber, ltvPct]);

  const maxLtvPct = isSubscriber ? 60 : 50;
  const ltv = ltvPct / 100;

  const hasData = btcAvailable !== null && basePriceClp !== null && basePriceClp > 0;
  const btcAvailableSafe = btcAvailable ?? 0;
  const basePriceSafe = basePriceClp ?? 0;
  const btcScenarioPrice = btcPriceClp ?? basePriceSafe;

  const minPrice = useMemo(() => (basePriceClp ? basePriceClp * 0.6 : 0), [basePriceClp]);
  const maxPrice = useMemo(() => (basePriceClp ? basePriceClp * 1.4 : 0), [basePriceClp]);

  const maxLoanClp = hasData ? btcAvailableSafe * basePriceSafe * (maxLtvPct / 100) : 0;
  const collateralBtc =
    hasData && ltv > 0 && amountClp > 0 ? amountClp / (ltv * basePriceSafe) : 0;
  const btcRemaining = Math.max(btcAvailableSafe - collateralBtc, 0);

  const hasScenario = hasData && collateralBtc > 0 && btcScenarioPrice > 0 && amountClp > 0;
  const ltvScenario = hasScenario ? amountClp / (collateralBtc * btcScenarioPrice) : 0;
  const ltvScenarioPct = hasScenario ? ltvScenario * 100 : 0;
  const badge = hasScenario
    ? ltvBadge(ltvScenarioPct)
    : { label: "—", cls: "border-white/10 bg-white/5 text-neutral-400" };

  const exceedMax = hasData && (amountClp > maxLoanClp || collateralBtc > btcAvailableSafe + 1e-12);
  const hasBtc = (btcAvailable ?? 0) > 0;

  const costClp = amountClp * MONTHLY_RATE * months;
  const totalClp = amountClp + costClp;
  const cuotaClp = months > 0 ? totalClp / months : 0;

  const btcAvailableClp = btcAvailableSafe * btcScenarioPrice;
  const btcFrozenClp = collateralBtc * btcScenarioPrice;
  const btcRemainingClp = btcRemaining * btcScenarioPrice;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="k21-card p-6">
          <div className="text-sm text-white/60">Kapa21</div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Crédito</h1>
          <p className="mt-2 text-sm text-white/60">
            Simula un crédito en CLP respaldado con BTC. Esto es solo una simulación.
          </p>
        </div>

        {!hasBtc && !loadingData && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            No tienes BTC disponible para simular.
          </div>
        )}
        {dataError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {dataError}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="k21-card p-6 lg:col-span-1">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Simula tu crédito</div>
            <h2 className="mt-1 text-lg font-semibold">Parámetros</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-neutral-400">Monto a solicitar (CLP)</label>
                <input
                  className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-neutral-700"
                  inputMode="numeric"
                  value={amountInput}
                  placeholder="0"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, "");
                    if (!digits) {
                      setAmountInput("");
                      setAmountClp(0);
                      return;
                    }
                    const numeric = Number(digits);
                    setAmountClp(numeric);
                    setAmountInput(formatClpNumber(numeric));
                  }}
                />
                <div className="mt-1 text-xs text-neutral-500">
                  Máximo disponible: {hasData ? formatClp(maxLoanClp) : "—"}
                </div>
                {exceedMax && amountClp > 0 && (
                  <div className="mt-2 text-xs text-red-300">Monto excede el máximo permitido.</div>
                )}
              </div>

              <div>
                <label className="text-xs text-neutral-400">Plazo</label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonths(m)}
                      className={
                        m === months
                          ? "k21-btn-primary px-3 py-1.5 text-xs"
                          : "k21-btn-secondary px-3 py-1.5 text-xs"
                      }
                    >
                      {m} mes{m > 1 ? "es" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-400">LTV inicial</label>
                  <span className="text-xs text-neutral-300">{ltvPct.toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={maxLtvPct}
                  step={1}
                  value={ltvPct}
                  onChange={(e) => setLtvPct(Number(e.target.value))}
                  className="mt-2 w-full"
                />
                <label className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    checked={isSubscriber}
                    onChange={(e) => setIsSubscriber(e.target.checked)}
                  />
                  Soy suscriptor (USD 50/mes) — LTV máx 60%
                </label>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wide text-neutral-500">Salud del crédito</div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${badge.cls}`}>{badge.label}</span>
                </div>
                <div className="mt-2 text-xs text-neutral-400">
                  LTV actual: {hasScenario ? `${ltvScenarioPct.toFixed(2)}%` : "—"}
                </div>
                <div className="mt-3 space-y-1 text-xs text-neutral-500">
                  <div>Retiro de garantía posible: &lt; 40%</div>
                  <div>Salud riesgosa: ≥ 65%</div>
                  <div>Margin call: ≥ 70% (72 horas para agregar respaldo o pagar parte)</div>
                  <div>Liquidación automática: ≥ 80%</div>
                </div>
              </div>
            </div>
          </section>

          <section className="k21-card p-6 lg:col-span-2">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Resultado</div>
            <h2 className="mt-1 text-lg font-semibold">Simulación</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-neutral-500">Monto máximo que puedes pedir</div>
                <div className="mt-1 text-lg font-semibold text-neutral-100">
                  {hasData ? formatClp(maxLoanClp) : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-neutral-500">Garantía requerida</div>
                <div className="mt-1 text-lg font-semibold text-neutral-100">
                  {hasData ? formatBtc(collateralBtc) : "—"}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  {hasData ? formatClp(btcFrozenClp) : "—"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-neutral-500">Bitcoins disponibles actualmente</div>
                <div className="mt-1 text-lg font-semibold text-neutral-100">
                  {hasData ? formatBtc(btcAvailableSafe) : "—"}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  {hasData ? formatClp(btcAvailableClp) : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-neutral-500">Bitcoins a congelar</div>
                <div className="mt-1 text-lg font-semibold text-neutral-100">
                  {hasData ? formatBtc(collateralBtc) : "—"}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  {hasData ? formatClp(btcFrozenClp) : "—"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-neutral-500">Bitcoins disponibles después</div>
                <div className="mt-1 text-lg font-semibold text-neutral-100">
                  {hasData ? formatBtc(btcRemaining) : "—"}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  {hasData ? formatClp(btcRemainingClp) : "—"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-neutral-500">Total a pagar</div>
                <div className="mt-1 text-lg font-semibold text-neutral-100">
                  {hasData ? formatClp(totalClp) : "—"}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  Costo del crédito: {hasData ? formatClp(costClp) : "—"}
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  Cuota mensual aprox: {hasData ? formatClp(cuotaClp) : "—"}
                </div>
                <div className="mt-2 text-xs text-neutral-500">
                  Tasa de interés mensual: {(MONTHLY_RATE * 100).toFixed(2)}% · CAE: —
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="k21-card mt-6 p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Simulador LTV con precio BTC
          </div>
          <h2 className="mt-1 text-lg font-semibold">Escenario de precio BTC/CLP</h2>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <label className="text-xs text-neutral-400">Precio BTC/CLP (escenario)</label>
              <input
                className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-neutral-700"
                inputMode="numeric"
                value={btcPriceInput}
                disabled={!hasData}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, "");
                  if (!digits) {
                    setBtcPriceInput("");
                    setBtcPriceClp(null);
                    return;
                  }
                  const numeric = Number(digits);
                  const clamped = clamp(numeric, minPrice, maxPrice);
                  setBtcPriceClp(clamped);
                  setBtcPriceInput(formatClpNumber(clamped));
                }}
              />
              <div className="mt-1 text-xs text-neutral-500">
                Precio base: {hasData ? formatClp(basePriceSafe) : "—"}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>{hasData ? formatClp(minPrice) : "—"}</span>
                <span>{hasData ? formatClp(maxPrice) : "—"}</span>
              </div>
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                step={1000}
                value={hasData ? clamp(btcScenarioPrice, minPrice, maxPrice) : 0}
                disabled={!hasData}
                onChange={(e) => {
                  const numeric = Number(e.target.value);
                  setBtcPriceClp(numeric);
                  setBtcPriceInput(formatClpNumber(numeric));
                }}
                className="mt-2 w-full"
              />
              <div className="mt-4">
                <div className="relative h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
                  <div className="absolute inset-y-0 left-0 w-[40%] bg-sky-500/20" />
                  <div className="absolute inset-y-0 left-[40%] w-[25%] bg-emerald-500/20" />
                  <div className="absolute inset-y-0 left-[65%] w-[5%] bg-orange-500/25" />
                  <div className="absolute inset-y-0 left-[70%] w-[10%] bg-amber-500/25" />
                  <div className="absolute inset-y-0 left-[80%] w-[20%] bg-red-500/25" />
                  {hasScenario && (
                    <div
                      className="absolute top-0 h-3 w-0.5 bg-white"
                      style={{ left: `${clamp(ltvScenarioPct, 0, 100)}%` }}
                    />
                  )}
                </div>
                <div className="relative mt-2 h-4 text-[10px] text-neutral-500">
                  {[40, 65, 70, 80].map((p) => (
                    <span
                      key={p}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${p}%` }}
                    >
                      {p}%
                    </span>
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-neutral-400">
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5">
                    Retiro posible
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5">
                    Saludable
                  </span>
                  <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5">
                    Riesgoso
                  </span>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">
                    Margin call
                  </span>
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5">
                    Liquidación
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-neutral-400">
                LTV escenario: {hasScenario ? `${ltvScenarioPct.toFixed(2)}%` : "—"} · Estado: {badge.label}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
