import { Section } from "@/components/site/Section";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { MiningModalityCard } from "./MiningModalityCard";

type MiningModalitiesProps = {
  fractionalHref: string;
  hostingHref: string;
};

const fractionalPlans = [
  {
    title: "Plan 15 meses",
    price: "USD 15 por TH/s",
    subtitle: "Contrato base 12 meses · hoy con 15 meses de acceso",
    keyPoints: [
      "Ticket flexible según cantidad de TH/s",
      "Hosting mensual asociado al hashrate contratado",
      "Distribuciones mensuales en Bitcoin",
      "Operación técnica internacional",
    ],
  },
  {
    title: "Plan 27 meses",
    price: "USD 25 por TH/s",
    subtitle: "Contrato base 24 meses · hoy con 27 meses de acceso",
    keyPoints: [
      "Mayor plazo de exposición minera",
      "Segundo año sin nueva activación",
      "Hosting mensual asociado al hashrate contratado",
      "Distribuciones mensuales en Bitcoin",
    ],
  },
] as const;

export function MiningModalities({ fractionalHref, hostingHref }: MiningModalitiesProps) {
  return (
    <Section
      tone="inverse"
      spacing="md"
      id="modalidades"
      className="scroll-mt-16 py-12 sm:scroll-mt-20 sm:py-16 lg:py-24"
    >
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="DOS CAMINOS"
          title="Dos caminos para acceder a minería Bitcoin"
          description="Elige entre planes fraccionados por TH/s o compra de ASIC propio con hosting internacional."
          className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.04rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.1rem]"
        />

        <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] xl:gap-5">
          <Card
            variant="highlight"
            className="grid gap-4 rounded-[1.08rem] p-4 shadow-none sm:gap-5 sm:p-6 sm:shadow-[var(--shadow)]"
          >
            <div className="grid gap-2.5">
              <Badge variant="accent" className="justify-start">
                Minería fraccionada
              </Badge>
              <div className="grid gap-2">
                <p className="text-[1.08rem] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[1.18rem]">
                  Dos planes para entrar desde tickets bajos
                </p>
                <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
                  Elige entre un plan de 15 o 27 meses, con ticket flexible por TH/s y
                  hosting mensual asociado.
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {fractionalPlans.map((plan) => (
                <div
                  key={plan.title}
                  className="grid gap-3 rounded-[1rem] border border-accent/20 bg-background/70 p-3.5 sm:p-4"
                >
                  <div className="grid gap-1.5">
                    <Badge
                      variant="outline"
                      className="w-fit justify-start border-accent/30 text-accent"
                    >
                      {plan.title}
                    </Badge>
                    <p className="text-[1.24rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[1.45rem]">
                      {plan.price}
                    </p>
                    <p className="text-[0.92rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-6">
                      {plan.subtitle}
                    </p>
                  </div>

                  <ul className="grid gap-2 text-[0.98rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
                    {plan.keyPoints.map((item) => (
                      <li key={item} className="grid grid-cols-[auto_1fr] gap-2.5">
                        <span
                          aria-hidden="true"
                          className="mt-[0.55rem] size-1.5 rounded-full bg-accent"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="grid gap-2 rounded-[1rem] border border-accent/18 bg-background/70 px-3.5 py-3 sm:px-4 sm:py-3.5">
              <p className="text-[0.95rem] leading-6 text-foreground sm:text-base sm:leading-7">
                El monto final depende del hashrate contratado y del hosting asociado.
              </p>
              <p className="text-[0.92rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-6">
                Hosting pagadero en USDT, USDC, Bitcoin o transferencia bancaria (Chile).
              </p>
            </div>

            <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                href={fractionalHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="min-h-11 w-full rounded-full px-4 text-sm lg:w-auto"
              >
                Consultar planes fraccionados
              </Button>
              <Button
                href="#simulador-fraccionado"
                variant="secondary"
                className="min-h-11 w-full rounded-full border-white/14 bg-white/[0.05] px-4 text-sm font-semibold text-foreground shadow-none hover:border-white/24 hover:bg-white/[0.08] lg:w-auto"
              >
                Simular plan
              </Button>
            </div>
          </Card>

          <MiningModalityCard
            title="ASIC propio"
            subtitle="Compra de equipo completo + hosting internacional"
            body="El equipo es tuyo y la producción minera va directa a tu wallet."
            commercialCaption="Según equipo disponible, stock y configuración"
            keyPoints={[
              "Propiedad del hardware",
              "Hosting internacional en Emiratos Árabes Unidos",
              "Producción minera directa a tu wallet",
              "Operación técnica delegada",
            ]}
            ctaLabel="Cotizar ASIC propio"
            ctaHref={hostingHref}
            secondaryCtaLabel="Simular ASIC"
            secondaryCtaHref="#simulador-asic"
          />
        </div>
      </Container>
    </Section>
  );
}
