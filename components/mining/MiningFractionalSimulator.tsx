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

type FractionalPlanKey = "plan15" | "plan27";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plans = {
  plan15: {
    key: "plan15",
    label: "Plan 15 meses",
    activationUsdPerTh: 15,
    hostingMonthlyUsdPerTh: 0.893,
    months: 15,
    termLabel: "Contrato base 12 meses · hoy con 15 meses de acceso",
    secondaryNote: null,
  },
  plan27: {
    key: "plan27",
    label: "Plan 27 meses",
    activationUsdPerTh: 25,
    hostingMonthlyUsdPerTh: 0.893,
    months: 27,
    termLabel: "Contrato base 24 meses · hoy con 27 meses de acceso",
    secondaryNote: "El segundo año no requiere nueva activación.",
  },
} satisfies Record<
  FractionalPlanKey,
  {
    key: FractionalPlanKey;
    label: string;
    activationUsdPerTh: number;
    hostingMonthlyUsdPerTh: number;
    months: number;
    termLabel: string;
    secondaryNote: string | null;
  }
>;

const planOptions = [plans.plan15, plans.plan27] as const;
const planTrackingMap: Record<FractionalPlanKey, "PLAN_15_MONTHS" | "PLAN_27_MONTHS"> = {
  plan15: "PLAN_15_MONTHS",
  plan27: "PLAN_27_MONTHS",
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
  const [activationInput, setActivationInput] = useState("1000");
  const [selectedPlanKey, setSelectedPlanKey] = useState<FractionalPlanKey>("plan15");
  const hasTrackedInteractionRef = useRef(false);
  const lastInteractionSignatureRef = useRef<string | null>(null);

  const handleActivationInputChange = (nextValue: string) => {
    if (nextValue !== activationInput) {
      hasTrackedInteractionRef.current = true;
    }

    const nextNormalizedInput = nextValue.replace(",", ".");
    const nextParsedActivationAmount = Number.parseFloat(nextNormalizedInput);
    const nextActivationAmount =
      Number.isFinite(nextParsedActivationAmount) && nextParsedActivationAmount > 0
        ? nextParsedActivationAmount
        : 0;

    if (
      selectedPlanKey === "plan27" &&
      nextActivationAmount < plans.plan27.activationUsdPerTh
    ) {
      setSelectedPlanKey("plan15");
    }

    setActivationInput(nextValue);
  };

  const normalizedInput = activationInput.replace(",", ".");
  const parsedActivationAmount = Number.parseFloat(normalizedInput);
  const activationAmount =
    Number.isFinite(parsedActivationAmount) && parsedActivationAmount > 0
      ? parsedActivationAmount
      : 0;
  const meetsGeneralMinimum = activationAmount >= plans.plan15.activationUsdPerTh;
  const plan27Enabled = activationAmount >= plans.plan27.activationUsdPerTh;

  const currentPlan = plans[selectedPlanKey];
  const scenarioValid = meetsGeneralMinimum;
  const ths = scenarioValid ? activationAmount / currentPlan.activationUsdPerTh : 0;
  const monthlyHosting = scenarioValid ? ths * currentPlan.hostingMonthlyUsdPerTh : 0;
  const totalHosting = scenarioValid ? monthlyHosting * currentPlan.months : 0;
  const totalEstimatedCost = scenarioValid ? activationAmount + totalHosting : 0;
  const interactionPayload: MiningFractionalSimulationTrackingPayload | null =
    scenarioValid
      ? {
          eventType: "SIMULATION_INTERACTION",
          simulatorType: "FRACTIONAL",
          fractionalPlan: planTrackingMap[selectedPlanKey],
          activationAmountUsd: roundMiningSimulationValue(activationAmount),
          estimatedThs: roundMiningSimulationValue(ths),
          hostingMonthlyUsd: roundMiningSimulationValue(monthlyHosting),
          hostingTotalUsd: roundMiningSimulationValue(totalHosting),
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
          description="Ingresa un monto de activación/acceso y estima cuántos TH/s podrías contratar, junto con el hosting mensual y el costo total del periodo."
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
                  htmlFor="fractional-activation-amount"
                  className="text-[0.92rem] font-medium text-foreground sm:text-[0.98rem]"
                >
                  Monto de activación / acceso
                </label>
                <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                  <span className="inline-flex h-11 items-center rounded-[0.9rem] border border-border bg-surface px-3 text-sm font-semibold text-foreground">
                    USD
                  </span>
                  <input
                    id="fractional-activation-amount"
                    type="number"
                    inputMode="decimal"
                    min="15"
                    step="0.01"
                    value={activationInput}
                    placeholder="1000"
                    onChange={(event) => handleActivationInputChange(event.target.value)}
                    className="h-11 rounded-[0.9rem] border border-border bg-surface px-3 text-base text-foreground outline-none transition-colors focus:border-accent"
                  />
                </div>
                <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-sm">
                  Valor referencial para estimar acceso por TH/s. El hosting mensual se calcula por separado.
                </p>
                {!meetsGeneralMinimum ? (
                  <div className="rounded-[0.9rem] border border-accent/20 bg-accent/[0.08] px-3 py-2 text-[0.82rem] leading-5 text-foreground sm:text-sm">
                    El monto mínimo de activación/acceso es USD 15.
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
                    const disabled = plan.key === "plan27" && !plan27Enabled;

                    return (
                      <button
                        key={plan.key}
                        type="button"
                        onClick={() => {
                          if (!disabled) {
                            if (plan.key !== selectedPlanKey) {
                              hasTrackedInteractionRef.current = true;
                            }

                            setSelectedPlanKey(plan.key);
                          }
                        }}
                        aria-pressed={selected}
                        aria-disabled={disabled}
                        disabled={disabled}
                        className={selectorButtonClass(selected, disabled)}
                      >
                        <div className="text-sm font-semibold">{plan.label}</div>
                        <div
                          className={cn(
                            "mt-1 text-[0.82rem] leading-5 sm:text-sm",
                            selected ? "text-accent-foreground/85" : "text-foreground-muted",
                          )}
                        >
                          {formatUsd(plan.activationUsdPerTh)} por TH/s
                        </div>
                        {disabled ? (
                          <div className="mt-1 text-[0.78rem] leading-5 text-foreground-muted sm:text-[0.82rem]">
                            Disponible desde USD 25.
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {!plan27Enabled ? (
                  <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-sm">
                    El Plan 27 meses requiere un mínimo de USD 25 de activación/acceso.
                  </p>
                ) : null}
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
                    Ingresa al menos USD 15
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
                    TH/s estimados
                  </div>
                  <div className="mt-1.5 text-[1.72rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[2.02rem]">
                    {scenarioValid ? formatThs(ths) : "No disponible"}
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
                  Ingresa al menos USD 15 para ver un escenario válido.
                </div>
              ) : null}

              <div className="grid gap-2.5 rounded-[1rem] border border-border bg-background/72 px-4 py-3.5">
                {[
                  { label: "Plan seleccionado", value: currentPlan.label },
                  { label: "Activación / acceso", value: formatUsd(activationAmount) },
                  {
                    label: "Hosting mensual estimado",
                    value: scenarioValid ? formatUsd(monthlyHosting) : "No disponible",
                  },
                  {
                    label: "Hosting total del periodo",
                    value: scenarioValid ? formatUsd(totalHosting) : "No disponible",
                  },
                  { label: "Plazo promocional aplicado", value: currentPlan.termLabel },
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

              {currentPlan.secondaryNote ? (
                <div className="rounded-[1rem] border border-accent/20 bg-accent/[0.08] px-4 py-3 text-[0.92rem] leading-6 text-foreground sm:text-[0.98rem] sm:leading-6">
                  {currentPlan.secondaryNote}
                </div>
              ) : null}
            </Card>
          </div>

          <div className="grid gap-2 rounded-[1rem] border border-border bg-background/72 px-4 py-3.5">
            <p className="text-[0.92rem] leading-6 text-foreground sm:text-[0.98rem] sm:leading-7">
              El hosting se calcula mensualmente según el TH/s contratado y puede pagarse en USDT, USDC, Bitcoin o transferencia bancaria (Chile).
            </p>
            <p className="text-[0.88rem] leading-6 text-foreground-muted sm:text-sm sm:leading-6">
              La simulación estima costos de acceso y hosting. Las distribuciones mensuales en Bitcoin dependen de la producción minera efectiva y de las condiciones de red.
            </p>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
