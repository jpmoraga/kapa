import BtcClpChart from "@/components/landing/BtcClpChart";
import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

import { HomeMarketTicker } from "./HomeMarketTicker";

export function HomeMarketSection() {
  return (
    <Section tone="default" spacing="md" id="mercado" className="py-14 sm:py-16 lg:py-24">
      <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="Información de mercado"
          title="Precios y evolución de Bitcoin"
          description="Consulta referencias para BTC/CLP y USDT/CLP, junto con la evolución reciente del precio de Bitcoin. Esta información sirve como contexto. Las decisiones de ahorro y tesorería requieren objetivos, horizonte y criterios propios."
          className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.08rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.42rem] lg:[&_h2]:text-[3rem] [&_p]:max-w-3xl [&_p]:text-[0.98rem] [&_p]:leading-7 sm:[&_p]:text-[1.06rem] sm:[&_p]:leading-8"
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start">
          <div className="grid gap-4">
            <HomeMarketTicker />

            <Card variant="elevated" className="grid gap-3 rounded-[1.18rem] p-5 sm:p-6">
              <Badge
                variant="outline"
                className="justify-start border-accent/30 px-2.25 py-1 text-[0.7rem] tracking-[0.14em] text-accent"
              >
                Contexto de mercado
              </Badge>
              <p className="text-[0.98rem] leading-7 text-foreground-muted sm:text-[1.04rem] sm:leading-8">
                Kapa21 usa la información de mercado como referencia. La decisión no parte del precio del día, sino del objetivo, la disciplina y el margen de maniobra de cada persona o empresa.
              </p>
            </Card>
          </div>

          <Card variant="elevated" className="rounded-[1.35rem] p-4 sm:p-5 lg:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-1">
                <p className="text-sm font-medium text-foreground">BTC / CLP</p>
                <p className="text-xs text-foreground-muted">Evolución reciente del precio</p>
              </div>
              <Badge variant="default">Fuente: Buda</Badge>
            </div>
            <BtcClpChart />
          </Card>
        </div>
      </Container>
    </Section>
  );
}
