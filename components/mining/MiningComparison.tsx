import { Section } from "@/components/site/Section";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const comparisonColumns = [
  { key: "plan1", title: "Plan 1 año" },
  { key: "plan2", title: "Plan 2 años" },
  { key: "plan3", title: "Plan 3 años" },
  { key: "asic", title: "ASIC propio" },
] as const;

const comparisonRows = [
  {
    label: "Qué contratas",
    plan1: "Poder computacional por TH/s",
    plan2: "Poder computacional por TH/s",
    plan3: "Poder computacional por TH/s",
    asic: "Equipo completo + hosting",
  },
  {
    label: "Plazo contratado",
    plan1: "12 meses",
    plan2: "24 meses",
    plan3: "36 meses",
    asic: "Vida útil del equipo / equipo propio",
  },
  {
    label: "Pago inicial",
    plan1: "USD 20 por TH/s",
    plan2: "USD 39 por TH/s",
    plan3: "USD 58 por TH/s",
    asic: "Según equipo",
  },
  {
    label: "Hosting durante el plazo",
    plan1: "Incluido",
    plan2: "Incluido",
    plan3: "Incluido",
    asic: "Hosting internacional",
  },
  {
    label: "Pagos adicionales",
    plan1: "No aplica",
    plan2: "No aplica",
    plan3: "No aplica",
    asic: "Según contrato",
  },
  {
    label: "Propiedad del hardware",
    plan1: "Operador",
    plan2: "Operador",
    plan3: "Operador",
    asic: "Cliente",
  },
  {
    label: "Nivel de participación",
    plan1: "Entrada flexible",
    plan2: "Mayor horizonte",
    plan3: "Mayor plazo contratado",
    asic: "Mayor ticket",
  },
  {
    label: "Producción / distribución",
    plan1: "Distribuciones periódicas en Bitcoin",
    plan2: "Distribuciones periódicas en Bitcoin",
    plan3: "Distribuciones periódicas en Bitcoin",
    asic: "Producción minera directa a tu wallet",
  },
  {
    label: "Operación técnica",
    plan1: "Operador especializado",
    plan2: "Operador especializado",
    plan3: "Operador especializado",
    asic: "Operador especializado",
  },
  {
    label: "Acompañamiento comercial",
    plan1: "Kapa21",
    plan2: "Kapa21",
    plan3: "Kapa21",
    asic: "Kapa21",
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
          title="Compara minería fraccionada y ASIC propio"
          className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.08rem]"
        />

        <div className="grid gap-3 lg:hidden">
          {comparisonColumns.map((column) => (
            <Card
              key={column.key}
              variant="elevated"
              className="grid gap-3 rounded-[1.05rem] p-4 shadow-none sm:p-5 sm:shadow-[var(--shadow)]"
            >
              <Badge
                variant="outline"
                className="justify-start border-accent/30 px-2 py-1 text-[0.66rem] tracking-[0.14em] text-accent sm:px-2.25 sm:text-[0.7rem]"
              >
                {column.title}
              </Badge>
              <dl className="grid gap-2.5">
                {comparisonRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid gap-1.5 border-b border-border/70 pb-2.5 last:border-b-0 last:pb-0 min-[390px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] min-[390px]:items-start min-[390px]:gap-3"
                  >
                    <dt className="text-[0.88rem] font-medium leading-5 text-foreground sm:text-sm">
                      {row.label}
                    </dt>
                    <dd className="text-[0.95rem] leading-6 text-foreground-muted min-[390px]:text-right sm:text-base sm:leading-7">
                      {row[column.key]}
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
                <th className="px-4 py-3 text-[0.82rem] font-semibold text-foreground xl:px-5 xl:py-4 xl:text-sm">
                  Variable
                </th>
                {comparisonColumns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-[0.82rem] font-semibold text-foreground xl:px-5 xl:py-4 xl:text-sm"
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-b-0">
                  <th className="px-4 py-3 text-[0.82rem] font-semibold text-foreground xl:px-5 xl:py-4 xl:text-sm">
                    {row.label}
                  </th>
                  {comparisonColumns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-[0.82rem] leading-6 text-foreground-muted xl:px-5 xl:py-4 xl:text-sm xl:leading-7"
                    >
                      {row[column.key]}
                    </td>
                  ))}
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
