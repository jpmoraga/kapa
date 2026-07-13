"use client";

import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  MINING_SIMULATION_INTERACTION_DEBOUNCE_MS,
  getMiningSimulationEventSignature,
  roundMiningSimulationValue,
  trackMiningSimulationEvent,
  type MiningFractionalSimulationTrackingPayload,
} from "@/lib/miningSimulationTracking";

type MiningFractionalSimulatorProps = {
  ctaHref: string;
};

type FractionalPlanKey = "plan1" | "plan2" | "plan3";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plans = {
  plan1: {
    key: "plan1",
    label: "Plan 1 año",
    priceUsdPerTh: 20,
    durationLabel: "12 meses de acceso",
  },
  plan2: {
    key: "plan2",
    label: "Plan 2 años",
    priceUsdPerTh: 39,
    durationLabel: "24 meses de acceso",
  },
  plan3: {
    key: "plan3",
    label: "Plan 3 años",
    priceUsdPerTh: 58,
    durationLabel: "36 meses de acceso",
  },
} satisfies Record<
  FractionalPlanKey,
  {
    key: FractionalPlanKey;
    label: string;
    priceUsdPerTh: number;
    durationLabel: string;
  }
>;

const planOptions = [plans.plan1, plans.plan2, plans.plan3] as const;
const planTrackingMap: Record<
  FractionalPlanKey,
  "PLAN_1_YEAR" | "PLAN_2_YEARS" | "PLAN_3_YEARS"
> = {
  plan1: "PLAN_1_YEAR",
  plan2: "PLAN_2_YEARS",
  plan3: "PLAN_3_YEARS",
};

function formatUsd(value: number) {
  return `USD ${currencyFormatter.format(value)}`;
}

function formatThs(value: number) {
  return `${currencyFormatter.format(value)} TH/s`;
}

function selectorButtonClass(selected: boolean, disabled: boolean) {
  return cn(
    "flex-1 rounded-[0.95rem] border px-3.5 py-3 text-left transition-colors transition-shadow duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
    disabled && "cursor-not-allowed opacity-55",
    selected
      ? "border-accent bg-accent text-accent-foreground shadow-[var(--shadow)]"
      : "border-border bg-background/70 text-foreground hover:bg-surface",
  );
}

