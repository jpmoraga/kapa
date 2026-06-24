import { Section } from "@/components/site/Section";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Card } from "@/components/ui/Card";

const processSteps = [
  {
    title: "Hablamos contigo",
    body: "Entendemos tu presupuesto, horizonte y nivel de participación.",
  },
  {
    title: "Comparamos alternativas",
    body: "Revisamos modalidad, equipo, costos y condiciones.",
  },
  {
    title: "Recibes una propuesta",
    body: "Kapa21 coordina una cotización vigente y la documentación correspondiente.",
  },
  {
    title: "Formalizas con Andes SolarHash",
    body: "El operador celebra el contrato, recibe el pago y confirma las condiciones de ejecución.",
  },
  {
    title: "Comienza la operación",
    body: "Andes SolarHash administra equipos, hosting, conectividad y producción.",
  },
  {
    title: "Recibes producción y reportes",
    body: "La entrega de Bitcoin y la reportería se realizan según la modalidad contratada.",
  },
] as const;

export function MiningProcess() {
  return (
    <Section tone="inverse" spacing="md" id="proceso" className="py-12 sm:py-16 lg:py-24">
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="PROCESO"
          title="De la conversación inicial a la operación minera"
          className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.08rem]"
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {processSteps.map((step, index) => (
            <Card
              key={step.title}
              variant={index === 2 ? "highlight" : "elevated"}
              className="grid gap-2.5 rounded-[1rem] p-4 shadow-none sm:p-5 sm:shadow-[var(--shadow)]"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[10px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-[11px]">
                0{index + 1}
              </span>
              <div className="grid gap-1.5">
                <h3 className="text-[1.14rem] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.24rem]">
                  {step.title}
                </h3>
                <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">{step.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}
