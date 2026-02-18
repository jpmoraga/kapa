"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ltvBadge } from "@/lib/credito/ltv";

const FALLBACK_BTC_AVAILABLE = 0.02594742;
const FALLBACK_BTC_PRICE_CLP = 60867616;

const MONTHLY_RATE = 0.14 / 12; // 14% anual / 12

function parseNumberLike(input: string | number | null | undefined) {
  const v = typeof input === "number" ? input : Number(String(input ?? "").replace(/,/g, "."));
  return Number.isFinite(v) ? v : null;
}

function formatClpNumber(n: number) {
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("es-CL");
}

function formatClp(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `$${formatClpNumber(n)} CLP`;
}

function formatBtc(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  })} BTC`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function CreditoPage() {
  const router = useRouter();
  const [btcAvailable, setBtcAvailable] = useState<number | null>(null);
  const [basePriceClp, setBasePriceClp] = useState<number | null>(null);
  const [btcPriceClp, setBtcPriceClp] = useState<number | null>(null);
  const [btcPriceInput, setBtcPriceInput] = useState<string>("");
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [liquidationBands, setLiquidationBands] = useState<{
    withdraw: number;
    risk: number;
    marginCall: number;
    liquidation: number;
  } | null>(null);
  const [maxLtvPct, setMaxLtvPct] = useState<number>(50);

  const [amountClp, setAmountClp] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>("");
  const [months, setMonths] = useState<number>(3);
  const [isSubscriber, setIsSubscriber] = useState<boolean>(false);

  const loadSimData = useCallback(async () => {
    setLoadingData(true);
    setDataError(null);
    try {
      const res = await fetch("/api/credito/sim-data", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        const status = res.status;
        const rawError = typeof data?.error === "string" ? data.error : "";
        const code = typeof data?.code === "string" ? data.code : "";
        let message = rawError;
        if (status === 401) {
          message = "Debes iniciar sesión para ver tu capacidad de crédito.";
        } else if (status === 400 && rawError.toLowerCase().includes("empresa activa")) {
          message = "Selecciona una empresa activa para ver el simulador.";
        } else if (status >= 500) {
          message = "Error interno del simulador. Reintenta en unos minutos.";
        } else if (!message) {
          message = `Error cargando simulador (status=${status || "unknown"}). Reintenta.`;
        }
        if (code) message += ` (code=${code})`;
        setDataError(message);
        return;
      }

      const subscriber = Boolean(data?.isSubscriber);
      setIsSubscriber(subscriber);
      const maxLtvFromApi = parseNumberLike(data?.maxLtvPct ?? null);
      setMaxLtvPct(maxLtvFromApi !== null && maxLtvFromApi > 0 ? maxLtvFromApi : subscriber ? 60 : 50);
      const rawBands = data?.liquidationBands;
      if (rawBands && typeof rawBands === "object") {
        const withdraw = parseNumberLike((rawBands as any)?.withdraw);
        const risk = parseNumberLike((rawBands as any)?.risk);
        const marginCall = parseNumberLike((rawBands as any)?.marginCall);
        const liquidation = parseNumberLike((rawBands as any)?.liquidation);
        if (withdraw !== null || risk !== null || marginCall !== null || liquidation !== null) {
          setLiquidationBands({
            withdraw: withdraw ?? 40,
            risk: risk ?? 65,
            marginCall: marginCall ?? 70,
            liquidation: liquidation ?? 80,
          });
        } else {
          setLiquidationBands(null);
        }
      } else {
        setLiquidationBands(null);
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
  }, []);

  useEffect(() => {
    void loadSimData();
  }, [loadSimData]);

  const ltvPct = maxLtvPct;
  const ltv = maxLtvPct / 100;

  const hasData = btcAvailable !== null && basePriceClp !== null && basePriceClp > 0;
  const btcAvailableSafe = btcAvailable ?? 0;
  const basePriceSafe = basePriceClp ?? 0;
  const btcScenarioPrice = btcPriceClp ?? basePriceSafe;

  const minPrice = useMemo(() => (basePriceClp ? basePriceClp * 0.5 : 0), [basePriceClp]);
  const maxPrice = useMemo(() => (basePriceClp ? basePriceClp * 1.5 : 0), [basePriceClp]);

  const maxLoanClp = hasData ? btcAvailableSafe * basePriceSafe * (maxLtvPct / 100) : null;
  const collateralBtc =
    hasData && ltv > 0 && amountClp > 0 ? amountClp / (ltv * basePriceSafe) : null;
  const btcRemaining = collateralBtc !== null ? Math.max(btcAvailableSafe - collateralBtc, 0) : null;

  const ltvScenario =
    collateralBtc && btcScenarioPrice > 0 && amountClp > 0
      ? amountClp / (collateralBtc * btcScenarioPrice)
      : null;
  const ltvScenarioPct = ltvScenario !== null ? ltvScenario * 100 : null;
  const badge = ltvBadge(ltvScenarioPct);

  const exceedMax =
    maxLoanClp !== null &&
    (amountClp > maxLoanClp || (collateralBtc !== null && collateralBtc > btcAvailableSafe + 1e-12));
  const hasBtc = (btcAvailable ?? 0) > 0;

  const interestMonthly = amountClp > 0 ? amountClp * MONTHLY_RATE : null;

  const btcAvailableClp = hasData ? btcAvailableSafe * btcScenarioPrice : null;
  const btcFrozenClp = collateralBtc !== null ? collateralBtc * btcScenarioPrice : null;
  const btcRemainingClp = btcRemaining !== null ? btcRemaining * btcScenarioPrice : null;

  const ltvMax = (liquidationBands?.marginCall ?? 70) / 100;
  const liquidationLtv = (liquidationBands?.liquidation ?? 80) / 100;
  const targetSafe = 0.65;
  const targetWithdraw = 0.4;

  const requiredCollateralSafe =
    hasData && amountClp > 0 ? amountClp / (targetSafe * btcScenarioPrice) : null;
  const requiredCollateralWithdraw =
    hasData && amountClp > 0 ? amountClp / (targetWithdraw * btcScenarioPrice) : null;

  const addBtcNeeded =
    collateralBtc !== null && requiredCollateralSafe !== null
      ? Math.max(requiredCollateralSafe - collateralBtc, 0)
      : null;
  const amortizeNeeded =
    collateralBtc !== null && requiredCollateralSafe !== null
      ? Math.max(amountClp - collateralBtc * btcScenarioPrice * targetSafe, 0)
      : null;
  const withdrawableBtc =
    collateralBtc !== null && requiredCollateralWithdraw !== null
      ? Math.max(collateralBtc - requiredCollateralWithdraw, 0)
      : null;
  const canRequest =
    hasData &&
    basePriceClp !== null &&
    hasBtc &&
    amountClp > 0 &&
    maxLoanClp !== null &&
    amountClp <= maxLoanClp &&
    !isSubmitting;

  const handleCreateLoan = useCallback(async () => {
    if (!canRequest) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/credito/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principalClp: String(amountClp),
          termMonths: months,
          repaymentType: "BULLET",
          ltvTarget: maxLtvPct / 100,
          ltvMax,
          liquidationLtv,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setSubmitError(data?.error ?? "No se pudo solicitar el crédito.");
        return;
      }
      router.push("/credito/mis-creditos");
    } catch {
      setSubmitError("No se pudo solicitar el crédito.");
    } finally {
      setIsSubmitting(false);
    }
  }, [amountClp, canRequest, liquidationLtv, ltvMax, maxLtvPct, months, router]);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="k21-card p-6">
          <div className="text-sm text-white/60">Kapa21</div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Crédito con garantía BTC</h1>
          <p className="mt-2 text-sm text-white/60">
            Simulador informativo. No hay aprobación ni flujo bancario real.
          </p>
          <div className="mt-4">
            <Link href="/credito/mis-creditos" className="k21-btn-secondary px-3 py-1.5 text-xs">
              Ver mis créditos
            </Link>
          </div>
        </div>

        {dataError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {dataError}
          </div>
        )}

        {!loadingData && !hasBtc && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            No tienes BTC disponible para simular.
          </div>
        )}

        <section className="k21-card mt-6 p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Tu capacidad de crédito</div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">BTC disponible</span>
              <span className="font-medium">{formatBtc(btcAvailable)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Valor equivalente en CLP</span>
              <span className="font-medium">{formatClp(btcAvailableClp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Monto máximo de crédito</span>
              <span className="font-medium">{formatClp(maxLoanClp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">LTV máx</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-200">{maxLtvPct.toFixed(0)}%</span>
                {isSubscriber ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                    Suscripción activa
                  </span>
                ) : (
                  <button
                    type="button"
                    className="k21-btn-secondary px-2 py-1 text-[11px]"
                    onClick={() => setShowSubscriptionModal(true)}
                  >
                    Sube a 60% con Suscripción
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="k21-card mt-6 p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Configura tu crédito</div>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs text-neutral-400">
                Monto de crédito (CLP)
                <span className="ml-2 text-neutral-500" title="El monto está limitado por tu BTC disponible y el LTV inicial.">
                  ⓘ
                </span>
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-neutral-700"
                inputMode="numeric"
                value={amountInput}
                disabled={!hasData}
                placeholder={hasData ? "0" : "—"}
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
                Máximo disponible: {formatClp(maxLoanClp)}
              </div>
              {exceedMax && amountClp > 0 && (
                <div className="mt-2 text-xs text-red-300">Monto excede el máximo permitido.</div>
              )}
            </div>

            <div>
              <label className="text-xs text-neutral-400">
                Plazo
                <span className="ml-2 text-neutral-500" title="Plazo del crédito bullet: capital al vencimiento.">
                  ⓘ
                </span>
              </label>
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
                <label className="text-xs text-neutral-400">
                  LTV inicial
                  <span className="ml-2 text-neutral-500" title="50% estándar / 60% con suscripción.">
                    ⓘ
                  </span>
                </label>
                <span className="text-xs text-neutral-300">{ltvPct.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="k21-card mt-6 p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Pagos e intereses</div>
          <div className="mt-3 space-y-2 text-sm text-neutral-300">
            <div>Los intereses se pagan mensualmente.</div>
            <div>El capital se paga o renueva al vencimiento (crédito bullet).</div>
            <div>Se puede amortizar capital en cualquier momento.</div>
          </div>
          <div className="mt-4 text-sm text-neutral-400">
            Tasa mensual equivalente: {(MONTHLY_RATE * 100).toFixed(2)}% (14% anual / 12)
          </div>
          <div className="mt-2 text-sm text-neutral-100">
            Interés mensual estimado: {formatClp(interestMonthly)}
          </div>
        </section>

        <section className="k21-card mt-6 p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Salud del crédito</div>
          <div className="mt-3 space-y-2 text-sm text-neutral-300">
            <div>&lt;40%: puedes retirar garantía.</div>
            <div>40–65%: saludable.</div>
            <div>65–70%: riesgo (aviso por email).</div>
            <div>70–80%: margin call (72h).</div>
            <div>&gt;80%: liquidación parcial de garantía.</div>
          </div>
        </section>

        <section className="k21-card mt-6 p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Simulación de precio de Bitcoin</div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>{formatClp(minPrice)}</span>
              <span>{formatClp(maxPrice)}</span>
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
            <div className="mt-3 text-xs text-neutral-400">Precio escenario: {btcPriceInput || "—"}</div>

            <div className="mt-4">
              <div className="relative h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
                <div className="absolute inset-y-0 left-0 w-[40%] bg-sky-500/20" />
                <div className="absolute inset-y-0 left-[40%] w-[25%] bg-emerald-500/20" />
                <div className="absolute inset-y-0 left-[65%] w-[5%] bg-orange-500/25" />
                <div className="absolute inset-y-0 left-[70%] w-[10%] bg-amber-500/25" />
                <div className="absolute inset-y-0 left-[80%] w-[20%] bg-red-500/25" />
                {ltvScenarioPct !== null && (
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
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-neutral-400">
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5">
                  Retiro posible
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5">
                  Saludable
                </span>
                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5">
                  Riesgo
                </span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">
                  Margin call
                </span>
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5">
                  Liquidación parcial
                </span>
              </div>
              <div className="mt-3 text-xs text-neutral-300">
                LTV resultante: {ltvScenarioPct !== null ? `${ltvScenarioPct.toFixed(2)}%` : "—"} · Estado: {badge.label}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-300">
              <div className="font-medium text-neutral-200">Acciones sugeridas</div>
              <div className="mt-2 space-y-1">
                {withdrawableBtc && withdrawableBtc > 0 ? (
                  <div>• Puedes retirar {formatBtc(withdrawableBtc)}</div>
                ) : null}
                {addBtcNeeded && addBtcNeeded > 0 ? (
                  <div>• Agregar {formatBtc(addBtcNeeded)}</div>
                ) : null}
                {amortizeNeeded && amortizeNeeded > 0 ? (
                  <div>• Amortizar {formatClp(amortizeNeeded)}</div>
                ) : null}
                {!hasData && <div>• Esperando datos para sugerencias.</div>}
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                La liquidación, si ocurre, es parcial y no total.
              </div>
            </div>
          </div>
        </section>

        <section className="k21-card mt-6 p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Resumen del crédito</div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Monto solicitado</span>
              <span className="font-medium">{formatClp(amountClp || null)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Garantía en BTC</span>
              <span className="font-medium">{formatBtc(collateralBtc)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">LTV inicial</span>
              <span className="font-medium">{ltvPct.toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Interés mensual estimado</span>
              <span className="font-medium">{formatClp(interestMonthly)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Plazo</span>
              <span className="font-medium">{months} mes{months > 1 ? "es" : ""}</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-neutral-500">
            Este simulador es referencial. Condiciones finales sujetas a evaluación.
          </div>
        </section>

        <div className="mt-6">
          <button
            type="button"
            className={`w-full ${canRequest ? "k21-btn-primary" : "k21-btn-disabled"}`}
            disabled={!canRequest}
            onClick={handleCreateLoan}
          >
            {isSubmitting ? "Solicitando..." : "Solicitar crédito"}
          </button>
          {submitError && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {submitError}
            </div>
          )}
        </div>
      </div>

      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="k21-card w-full max-w-md p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Suscripción Kapa21</div>
            <h2 className="mt-2 text-lg font-semibold text-white">Suscripción Kapa21</h2>
            <div className="mt-4 space-y-2 text-sm text-neutral-300">
              <div>• Mayor LTV (hasta 60%)</div>
              <div>• Mejor tasa en créditos</div>
              <div>• Mejores comisiones en compras</div>
              <div>• Más herramientas para gestión</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="k21-btn-secondary px-3 py-1.5 text-xs"
                onClick={() => setShowSubscriptionModal(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
