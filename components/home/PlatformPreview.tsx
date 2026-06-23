import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const modules = [
  "Compra y venta",
  "Seguimiento de la posición",
  "Registro y valorización",
] as const;

const moduleCards = [
  {
    description: "Operaciones y registro de compra o venta de Bitcoin.",
    title: "Compra y venta",
  },
  {
    description: "Evolución, posición y movimientos en un solo lugar.",
    title: "Seguimiento de la posición",
  },
  {
    description: "Historial, valorización y contexto para cada decisión.",
    title: "Registro y valorización",
  },
] as const;

export function PlatformPreview() {
  return (
    <div data-theme="platform" data-tone="default" className="rounded-[1.75rem]">
      <Card
        variant="elevated"
        className="overflow-hidden rounded-[1.75rem] p-0 shadow-[var(--shadow)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-accent" />
            <span className="text-sm font-medium text-foreground">Plataforma Kapa21</span>
          </div>
          <Badge variant="accent">Disponible próximamente</Badge>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:hidden">
          {moduleCards.map((item, index) => (
            <div
              key={item.title}
              className="grid gap-2.5 rounded-[1.08rem] border border-border bg-background/72 p-4"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground">
                0{index + 1}
              </span>
              <div className="grid gap-2">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-sm leading-6 text-foreground-muted">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden gap-5 p-6 lg:grid lg:grid-cols-[210px_minmax(0,1fr)]">
          <div className="grid gap-3 rounded-[1.15rem] border border-border bg-background/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
              Módulos
            </p>
            <div className="grid gap-2.5">
              {modules.map((module, index) => (
                <div
                  key={module}
                  className="flex items-center justify-between rounded-[0.95rem] border border-border bg-surface px-3 py-2.5 text-sm text-foreground-muted"
                >
                  <span>{module}</span>
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-accent">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 xl:grid-cols-3">
              {moduleCards.map((item, index) => (
                <div
                  key={item.title}
                  className="grid gap-2.5 rounded-[1.08rem] border border-border bg-background/72 p-4"
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground">
                    0{index + 1}
                  </span>
                  <div className="grid gap-2">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-sm leading-6 text-foreground-muted">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[1.18rem] border border-border bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                  Vista referencial
                </p>
                <Badge variant="outline" className="border-accent/30 text-accent">
                  Plataforma próximamente
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(200px,0.92fr)]">
                <div className="rounded-[1rem] border border-border bg-background/80 p-4">
                  <div className="grid gap-2.5">
                    <div className="h-2.5 w-28 rounded-full bg-surface-elevated" />
                    <div className="h-24 rounded-[0.95rem] border border-border bg-[linear-gradient(180deg,rgba(247,147,26,0.12),rgba(247,147,26,0.03)_40%,rgba(255,255,255,0.02))]" />
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-[1rem] border border-border bg-background/80 p-4">
                    <div className="h-3 w-20 rounded-full bg-surface-elevated" />
                    <div className="mt-3 grid gap-2">
                      <div className="h-3 rounded-full bg-surface" />
                      <div className="h-3 w-4/5 rounded-full bg-surface" />
                      <div className="h-3 w-2/3 rounded-full bg-surface" />
                    </div>
                  </div>
                  <div className="rounded-[1rem] border border-border bg-background/80 p-4">
                    <div className="h-3 w-24 rounded-full bg-surface-elevated" />
                    <div className="mt-3 h-10 rounded-[0.9rem] border border-border bg-surface" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
