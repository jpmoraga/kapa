"use client";

import { useState } from "react";

const MIN_INVESTMENT = 3000;
const MAX_INVESTMENT = 50000;
const DEFAULT_INVESTMENT = 5000;
const STEP = 1000;
const CAP_BASE = 1_000_000;
const TRAMO_1_SIZE = 50_000;
const TRAMO_2_CAP = 2_000_000;
const PRESET_AMOUNTS = [3000, 5000, 10000, 25000] as const;

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function ParticipationSimulator() {
  const [investment, setInvestment] = useState(DEFAULT_INVESTMENT);

  const progress = ((investment - MIN_INVESTMENT) / (MAX_INVESTMENT - MIN_INVESTMENT)) * 100;
  const capBaseParticipation = (investment / CAP_BASE) * 100;
  const tramoOneShare = (investment / TRAMO_1_SIZE) * 100;
  const tramoTwoEquivalent = (investment / TRAMO_2_CAP) * 100;

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(11,14,19,0.86),rgba(11,14,19,0.72))] p-5 shadow-[0_24px_72px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(247,147,26,0.14),transparent_24%),radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.06),transparent_24%)]" />

      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            Monto seleccionado
          </div>
          <div className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-[2.8rem]">
            {formatter.format(investment)}
          </div>
        </div>
        <div className="space-y-2 text-right">
          <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            Participación estimada
          </div>
          <div className="text-3xl font-semibold tracking-tight text-white">
            {capBaseParticipation.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="relative mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-neutral-400">
          <span>{formatter.format(MIN_INVESTMENT)}</span>
          <div className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] text-neutral-200">
            Ticket visible desde {formatter.format(MIN_INVESTMENT)}
          </div>
          <span>{formatter.format(MAX_INVESTMENT)}</span>
        </div>

        <div className="relative mt-4">
          <div className="h-2 rounded-full bg-white/10" />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#F7931A,#FFB155)] shadow-[0_0_18px_rgba(247,147,26,0.3)]"
            style={{ width: `${progress}%` }}
          />
          <input
            aria-label="Monto de inversión"
            type="range"
            min={MIN_INVESTMENT}
            max={MAX_INVESTMENT}
            step={STEP}
            value={investment}
            onChange={(event) => setInvestment(Number(event.target.value))}
            className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#0b0e13] [&::-moz-range-thumb]:bg-[#F7931A] [&::-moz-range-thumb]:shadow-[0_0_0_4px_rgba(247,147,26,0.18)] [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0b0e13] [&::-webkit-slider-thumb]:bg-[#F7931A] [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(247,147,26,0.18)]"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {PRESET_AMOUNTS.map((amount) => {
            const isActive = investment === amount;

            return (
              <button
                key={amount}
                type="button"
                onClick={() => setInvestment(amount)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  isActive
                    ? "border-[#F7931A]/25 bg-[#F7931A]/12 text-[#FFD29E]"
                    : "border-white/12 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                {formatter.format(amount)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
            Cap base de referencia
          </div>
          <div className="mt-2 text-xl font-semibold text-white">{formatter.format(CAP_BASE)}</div>
        </div>
        <div className="rounded-2xl border border-[#F7931A]/18 bg-[#F7931A]/8 p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
            Participación estimada
          </div>
          <div className="mt-2 text-xl font-semibold text-white">
            {capBaseParticipation.toFixed(2)}%
          </div>
        </div>
        <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
            Porción del tramo 1
          </div>
          <div className="mt-2 text-xl font-semibold text-white">{tramoOneShare.toFixed(1)}%</div>
        </div>
        <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
            Referencia tramo 2
          </div>
          <div className="mt-2 text-xl font-semibold text-white">
            {tramoTwoEquivalent.toFixed(2)}% a US$2M
          </div>
        </div>
      </div>

      <p className="relative mt-6 text-sm leading-7 text-neutral-100">
        Con {formatter.format(investment)}, tu exposición inicial en esta etapa representa
        aproximadamente <span className="font-semibold text-white">{capBaseParticipation.toFixed(2)}%</span>{" "}
        del cap base de referencia y{" "}
        <span className="font-semibold text-white">{tramoOneShare.toFixed(1)}%</span> del tramo 1
        de US$50.000.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm font-semibold text-white">Acceso temprano</div>
          <p className="mt-2 text-sm leading-6 text-neutral-200">
            Entrada en una fase de instalación de estructura, oferta y ejecución comercial.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm font-semibold text-white">Validación del tramo 1</div>
          <p className="mt-2 text-sm leading-6 text-neutral-200">
            El foco del capital es dejar lista la base societaria, regulatoria, operativa y de
            activación inicial.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm font-semibold text-white">Referencia de etapa siguiente</div>
          <p className="mt-2 text-sm leading-6 text-neutral-200">
            Si se abre el tramo 2 a US$2M, cambia la referencia de entrada. Eso no implica retorno
            ni resultado asegurado.
          </p>
        </div>
      </div>

      <p className="mt-6 border-t border-white/10 pt-4 text-xs leading-6 text-neutral-400">
        Referencia ilustrativa para entender la etapa. No constituye promesa de retorno ni cálculo
        definitivo del SAFE.
      </p>
    </div>
  );
}
