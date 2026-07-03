"use client";

import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import type { AsicModel, CoolingType } from "@/data/mining/asic-models";
import { asicModels } from "@/data/mining/asic-models";
import { buildAsicQuoteText } from "@/data/mining/cta";
import { buildWhatsAppUrl } from "@/lib/publicContact";

type SimulatableAsic = {
  availabilityLabel: string | null;
  category: AsicModel["category"];
  coolingLabel: string | null;
  efficiencyJTh: number | null;
  hashrateThs: number;
  imageAlt: string | null;
  imageSrc: string | null;
  manufacturer: string;
  model: string;
  powerW: number;
  priceUsd: number;
  slug: string;
};

const tariffHostingUsdPerKwh = 0.078;
const factorCarga = 1.06;
const horasDia = 24;
const diasMes = 30;
const garantiaMeses = 2;

const usdFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getCoolingLabel(value: CoolingType | null) {
  if (value === "air") {
    return "Aire";
  }

  if (value === "hydro") {
    return "Hidro";
  }

  return null;
}

const simulatableAsics: SimulatableAsic[] = asicModels.flatMap((model) => {
  const hashrateThs = model.hashrate.state !== "unknown" ? model.hashrate.value : null;
  const powerW = model.power.state !== "unknown" ? model.power.value : null;
  const priceUsd =
    model.referencePrice.state !== "unknown" ? model.referencePrice.amount : null;

  if (hashrateThs === null || powerW === null || priceUsd === null) {
    return [];
  }

  return [
    {
      availabilityLabel:
        model.availability.state !== "unknown" ? model.availability.label : null,
      category: model.category,
      coolingLabel:
        model.cooling.state !== "unknown" ? getCoolingLabel(model.cooling.value) : null,
      efficiencyJTh:
        model.efficiency.state !== "unknown" ? model.efficiency.value : null,
      hashrateThs,
      imageAlt: model.image.alt,
      imageSrc: model.image.state !== "unknown" ? model.image.src : null,
      manufacturer: model.manufacturer,
      model: model.model,
      powerW,
      priceUsd,
      slug: model.slug,
    },
  ];
});

function formatUsd(value: number) {
  return `USD ${usdFormatter.format(value)}`;
}

function formatThs(value: number) {
  return `${decimalFormatter.format(value)} TH/s`;
}

function formatPower(value: number) {
  return `${numberFormatter.format(value)} W`;
}

function calculateScenario(model: SimulatableAsic, quantity: number) {
  const consumoKw = model.powerW / 1000;
  const hostingMensualUnit =
    consumoKw * horasDia * diasMes * factorCarga * tariffHostingUsdPerKwh;
  const garantiaUnit = hostingMensualUnit * garantiaMeses;

  return {
    consumptionTotalW: model.powerW * quantity,
    costInitialTotal: model.priceUsd * quantity + garantiaUnit * quantity,
    guaranteeTotal: garantiaUnit * quantity,
    hashrateTotal: model.hashrateThs * quantity,
    hostingMonthlyTotal: hostingMensualUnit * quantity,
    monthlyPaymentTotal: hostingMensualUnit * quantity,
    priceEquipmentTotal: model.priceUsd * quantity,
  };
}