export function MiningFractionalSimulator({ ctaHref }: MiningFractionalSimulatorProps) {
  const [thsInput, setThsInput] = useState("10");
  const [selectedPlanKey, setSelectedPlanKey] = useState<FractionalPlanKey>("plan1");
  const hasTrackedInteractionRef = useRef(false);
  const lastInteractionSignatureRef = useRef<string | null>(null);

  const handleThsInputChange = (nextValue: string) => {
    if (nextValue !== thsInput) {
      hasTrackedInteractionRef.current = true;
    }

    setThsInput(nextValue);
  };

  const normalizedInput = thsInput.replace(",", ".");
  const parsedThsAmount = Number.parseFloat(normalizedInput);
  const thsAmount =
    Number.isFinite(parsedThsAmount) && parsedThsAmount > 0
      ? parsedThsAmount
      : 0;

  const currentPlan = plans[selectedPlanKey];
  const scenarioValid = thsAmount > 0;
  const totalEstimatedCost = scenarioValid ? thsAmount * currentPlan.priceUsdPerTh : 0;
  const interactionPayload: MiningFractionalSimulationTrackingPayload | null =
    scenarioValid
      ? {
          eventType: "SIMULATION_INTERACTION",
          simulatorType: "FRACTIONAL",
          fractionalPlan: planTrackingMap[selectedPlanKey],
          estimatedThs: roundMiningSimulationValue(thsAmount),
          totalEstimatedUsd: roundMiningSimulationValue(totalEstimatedCost),
        }
      : null;
  const interactionSignature = interactionPayload
    ? getMiningSimulationEventSignature(interactionPayload)
    : null;

  useEffect(() => {
    if (!hasTrackedInteractionRef.current || !interactionSignature) {
      return;
    }

    if (lastInteractionSignatureRef.current === interactionSignature) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (lastInteractionSignatureRef.current === interactionSignature) {
        return;
      }

      lastInteractionSignatureRef.current = interactionSignature;
      void trackMiningSimulationEvent(
        JSON.parse(interactionSignature) as MiningFractionalSimulationTrackingPayload,
      );
    }, MINING_SIMULATION_INTERACTION_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [interactionSignature]);

  const handleCtaClick = () => {
    if (!interactionPayload) {
      return;
    }

    void trackMiningSimulationEvent(
      {
        ...interactionPayload,
        eventType: "CTA_CLICKED",
      },
      { keepalive: true },
    );
  };

  return (
    <Section
      tone="default"
      spacing="md"
      id="simulador-fraccionado"
      className="py-12 sm:py-16 lg:py-24"
    >
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="SIMULADOR SIMPLE"
          title="Simula tu plan fraccionado"
          description="Elige un plan, define la cantidad de TH/s y estima el pago único inicial con hosting incluido durante todo el plazo."
          className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.08rem] [&_p]:max-w-4xl [&_p]:text-[0.98rem] [&_p]:leading-6 sm:[&_p]:text-base sm:[&_p]:leading-7"
        />

        <Card
          variant="elevated"
          className="grid gap-5 rounded-[1.15rem] p-4 shadow-none sm:p-6 sm:shadow-[var(--shadow)] lg:gap-6 lg:p-7"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,1.08fr)] lg:items-start">
            <div className="grid gap-4">
              <div className="grid gap-2 rounded-[1rem] border border-border bg-background/70 p-3.5 sm:p-4">
                <label
                  htmlFor="fractional-ths-amount"
                  className="text-[0.92rem] font-medium text-foreground sm:text-[0.98rem]"
                >
                  Cantidad de TH/s
                </label>
                <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                  <span className="inline-flex h-11 items-center rounded-[0.9rem] border border-border bg-surface px-3 text-sm font-semibold text-foreground">
                    TH/s
                  </span>
                  <input
                    id="fractional-ths-amount"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={thsInput}
                    placeholder="10"
                    onChange={(event) => handleThsInputChange(event.target.value)}
                    className="h-11 rounded-[0.9rem] border border-border bg-surface px-3 text-base text-foreground outline-none transition-colors focus:border-accent"
                  />
                </div>
                <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-sm">
                  Ingresa la capacidad que quieres contratar. El precio por TH/s depende del plan elegido.
                </p>
                {!scenarioValid ? (
                  <div className="rounded-[0.9rem] border border-accent/20 bg-accent/[0.08] px-3 py-2 text-[0.82rem] leading-5 text-foreground sm:text-sm">
                    Ingresa una cantidad de TH/s mayor a 0.
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2 rounded-[1rem] border border-border bg-background/70 p-3.5 sm:p-4">
                <div className="text-[0.92rem] font-medium text-foreground sm:text-[0.98rem]">
                  Plan
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {planOptions.map((plan) => {
                    const selected = plan.key === selectedPlanKey;

                    return (
                      <button
                        key={plan.key}
                        type="button"
                        onClick={() => {
                          if (plan.key !== selectedPlanKey) {
                            hasTrackedInteractionRef.current = true;
                          }

                          setSelectedPlanKey(plan.key);
                        }}
                        aria-pressed={selected}
                        className={selectorButtonClass(selected, false)}
                      >
                        <div className="text-sm font-semibold">{plan.label}</div>
                        <div
                          className={cn(
                            "mt-1 text-[0.82rem] leading-5 sm:text-sm",
                            selected ? "text-accent-foreground/85" : "text-foreground-muted",
                          )}
                        >
                          {formatUsd(plan.priceUsdPerTh)} por TH/s
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-[0.78rem] leading-5 sm:text-[0.82rem]",
                            selected ? "text-accent-foreground/80" : "text-foreground-muted",
                          )}
                        >
                          Hosting incluido
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1">
                {scenarioValid ? (
                  <Button
                    href={ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCtaClick}
                    variant="primary"
                    className="min-h-11 w-full rounded-full px-4 text-sm lg:w-auto"
                  >
                    Consultar este escenario
                  </Button>
                ) : (
                  <Button
                    disabled
                    aria-disabled="true"
                    variant="primary"
                    className="min-h-11 w-full rounded-full px-4 text-sm lg:w-auto"
                  >
                    Ingresa una cantidad de TH/s
                  </Button>
                )}
              </div>
            </div>

            <Card
              variant="highlight"
              className="grid gap-4 rounded-[1rem] border-accent/30 bg-surface-elevated/92 p-4 shadow-none sm:p-5 sm:shadow-[var(--shadow)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <Badge variant="accent" className="px-2.25 py-1 text-[0.68rem] tracking-[0.14em] sm:px-2.5 sm:text-[0.72rem]">
                  {currentPlan.label}
                </Badge>
                <span className="text-[0.84rem] font-medium text-foreground-muted sm:text-sm">
                  Estimación comercial
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] border border-border bg-background/72 px-4 py-3.5">
                  <div className="text-[0.78rem] uppercase tracking-[0.16em] text-foreground-muted">
                    TH/s seleccionados
                  </div>
                  <div className="mt-1.5 text-[1.72rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[2.02rem]">
                    {scenarioValid ? formatThs(thsAmount) : "No disponible"}
                  </div>
                </div>
                <div className="rounded-[1rem] border border-accent/22 bg-accent/[0.08] px-4 py-3.5">
                  <div className="text-[0.78rem] uppercase tracking-[0.16em] text-foreground-muted">
                    Costo total estimado
                  </div>
                  <div className="mt-1.5 text-[1.72rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[2.02rem]">
                    {scenarioValid ? formatUsd(totalEstimatedCost) : "No disponible"}
                  </div>
                </div>
              </div>

              {!scenarioValid ? (
                <div className="rounded-[1rem] border border-accent/20 bg-accent/[0.08] px-4 py-3 text-[0.92rem] leading-6 text-foreground sm:text-[0.98rem] sm:leading-6">
                  Ingresa una cantidad de TH/s mayor a 0 para ver un escenario válido.
                </div>
              ) : null}

              <div className="grid gap-2.5 rounded-[1rem] border border-border bg-background/72 px-4 py-3.5">
                {[
                  { label: "Plan seleccionado", value: currentPlan.label },
                  { label: "Cantidad de TH/s", value: scenarioValid ? formatThs(thsAmount) : "No disponible" },
                  { label: "Precio por TH/s", value: formatUsd(currentPlan.priceUsdPerTh) },
                  { label: "Total", value: scenarioValid ? formatUsd(totalEstimatedCost) : "No disponible" },
                  { label: "Hosting", value: "Incluido durante todo el período" },
                  { label: "Pago único", value: "Un solo pago inicial" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="grid gap-1 border-b border-border/70 pb-2.5 last:border-b-0 last:pb-0 min-[420px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] min-[420px]:items-start min-[420px]:gap-3"
                  >
                    <div className="text-[0.88rem] font-medium leading-5 text-foreground sm:text-sm">
                      {item.label}
                    </div>
                    <div className="text-[0.95rem] leading-6 text-foreground-muted min-[420px]:text-right sm:text-base sm:leading-7">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-2 rounded-[1rem] border border-border bg-background/72 px-4 py-3.5">
            <p className="text-[0.92rem] leading-6 text-foreground sm:text-[0.98rem] sm:leading-7">
              El total considera la capacidad contratada y el hosting durante todo el plazo seleccionado.
            </p>
            <p className="text-[0.88rem] leading-6 text-foreground-muted sm:text-sm sm:leading-6">
              Sin pagos mensuales adicionales. Las distribuciones periódicas en Bitcoin dependen de la producción minera efectiva y de las condiciones de red.
            </p>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
