import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type MiningFinalCtaProps = {
  contactEmail: string;
  primaryCtaHref: string;
  secondaryCtaHref: string;
  tertiaryCtaHref: string;
};

const leadInputs = ["Presupuesto", "Horizonte", "Nivel de participación"] as const;

export function MiningFinalCta({
  contactEmail,
  primaryCtaHref,
  secondaryCtaHref,
  tertiaryCtaHref,
}: MiningFinalCtaProps) {
  return (
    <Section
      tone="default"
      spacing="md"
      id="contacto"
      className="overflow-hidden py-12 sm:py-16 lg:py-24"
      style={{
        backgroundImage:
          "radial-gradient(720px circle at 14% 16%, rgba(247, 147, 26, 0.18), transparent 34%), radial-gradient(640px circle at 86% 10%, rgba(45, 53, 110, 0.3), transparent 30%), linear-gradient(180deg, #171a1f 0%, #161920 100%)",
      }}
    >
      <Container
        width="wide"
        className="grid gap-5 px-5 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-center lg:gap-10 lg:px-8"
      >
        <div className="grid gap-4 sm:gap-5">
          <SectionHeading
            eyebrow="CONVERSEMOS"
            title="Encuentra una forma de participar que calce contigo"
            description="Cuéntanos tu presupuesto, horizonte y nivel de participación."
            className="gap-3 [&_h2]:max-w-4xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.8rem] lg:[&_h2]:text-[3.55rem] [&_p]:text-[0.98rem] [&_p]:leading-6 sm:[&_p]:text-base sm:[&_p]:leading-7"
          />

          <p className="max-w-3xl text-[0.98rem] leading-6 text-foreground-muted sm:text-[1.05rem] sm:leading-8">
            Kapa21 te ayudará a comparar las alternativas disponibles y coordinar el siguiente paso con Andes SolarHash.
          </p>

          <div className="grid max-w-sm gap-2 sm:flex sm:max-w-none sm:flex-wrap sm:gap-3">
            <Button
              href={primaryCtaHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="min-h-11 rounded-full px-4 text-sm"
            >
              Hablar con Kapa21
            </Button>
            <Button
              href={secondaryCtaHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className="min-h-11 rounded-full px-4 text-sm"
            >
              Agendar una conversación
            </Button>
            <Button
              href={tertiaryCtaHref}
              variant="ghost"
              className="min-h-11 rounded-full px-4 text-sm"
            >
              Escribir por correo
            </Button>
          </div>

          <p className="text-[0.88rem] leading-5 text-foreground-muted sm:text-sm sm:leading-6">
            Todos los leads se coordinan inicialmente desde Kapa21. Correo: {contactEmail}
          </p>
        </div>

        <Card className="grid gap-3 rounded-[1.15rem] border-[#394165] bg-[#1d2230]/92 p-4 shadow-none sm:rounded-[1.35rem] sm:p-6 sm:shadow-[var(--shadow)] lg:p-7">
          <Badge
            variant="outline"
            className="w-fit border-[#ffb31e]/35 px-2.25 py-1 text-[0.68rem] tracking-[0.14em] text-[#ffb31e] sm:px-2.5 sm:text-[0.72rem]"
          >
            Punto de partida
          </Badge>
          <div className="grid gap-2.5 sm:gap-3">
            {leadInputs.map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between gap-4 rounded-[0.95rem] border border-white/8 bg-white/[0.03] px-3.5 py-3 sm:rounded-[1rem] sm:px-4 sm:py-3.5"
              >
                <span className="text-[0.95rem] font-medium text-foreground sm:text-base">{item}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-muted sm:text-[11px]">
                  0{index + 1}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Container>
    </Section>
  );
}
