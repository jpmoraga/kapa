import { Section } from "@/components/site/Section";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const comparisonRows = [
  {
    label: "Qué contratas",
    fractional: "Capacidad en TH/s",
    tokenized: "Capacidad representada digitalmente",
    hosting: "Equipo físico",
  },
  {
    label: "Plazo",
    fractional: "Definido",
    tokenized: "Asociado a la modalidad",
    hosting: "Vida operativa del equipo",
  },
  {
    label: "Propiedad del hardware",
    fractional: "Operador",
    tokenized: "Operador",
    hosting: "Cliente",
  },
  {
    label: "Nivel de entrada",
    fractional: "Menor",
    tokenized: "Intermedio",
    hosting: "Mayor",
  },
  {
    label: "Entrada desde",
    fractional: "USD 15",
    tokenized: "USD 60",
    hosting: "Según equipo",
  },
  {
    label: "Nivel de control",
    fractional: "Inicial",
    tokenized: "Intermedio",
    hosting: "Alto",
  },
  {
    label: "Operación técnica",
    fractional: "Andes SolarHash",
    tokenized: "Andes SolarHash",
    hosting: "Andes SolarHash",
  },
  {
    label: "Acompañamiento comercial",
    fractional: "Kapa21",
    tokenized: "Kapa21",
    hosting: "Kapa21",
  },
] as const;

type MiningComparisonProps = {
  ctaHref: string;
};

export function MiningComparison({ ctaHref }: MiningComparisonProps) {
  return (
    <Section tone="default" spacing="md" id="comparador" className="py-12 sm:py-16 lg:py-24">
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="ELIGE TU NIVEL DE PARTICIPACIÓN"
          title="Tres modelos, distintos niveles de entrada y control"
          className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.08rem]"
        />

        <div className="grid gap-3 lg:hidden">
          {[
            {
              title: "Fraccionada",
              entries: comparisonRows.map((row) => ({ label: row.label, value: row.fractional })),
            },
            {
              title: "Tokenizada",
              entries: comparisonRows.map((row) => ({ label: row.label, value: row.tokenized })),
            },
            {
              title: "ASIC + hosting",
              entries: comparisonRows.map((row) => ({ label: row.label, value: row.hosting })),
            },
          ].map((card) => (
            <Card
              key={card.title}
              variant="elevated"
              className="grid gap-3 rounded-[1.05rem] p-4 shadow-none sm:p-5 sm:shadow-[var(--shadow)]"
            >
              <Badge
                variant="outline"
                className="justify-start border-accent/30 px-2 py-1 text-[0.66rem] tracking-[0.14em] text-accent sm:px-2.25 sm:text-[0.7rem]"
              >
                {card.title}
              </Badge>
              <dl className="grid gap-2.5">
                {card.entries.map((entry) => (
                  <div
                    key={entry.label}
                    className="grid gap-1.5 border-b border-border/70 pb-2.5 last:border-b-0 last:pb-0 min-[390px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] min-[390px]:items-start min-[390px]:gap-3"
                  >
                    <dt className="text-[0.88rem] font-medium leading-5 text-foreground sm:text-sm">
                      {entry.label}
                    </dt>
                    <dd className="text-[0.95rem] leading-6 text-foreground-muted min-[390px]:text-right sm:text-base sm:leading-7">
                      {entry.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>

        <Card variant="elevated" className="hidden overflow-hidden rounded-[1.25rem] p-0 lg:block">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-sm font-semibold text-foreground">Variable</th>
                <th className="px-6 py-4 text-sm font-semibold text-foreground">Fraccionada</th>
                <th className="px-6 py-4 text-sm font-semibold text-foreground">Tokenizada</th>
                <th className="px-6 py-4 text-sm font-semibold text-foreground">ASIC + hosting</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-b-0">
                  <th className="px-6 py-4 text-sm font-semibold text-foreground">{row.label}</th>
                  <td className="px-6 py-4 text-sm leading-7 text-foreground-muted">{row.fractional}</td>
                  <td className="px-6 py-4 text-sm leading-7 text-foreground-muted">{row.tokenized}</td>
                  <td className="px-6 py-4 text-sm leading-7 text-foreground-muted">{row.hosting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="pt-1">
          <Button
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="min-h-11 rounded-full px-4 text-sm"
          >
            Ayúdame a elegir
          </Button>
        </div>
      </Container>
    </Section>
  );
}
