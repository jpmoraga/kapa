import { Section } from "@/components/site/Section";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Card } from "@/components/ui/Card";

const kapa21RoleBlocks = [
  {
    title: "Entender",
    body: "Explicamos cómo funciona la minería, qué significa contratar hashrate y cómo se produce Bitcoin.",
  },
  {
    title: "Comparar",
    body: "Revisamos planes de minería fraccionada y alternativas de ASIC propio con hosting internacional.",
  },
  {
    title: "Evaluar",
    body: "Consideramos presupuesto, horizonte, grado de control, condiciones operativas y perfil de participación.",
  },
  {
    title: "Acompañar",
    body: "Coordinamos la cotización, resolvemos dudas y acompañamos el siguiente paso operativo según la modalidad elegida.",
  },
] as const;

export function Kapa21Role() {
  return (
    <Section tone="default" spacing="md" id="rol-kapa21" className="py-12 sm:py-16 lg:py-24">
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="ACOMPAÑAMIENTO KAPA21"
          title="Te ayudamos antes de elegir un camino"
          description="La minería combina tecnología, costos operativos y variables de red. Nuestro rol es ordenar esa información para que puedas evaluar con mayor claridad, sin promesas de rentabilidad."
          className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.08rem] [&_p]:max-w-3xl [&_p]:text-[0.98rem] [&_p]:leading-6 sm:[&_p]:text-base sm:[&_p]:leading-7"
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
          {kapa21RoleBlocks.map((item, index) => (
            <Card
              key={item.title}
              variant={index === 1 ? "highlight" : "elevated"}
              className="grid gap-2.5 rounded-[1rem] p-4 shadow-none sm:p-5 sm:shadow-[var(--shadow)]"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[10px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-[11px]">
                0{index + 1}
              </span>
              <div className="grid gap-1.5">
                <h3 className="text-[1.14rem] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.28rem]">
                  {item.title}
                </h3>
                <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
                  {item.body}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