export function MiningAsicSimulator() {
  const [selectedSlug, setSelectedSlug] = useState(simulatableAsics[0]?.slug ?? "");
  const [quantity, setQuantity] = useState(1);

  const selectedAsic =
    simulatableAsics.find((model) => model.slug === selectedSlug) ??
    simulatableAsics[0] ??
    null;

  if (!selectedAsic) {
    return null;
  }

  const scenario = calculateScenario(selectedAsic, quantity);
  const ctaHref = buildWhatsAppUrl(buildAsicQuoteText(selectedAsic.model));

  return (
    <Section tone="default" spacing="md" id="simulador-asic" className="py-12 sm:py-16 lg:py-24">
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="ASIC PROPIO"
          title="Simula un ASIC propio"
          description="Selecciona un equipo y estima el costo inicial, la garantía de hosting y el pago mensual operativo."
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
                  htmlFor="asic-simulator-model"
                  className="text-[0.92rem] font-medium text-foreground sm:text-[0.98rem]"
                >
                  Equipo ASIC
                </label>
                <select
                  id="asic-simulator-model"
                  value={selectedAsic.slug}
                  onChange={(event) => setSelectedSlug(event.target.value)}
                  className="h-11 rounded-[0.9rem] border border-border bg-surface px-3 text-base text-foreground outline-none transition-colors focus:border-accent"
                >
                  {simulatableAsics.map((model) => (
                    <option key={model.slug} value={model.slug}>
                      {model.manufacturer} {model.model} · {decimalFormatter.format(model.hashrateThs)} TH/s
                    </option>
                  ))}
                </select>
                <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-sm">
                  Usa la misma base de equipos que hoy alimenta el catálogo público disponible.
                </p>
              </div>

              <div className="grid gap-2 rounded-[1rem] border border-border bg-background/70 p-3.5 sm:p-4">
                <label
                  htmlFor="asic-simulator-quantity"
                  className="text-[0.92rem] font-medium text-foreground sm:text-[0.98rem]"
                >
                  Cantidad de equipos
                </label>
                <input
                  id="asic-simulator-quantity"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => {
                    const parsedQuantity = Number.parseInt(event.target.value, 10);

                    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
                      setQuantity(1);
                      return;
                    }

                    setQuantity(parsedQuantity);
                  }}
                  className="h-11 rounded-[0.9rem] border border-border bg-surface px-3 text-base text-foreground outline-none transition-colors focus:border-accent"
                />
                <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-sm">
                  La cantidad mínima es 1. Al aumentar la cantidad se multiplica precio, hashrate, consumo, garantía y hosting.
                </p>
              </div>

              <div className="grid gap-3 rounded-[1rem] border border-border bg-background/70 p-3.5 sm:p-4">
                <div className="grid gap-1">
                  <p className="text-[0.92rem] font-medium text-foreground sm:text-[0.98rem]">
                    Datos operativos
                  </p>
                  <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-sm">
                    Referencias contractuales usadas para estimar hosting y garantía.
                  </p>
                </div>

                <div className="grid gap-2.5 rounded-[0.95rem] border border-border bg-background/72 px-3.5 py-3.5">
                  {[
                    {
                      label: "Tarifa energética referencial",
                      value: "USD 0,078/kWh",
                    },
                    { label: "Factor de carga", value: "1,06" },
                    { label: "Base de consumo", value: "24 horas x 30 días" },
                    {
                      label: "Garantía estimada",
                      value: "2 meses de hosting",
                    },
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
              </div>
            </div>

            <Card
              variant="highlight"
              className="grid gap-4 rounded-[1rem] border-accent/30 bg-surface-elevated/92 p-4 shadow-none sm:p-5 sm:shadow-[var(--shadow)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="accent"
                    className="px-2.25 py-1 text-[0.68rem] tracking-[0.14em] sm:px-2.5 sm:text-[0.72rem]"
                  >
                    ASIC propio
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-border/80 bg-background/70 px-2.25 py-1 text-[0.62rem] tracking-[0.14em] text-foreground-muted sm:px-2.5 sm:text-[0.68rem]"
                  >
                    {selectedAsic.category}
                  </Badge>
                  {selectedAsic.availabilityLabel ? (
                    <Badge
                      variant="outline"
                      className="border-border/80 bg-background/70 px-2.25 py-1 text-[0.62rem] tracking-[0.14em] text-foreground-muted sm:px-2.5 sm:text-[0.68rem]"
                    >
                      {selectedAsic.availabilityLabel}
                    </Badge>
                  ) : null}
                </div>
                <span className="text-[0.84rem] font-medium text-foreground-muted sm:text-sm">
                  Estimación operativa
                </span>
              </div>

              <div className="grid gap-3.5">
                <div className="overflow-hidden rounded-[1rem] border border-border bg-background/72 p-2.5 sm:p-3.5">
                  {selectedAsic.imageSrc ? (
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[0.85rem] border border-border bg-white p-3 sm:aspect-[4/3] sm:rounded-[0.95rem] sm:p-4">
                      <Image
                        src={selectedAsic.imageSrc}
                        alt={
                          selectedAsic.imageAlt ??
                          `${selectedAsic.manufacturer} ${selectedAsic.model}`
                        }
                        fill
                        className="object-contain p-2 sm:p-3"
                        sizes="(min-width: 1400px) 22rem, (min-width: 1024px) 42vw, 100vw"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[0.85rem] border border-dashed border-border/80 bg-[radial-gradient(circle_at_top_left,rgba(247,147,26,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.03))] p-3 sm:aspect-[4/3] sm:rounded-[0.95rem] sm:p-4">
                      <div
                        aria-hidden="true"
                        className="absolute left-1/2 top-[20%] h-[34%] w-[58%] -translate-x-1/2 rounded-[0.95rem] border border-border/70 bg-background/85 shadow-[var(--shadow)]"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute left-[27%] top-[56%] h-[9%] w-[46%] rounded-full border border-border/65 bg-surface-elevated/90"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute left-[32%] top-[30%] h-[14%] w-[34%] rounded-md border border-border/55 bg-surface"
                      />
                      <div className="relative z-10 flex h-full flex-col justify-end">
                        <div className="grid gap-1">
                          <p className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                            {selectedAsic.model}
                          </p>
                          <p className="text-[0.88rem] leading-5 text-foreground-muted sm:text-sm sm:leading-6">
                            Imagen próximamente
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-1">
                  <p className="text-[0.82rem] font-medium leading-5 text-foreground-muted sm:text-sm">
                    {selectedAsic.manufacturer}
                  </p>
                  <h3 className="text-[1.36rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-[1.58rem]">
                    {selectedAsic.model}
                  </h3>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] border border-accent/22 bg-accent/[0.08] px-4 py-3.5">
                  <div className="text-[0.78rem] uppercase tracking-[0.16em] text-foreground-muted">
                    Costo inicial estimado
                  </div>
                  <div className="mt-1.5 text-[1.72rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[2.02rem]">
                    {formatUsd(scenario.costInitialTotal)}
                  </div>
                </div>
                <div className="rounded-[1rem] border border-border bg-background/72 px-4 py-3.5">
                  <div className="text-[0.78rem] uppercase tracking-[0.16em] text-foreground-muted">
                    Pago mensual estimado
                  </div>
                  <div className="mt-1.5 text-[1.72rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[2.02rem]">
                    {formatUsd(scenario.monthlyPaymentTotal)}
                  </div>
                </div>
              </div>

              <div className="grid gap-2.5 rounded-[1rem] border border-border bg-background/72 px-4 py-3.5">
                {[
                  {
                    label: "Equipo seleccionado",
                    value: `${selectedAsic.manufacturer} ${selectedAsic.model}`,
                  },
                  { label: "Cantidad", value: String(quantity) },
                  { label: "Hashrate total", value: formatThs(scenario.hashrateTotal) },
                  { label: "Consumo total", value: formatPower(scenario.consumptionTotalW) },
                  {
                    label: "Eficiencia",
                    value:
                      selectedAsic.efficiencyJTh !== null
                        ? `${decimalFormatter.format(selectedAsic.efficiencyJTh)} J/TH`
                        : "Según ficha técnica",
                  },
                  {
                    label: "Refrigeración",
                    value: selectedAsic.coolingLabel ?? "Según configuración",
                  },
                  {
                    label: "Precio equipos",
                    value: formatUsd(scenario.priceEquipmentTotal),
                  },
                  {
                    label: "Garantía estimada",
                    value: formatUsd(scenario.guaranteeTotal),
                  },
                  {
                    label: "Costo inicial estimado",
                    value: formatUsd(scenario.costInitialTotal),
                  },
                  {
                    label: "Hosting mensual estimado",
                    value: formatUsd(scenario.hostingMonthlyTotal),
                  },
                  {
                    label: "Pago mensual estimado",
                    value: formatUsd(scenario.monthlyPaymentTotal),
                  },
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

              <div className="grid gap-2 rounded-[1rem] border border-border/80 bg-background/78 px-4 py-3.5">
                <p className="text-[0.88rem] leading-6 text-foreground-muted sm:text-sm sm:leading-6">
                  La garantía corresponde a dos meses estimados de hosting y es reembolsable al término del contrato según condiciones contractuales.
                </p>
                <p className="text-[0.88rem] leading-6 text-foreground-muted sm:text-sm sm:leading-6">
                  El hosting se factura mes vencido según consumo efectivo del equipo.
                </p>
                <p className="text-[0.88rem] leading-6 text-foreground-muted sm:text-sm sm:leading-6">
                  La producción minera va directa a tu wallet. La simulación estima costos de equipo, garantía y hosting. La producción minera depende del equipo, el pool, el uptime efectivo y las condiciones de red.
                </p>
              </div>

              <div className="pt-1">
                <Button
                  href={ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className="min-h-11 w-full rounded-full px-4 text-sm lg:w-auto"
                >
                  Cotizar este ASIC
                </Button>
              </div>
            </Card>
          </div>
        </Card>
      </Container>
    </Section>
  );
}
