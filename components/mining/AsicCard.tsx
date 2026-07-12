import Image from "next/image";

import type { AsicModel } from "@/data/mining/asic-models";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type AsicCardProps = {
  ctaHref: string;
  model: AsicModel;
};

function hasFieldValue<T>(field: { state: string; value: T | null }) {
  return field.state !== "unknown" && field.value !== null;
}

function getCoolingLabel(value: AsicModel["cooling"]["value"]) {
  if (value === "air") {
    return "Aire";
  }

  if (value === "hydro") {
    return "Hidro";
  }

  return null;
}

function hasAmountValue(field: { amount: number | null; state: string }) {
  return field.state !== "unknown" && field.amount !== null;
}

function formatUsd(amount: number) {
  return `USD ${amount.toLocaleString("es-CL")}`;
}

export function AsicCard({ ctaHref, model }: AsicCardProps) {
  const showCooling = hasFieldValue(model.cooling);
  const coolingLabel = showCooling ? getCoolingLabel(model.cooling.value) : null;
  const showImage = model.image.state !== "unknown" && model.image.src !== null;
  const showPrice = hasAmountValue(model.referencePrice);
  const showHosting = hasAmountValue(model.hosting);
  const showWarranty = hasAmountValue(model.warranty);
  const showEfficiency = hasFieldValue(model.efficiency);
  const showPower = hasFieldValue(model.power);
  const availabilityLabel =
    model.availability.state !== "unknown" ? model.availability.label : null;

  return (
    <Card variant="elevated" className="grid gap-4 rounded-[1.05rem] p-4 shadow-none sm:gap-5 sm:p-5 sm:shadow-[var(--shadow)]">
      <div className="grid gap-3.5">
        <div className="overflow-hidden rounded-[0.95rem] border border-border bg-background/72 p-2.5 sm:rounded-[1.05rem] sm:p-3.5">
          {showImage ? (
            <div className="relative aspect-[16/10] overflow-hidden rounded-[0.85rem] border border-border bg-white p-3 sm:aspect-[4/3] sm:rounded-[0.95rem] sm:p-4">
              <Image
                src={model.image.src as string}
                alt={model.image.alt ?? `${model.manufacturer} ${model.model}`}
                fill
                className="object-contain p-2 sm:p-3"
                sizes="(min-width: 1400px) 22rem, (min-width: 768px) 44vw, 100vw"
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
              <div className="relative z-10 flex h-full flex-col justify-between">
                <Badge
                  variant="outline"
                  className="w-fit border-border/80 bg-background/70 px-2 py-1 text-[0.62rem] tracking-[0.14em] sm:px-2.25 sm:text-[0.68rem]"
                >
                  Placeholder visual
                </Badge>
                <div className="grid gap-1">
                  <p className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                    {model.model}
                  </p>
                  <p className="text-[0.88rem] leading-5 text-foreground-muted sm:text-sm sm:leading-6">
                    Imagen próximamente
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="justify-start border-accent/30 px-2 py-1 text-[0.66rem] tracking-[0.14em] text-accent sm:px-2.25 sm:text-[0.7rem]"
            >
              {model.category}
            </Badge>
            {availabilityLabel ? (
              <Badge
                variant="outline"
                className="justify-start border-border/80 bg-background/70 px-2 py-1 text-[0.62rem] tracking-[0.14em] text-foreground-muted sm:px-2.25 sm:text-[0.68rem]"
              >
                {availabilityLabel}
              </Badge>
            ) : null}
          </div>

          <div className="grid gap-1">
            <p className="text-[0.82rem] font-medium leading-5 text-foreground-muted sm:text-sm">
              {model.manufacturer}
            </p>
            <h3 className="text-[1.2rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-[1.45rem]">
              {model.model}
            </h3>
          </div>

          <div className="grid gap-2.5 rounded-[0.95rem] border border-border bg-background/72 p-3.5 sm:rounded-[1rem] sm:p-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[0.88rem] font-medium text-foreground sm:text-sm">Hashrate</span>
                <span className="text-[0.95rem] font-semibold text-foreground sm:text-base">
                  {model.hashrate.value} TH/s
                </span>
              </div>
              {showPrice ? (
                <div className="grid gap-0.5 rounded-[0.9rem] border border-accent/20 bg-accent/[0.08] px-3 py-2.5 sm:px-3.5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                    Precio equipo
                  </p>
                  <p className="text-[1.18rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[1.34rem]">
                    {formatUsd(model.referencePrice.amount as number)}
                  </p>
                </div>
              ) : null}
            </div>

            <dl className="grid gap-2">
              {showHosting ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[0.86rem] font-medium text-foreground sm:text-sm">Hosting mensual</dt>
                  <dd className="text-[0.9rem] text-foreground-muted sm:text-sm">
                    {formatUsd(model.hosting.amount as number)}
                  </dd>
                </div>
              ) : null}
              {showEfficiency ? (
                <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-2">
                  <dt className="text-[0.86rem] font-medium text-foreground sm:text-sm">Eficiencia</dt>
                  <dd className="text-[0.9rem] text-foreground-muted sm:text-sm">
                    {String(model.efficiency.value).replace(".", ",")} J/TH
                  </dd>
                </div>
              ) : null}
              {showPower ? (
                <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-2">
                  <dt className="text-[0.86rem] font-medium text-foreground sm:text-sm">Consumo</dt>
                  <dd className="text-[0.9rem] text-foreground-muted sm:text-sm">
                    {(model.power.value as number).toLocaleString("es-CL")} W
                  </dd>
                </div>
              ) : null}
              {coolingLabel ? (
                <div className="flex items-center justify-between gap-4 border-t border-border/70 pt-2">
                  <dt className="text-[0.86rem] font-medium text-foreground sm:text-sm">Refrigeración</dt>
                  <dd className="text-[0.9rem] text-foreground-muted sm:text-sm">
                    {coolingLabel}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="grid gap-1 rounded-[0.9rem] border border-border/80 bg-background/78 px-3 py-2.5 sm:px-3.5">
              {showWarranty ? (
                <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-[0.86rem]">
                  <span className="font-medium text-foreground">Garantía</span>:{" "}
                  {formatUsd(model.warranty.amount as number)}
                </p>
              ) : null}
              <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-[0.86rem]">
                Precio y hosting referenciales según catálogo operativo Junio 2026.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        variant="primary"
        className="min-h-11 rounded-full px-4 text-sm"
      >
        Cotizar con Kapa21
      </Button>
    </Card>
  );
}
