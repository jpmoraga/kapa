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
          title="Tres alternativas, desde tickets bajos hasta ASIC propio"
          className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.04rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.1rem]"
        />

        <div className="grid gap-3.5 xl:grid-cols-3 xl:gap-5">
          <MiningModalityCard
            title="Minería fraccionada"
            subtitle="Arriendo de poder computacional por 15 meses"
            body="Para entrar con tickets bajos, sin comprar un equipo completo."
            commercialBadge="Oferta de lanzamiento"
            commercialValue="Desde USD 15"
            commercialCaption="1 TH/s de capacidad minera"
            commercialHighlight="15 meses de contrato por el precio de 12"
            keyPoints={[
              "Desde tickets bajos",
              "Plazo fijo de 15 meses",
              "Equipo operado por Andes SolarHash",
              "Distribución según condiciones contractuales",
            ]}
            ctaLabel="Ver minería fraccionada"
            ctaHref={fractionalHref}
          />

          <MiningModalityCard
            title="Fracción de ASIC"
            subtitle="Arriendo de poder computacional por la vida útil del equipo"
            body="Accedes a una fracción estandarizada del hashrate de un ASIC, con distribuciones mensuales en Bitcoin."
            commercialValue="Desde USD 60"
            commercialCaption="2,34 TH/s de hashrate estandarizado"
            commercialHighlight="Acceso durante la vida útil del equipo"
            keyPoints={[
              "Fracción estandarizada de hashrate",
              "Distribuciones mensuales en Bitcoin",
              "Condiciones definidas por contrato",
              "Operación técnica delegada",
            ]}
            ctaLabel="Consultar fracción de ASIC"
            ctaHref={tokenizedHref}
            highlight
          />

          <MiningModalityCard
            title="ASIC propio"
            subtitle="Compra de equipo completo + hosting internacional"
            body="El equipo es tuyo y la producción minera va directo desde el pool a tu wallet."
            commercialCaption="Según equipo, stock y configuración"
            keyPoints={[
              "Propiedad del hardware",
              "Hosting internacional",
              "Producción del pool directo a tu wallet",
              "Operación técnica delegada",
            ]}
            ctaLabel="Cotizar ASIC propio"
            ctaHref={hostingHref}
          />
        </div>
      </Container>
    </Section>
  );
}
