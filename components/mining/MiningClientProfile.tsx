import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const fitItems = [
  "quieres acumular Bitcoin a mediano o largo plazo",
  "te interesa participar en infraestructura real",
  "valoras una operación técnica delegada",
  "comprendes que la producción puede variar",
  "buscas comenzar gradualmente o adquirir equipos",
] as const;

const cautionItems = [
  "necesitas liquidez inmediata",
  "buscas retornos fijos",
  "esperas resultados garantizados",
  "tienes un horizonte exclusivamente especulativo",
  "buscas una operación sin variabilidad",
] as const;

export function MiningClientProfile() {
  return (
    <Section tone="muted" spacing="md" id="perfil" className="py-12 sm:py-16 lg:py-24">
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="PERFIL"
          title="Una alternativa para quienes buscan participar con horizonte"
          className="gap-3 [&_h2]:max-w-5xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.08rem]"
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="highlight" className="grid gap-3 rounded-[1.08rem] p-4 shadow-none sm:p-6 sm:shadow-[var(--shadow)]">
            <Badge variant="accent" className="w-fit px-2.25 py-1 text-[0.68rem] tracking-[0.14em] sm:px-2.5 sm:text-[0.72rem]">
              Puede calzar contigo si
            </Badge>
            <ul className="grid gap-2.5 sm:gap-3">
              {fitItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-[0.95rem] border border-border bg-background/72 px-3.5 py-3 sm:gap-3 sm:rounded-[1rem] sm:px-4 sm:py-3.5"
                >
                  <span aria-hidden="true" className="mt-[0.4rem] inline-flex size-2 shrink-0 rounded-full bg-accent sm:mt-1 sm:size-2.5" />
                  <span className="text-[0.95rem] leading-6 text-foreground sm:text-base sm:leading-7">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card variant="default" className="grid gap-3 rounded-[1.08rem] p-4 shadow-none sm:p-6 sm:shadow-[var(--shadow)]">
            <Badge variant="outline" className="w-fit px-2.25 py-1 text-[0.68rem] tracking-[0.14em] sm:px-2.5 sm:text-[0.72rem]">
              Requiere especial cautela si
            </Badge>
            <ul className="grid gap-2.5 sm:gap-3">
              {cautionItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-[0.95rem] border border-border bg-background/72 px-3.5 py-3 sm:gap-3 sm:rounded-[1rem] sm:px-4 sm:py-3.5"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.4rem] inline-flex size-2 shrink-0 rounded-full bg-[#ffb31e] sm:mt-1 sm:size-2.5"
                  />
                  <span className="text-[0.95rem] leading-6 text-foreground sm:text-base sm:leading-7">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
