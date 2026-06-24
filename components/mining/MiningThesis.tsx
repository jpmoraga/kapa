import { Section } from "@/components/site/Section";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const thesisConcepts = [
  {
    title: "Hashrate",
    body: "Capacidad computacional destinada a la minería, medida en TH/s.",
  },
  {
    title: "ASIC",
    body: "Equipo especializado para realizar cálculos de minería Bitcoin.",
  },
  {
    title: "Pool",
    body: "Infraestructura que agrupa capacidad minera y distribuye producción entre sus participantes.",
  },
] as const;

export function MiningThesis() {
  return (
    <Section tone="inverse" spacing="md" id="tesis" className="py-12 sm:py-16 lg:py-24">
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="MINERÍA BITCOIN"
          title="Bitcoin también puede acumularse desde su infraestructura"
          description="Comprar Bitcoin permite incorporarlo directamente a una estrategia de ahorro o tesorería."
          className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.1rem] [&_p]:max-w-3xl [&_p]:text-[0.98rem] [&_p]:leading-6 sm:[&_p]:text-base sm:[&_p]:leading-7"
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:items-start">
          <div className="grid gap-3 text-[0.98rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
            <p>
              La minería ofrece otra vía: participar en la capacidad computacional que protege
              la red y produce nuevos bitcoin.
            </p>
            <p>
              Kapa21 te ayuda a comprender cómo funciona, qué variables importan y qué
              modalidad puede calzar mejor con tus objetivos.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
            {thesisConcepts.map((item) => (
              <Card
                key={item.title}
                variant="elevated"
                className="grid gap-2.5 rounded-[1rem] p-4 shadow-none sm:p-5 sm:shadow-[var(--shadow)]"
              >
                <Badge
                  variant="outline"
                  className="justify-start border-accent/30 px-2 py-1 text-[0.66rem] tracking-[0.14em] text-accent sm:px-2.25 sm:text-[0.7rem]"
                >
                  {item.title}
                </Badge>
                <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
                  {item.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
