import { ASIC_CATEGORY_ORDER, asicModels } from "@/data/mining/asic-models";
import { buildAsicQuoteText } from "@/data/mining/cta";
import { buildWhatsAppUrl } from "@/lib/publicContact";
import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { cn } from "@/lib/cn";

import { AsicCard } from "./AsicCard";

const asicsByCategory = ASIC_CATEGORY_ORDER.map((category) => ({
  category,
  models: asicModels.filter((model) => model.category === category),
})).filter((group) => group.models.length > 0);

function getCategoryGridClassName(count: number) {
  if (count === 1) {
    return "grid-cols-1";
  }

  if (count === 2) {
    return "md:grid-cols-2 xl:grid-cols-2";
  }

  if (count === 4) {
    return "md:grid-cols-2 xl:grid-cols-2 min-[1400px]:grid-cols-4";
  }

  return "md:grid-cols-2 xl:grid-cols-3";
}

export function AsicCatalog() {
  return (
    <Section tone="inverse" spacing="md" id="catalogo" className="py-12 sm:py-16 lg:py-24">
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="EQUIPOS DISPONIBLES"
          title="ASICs para distintos niveles de operación"
          description="Seleccionamos alternativas para comenzar, escalar o acceder a infraestructura de mayor rendimiento. Precio, disponibilidad y condiciones se confirman mediante una cotización vigente."
          className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.08rem] [&_p]:text-[0.98rem] [&_p]:leading-6 sm:[&_p]:text-base sm:[&_p]:leading-7"
        />

        <div className="grid gap-8 lg:gap-10">
          {asicsByCategory.map((group) => (
            <div key={group.category} className="grid gap-4 sm:gap-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div className="grid gap-0.5">
                  <h3 className="text-[1.3rem] font-semibold tracking-tight text-foreground sm:text-[1.5rem]">
                    {group.category}
                  </h3>
                  <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
                    {group.models.length} {group.models.length === 1 ? "equipo" : "equipos"}
                  </p>
                </div>
              </div>

              <div className={cn("grid gap-3.5 md:gap-4", getCategoryGridClassName(group.models.length))}>
                {group.models.map((model) => (
                  <AsicCard
                    key={model.slug}
                    model={model}
                    ctaHref={buildWhatsAppUrl(buildAsicQuoteText(model.model))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
