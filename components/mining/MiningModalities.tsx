import { Section } from "@/components/site/Section";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

import { MiningModalityCard } from "./MiningModalityCard";

type MiningModalitiesProps = {
  fractionalHref: string;
  hostingHref: string;
  tokenizedHref: string;
};

export function MiningModalities({
  fractionalHref,
  hostingHref,
  tokenizedHref,
}: MiningModalitiesProps) {
  return (
    <Section
      tone="inverse"
      spacing="md"
      id="modalidades"
      className="scroll-mt-16 py-12 sm:scroll-mt-20 sm:py-16 lg:py-24"
    >
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="TRES ALTERNATIVAS"
          title="Distintas formas de acceder a minería Bitcoin"
          className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.04rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.1rem]"
        />

        <div className="grid gap-3.5 xl:grid-cols-3 xl:gap-5">
          <MiningModalityCard
            title="Minería fraccionada"
            subtitle="Capacidad minera sin comprar un equipo completo"
            body="Contratas una cantidad determinada de hashrate por un período definido y participas proporcionalmente en la producción asociada. Puede calzar con quienes buscan comenzar con una capacidad acotada y una estructura simple."
            keyPoints={[
              "Participación por TH/s",
              "Plazo definido",
              "Equipo operado por Andes SolarHash",
              "Distribución según condiciones contractuales",
            ]}
            ctaLabel="Consultar minería fraccionada"
            ctaHref={fractionalHref}
          />

          <MiningModalityCard
            title="Minería tokenizada"
            subtitle="Capacidad minera representada digitalmente"
            body="Accedes a una fracción de hashrate asociada a infraestructura minera mediante una representación digital verificable. Puede calzar con quienes buscan una participación identificable y transferible durante la vida útil de la capacidad asociada."
            keyPoints={[
              "Capacidad expresada en TH/s",
              "Representación digital",
              "Condiciones definidas por contrato",
              "Producción y reportes según modalidad",
            ]}
            ctaLabel="Consultar minería tokenizada"
            ctaHref={tokenizedHref}
            highlight
          />

          <MiningModalityCard
            title="ASIC propio con hosting"
            subtitle="Propiedad directa del equipo"
            body="Compras un equipo ASIC y lo mantienes operando en infraestructura especializada, con hosting, energía, conectividad y soporte técnico. Puede calzar con quienes buscan mayor control, escala y exposición directa a la operación."
            keyPoints={[
              "Propiedad del hardware",
              "Hosting especializado",
              "Producción desde el pool",
              "Operación técnica delegada",
            ]}
            ctaLabel="Cotizar un equipo ASIC"
            ctaHref={hostingHref}
          />
        </div>
      </Container>
    </Section>
  );
}
