import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Card } from "@/components/ui/Card";

const variableItems = [
  {
    title: "Dificultad",
    description:
      "La competencia global por producir nuevos bloques cambia con el tiempo.",
  },
  {
    title: "Hashrate",
    description:
      "La capacidad contratada determina la participación relativa en la operación.",
  },
  {
    title: "Eficiencia",
    description:
      "Equipos más eficientes consumen menos energía por unidad de hashrate.",
  },
  {
    title: "Uptime",
    description:
      "La producción depende del tiempo efectivo durante el cual los equipos permanecen operativos.",
  },
  {
    title: "Costo energético",
    description:
      "La energía y el hosting representan una parte central de los costos.",
  },
  {
    title: "Precio de Bitcoin",
    description:
      "El valor en dólares o pesos de la producción cambia con el mercado.",
  },
  {
    title: "Vida útil",
    description:
      "Cada equipo pierde competitividad a medida que aparecen nuevas generaciones.",
  },
] as const;

export function MiningVariables() {
  return (
    <Section tone="inverse" spacing="md" id="variables" className="py-12 sm:py-16 lg:py-24">
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="CRITERIO ANTES DE CONTRATAR"
          title="La producción depende de condiciones operativas y de red"
          className="gap-3 [&_h2]:max-w-5xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.08rem]"
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {variableItems.map((item, index) => (
            <Card
              key={item.title}
              variant="elevated"
              className="grid gap-2 rounded-[1rem] p-4 shadow-none sm:p-5 sm:shadow-[var(--shadow)]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent sm:text-[11px]">
                0{index + 1}
              </span>
              <div className="grid gap-1.5">
                <h3 className="text-[1.14rem] font-semibold tracking-tight text-foreground sm:text-[1.25rem]">
                  {item.title}
                </h3>
                <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
                  {item.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <p className="max-w-4xl text-[0.98rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
          La minería produce Bitcoin bajo condiciones variables y no promete rentabilidad. Kapa21 te ayuda a comprenderlas antes de contratar.
        </p>
      </Container>
    </Section>
  );
}
