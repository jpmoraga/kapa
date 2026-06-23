import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type CycleStep = {
  desktopDescription: string;
  mobileDescription: string;
  order: string;
  positionClassName: string;
  title: string;
};

const steps: CycleStep[] = [
  {
    order: "01",
    title: "Diseñar",
    mobileDescription: "Política, límites, tamaño de reserva, acumulación y reglas de uso.",
    desktopDescription: "Política, límites, tamaño de reserva y reglas de uso.",
    positionClassName: "col-start-3 row-start-1",
  },
  {
    order: "02",
    title: "Ejecutar",
    mobileDescription: "Compra y acumulación de acuerdo con la política y la disponibilidad financiera.",
    desktopDescription: "Compra y acumulación según política y disponibilidad.",
    positionClassName: "col-start-4 row-start-2",
  },
  {
    order: "03",
    title: "Custodiar",
    mobileDescription: "Custodia, control de llaves, autorizaciones y continuidad operacional.",
    desktopDescription: "Custodia, llaves, autorizaciones y continuidad operacional.",
    positionClassName: "col-start-4 row-start-4",
  },
  {
    order: "04",
    title: "Colateralizar",
    mobileDescription: "LTV, margen, renovación, amortización y prepago.",
    desktopDescription: "LTV, margen, renovación, amortización y prepago.",
    positionClassName: "col-start-3 row-start-5",
  },
  {
    order: "05",
    title: "Reportar",
    mobileDescription: "Reserva, valorización, exposición, colateral y liquidez.",
    desktopDescription: "Reserva, valorización, exposición, colateral y liquidez.",
    positionClassName: "col-start-2 row-start-4",
  },
  {
    order: "06",
    title: "Recomendar",
    mobileDescription: "Acumulación, uso de liquidez y ajustes según caja, fondeo y operación.",
    desktopDescription: "Acumulación, uso de liquidez y ajustes según caja y fondeo.",
    positionClassName: "col-start-2 row-start-2",
  },
];

export function Kapa21Cycle() {
  return (
    <div className="grid gap-7">
      <div className="grid gap-3 lg:hidden">
        {steps.map((step) => (
          <Card
            key={step.order}
            variant="elevated"
            className="grid grid-cols-[auto_1fr] gap-3 rounded-[1.08rem] p-4 sm:p-5"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-xs">
              {step.order}
            </span>
            <div className="grid gap-1.5">
              <h3 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.12rem]">
                {step.title}
              </h3>
              <p className="text-[0.94rem] leading-[1.5] text-foreground-muted sm:text-[0.98rem] sm:leading-6">
                {step.mobileDescription}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="relative hidden lg:block">
        <div className="relative mx-auto grid min-h-[43rem] max-w-[62rem] grid-cols-[1fr_12rem_15rem_12rem_1fr] grid-rows-[4.75rem_11rem_12rem_11rem_4.75rem] items-center justify-items-center">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1000 720"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="M290 210 L500 82 L710 210 L710 510 L500 638 L290 510 Z"
              fill="none"
              stroke="rgba(242, 238, 232, 0.08)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="12"
            />
            <path
              d="M290 210 L500 82 L710 210 L710 510 L500 638 L290 510 Z"
              fill="none"
              stroke="rgba(247, 147, 26, 0.24)"
              strokeDasharray="6 10"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
            {[
              [290, 210],
              [500, 82],
              [710, 210],
              [710, 510],
              [500, 638],
              [290, 510],
            ].map(([cx, cy], index) => (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r="7"
                fill="rgba(247, 147, 26, 0.92)"
                stroke="rgba(247, 147, 26, 0.26)"
                strokeWidth="8"
              />
            ))}
          </svg>

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[17rem] w-[17rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/35" />

          {steps.map((step) => (
            <article
              key={step.order}
              className={cn(
                "z-[1] w-full rounded-[1.22rem] border border-border bg-surface px-4 py-4 shadow-[var(--shadow)]",
                step.positionClassName,
              )}
            >
              <div className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground">
                {step.order}
              </div>
              <div className="grid gap-2">
                <h3 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
                  {step.title}
                </h3>
                <p className="text-[0.84rem] leading-[1.45] text-foreground-muted">
                  {step.desktopDescription}
                </p>
              </div>
            </article>
          ))}

          <div className="z-[2] col-start-3 row-start-3 w-full rounded-[1.7rem] border border-accent/20 bg-surface-elevated p-8 text-center shadow-[var(--shadow)]">
            <Badge variant="outline" className="border-accent/25 text-accent">
              Núcleo operativo
            </Badge>
            <div className="mt-5 grid gap-3">
              <h3 className="text-[1.95rem] font-semibold tracking-[-0.04em] text-foreground">
                Tesorería BTC
              </h3>
              <p className="text-sm leading-6 text-foreground-muted">
                Reserva gobernada, utilizable como colateral y conectada a decisiones reales de liquidez.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
