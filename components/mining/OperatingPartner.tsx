import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const kapa21Responsibilities = [
  "Orientación inicial",
  "Explicación de alternativas",
  "Selección de modalidad o equipo",
  "Coordinación comercial",
  "Acompañamiento de la evaluación",
] as const;

const operatorResponsibilities = [
  "Formalización operativa según modalidad",
  "Recepción de pagos según contrato",
  "Hosting internacional en Emiratos Árabes Unidos",
  "Operación técnica de equipos",
  "Hosting y mantenimiento",
  "Monitoreo y reportes operativos",
] as const;

export function OperatingPartner() {
  return (
    <Section
      tone="default"
      spacing="md"
      id="partnership"
      className="overflow-hidden py-12 sm:py-16 lg:py-24"
      style={{
        backgroundImage:
          "radial-gradient(740px circle at 84% 16%, rgba(255, 179, 30, 0.16), transparent 30%), radial-gradient(880px circle at 10% 14%, rgba(45, 53, 110, 0.34), transparent 34%), linear-gradient(180deg, #171a1f 0%, #161920 100%)",
      }}
    >
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="INFRAESTRUCTURA OPERATIVA"
          title="Kapa21 acompaña la evaluación. La operación técnica se coordina con infraestructura internacional."
          description="La operación minera se realiza en Emiratos Árabes Unidos, con hosting internacional y costos energéticos competitivos."
          className="gap-3 [&_h2]:max-w-5xl [&_h2]:text-[2.04rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.12rem] [&_p]:max-w-4xl [&_p]:text-[0.98rem] [&_p]:leading-6 sm:[&_p]:text-base sm:[&_p]:leading-7"
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)] lg:items-stretch lg:gap-5">
          <Card
            variant="highlight"
            className="grid gap-4 rounded-[1.15rem] border-accent/35 bg-surface-elevated/92 p-4 shadow-none sm:rounded-[1.35rem] sm:p-6 sm:shadow-[var(--shadow)] lg:p-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              <Badge variant="accent" className="px-2.25 py-1 text-[0.68rem] tracking-[0.14em] sm:px-2.5 sm:text-[0.72rem]">
                Kapa21
              </Badge>
              <p className="text-[0.84rem] font-medium text-foreground-muted sm:text-sm">Marca principal y punto de entrada</p>
            </div>

            <div className="grid gap-2.5 sm:gap-3">
              <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
                Kapa21 ordena la información comercial y técnica para que puedas comparar alternativas,
                entender el nivel de participación y avanzar con una propuesta alineada a tus objetivos.
              </p>
              <ul className="grid gap-2.5 sm:gap-3">
                {kapa21Responsibilities.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded-[0.95rem] border border-border bg-background/72 px-3.5 py-3 sm:gap-3 sm:rounded-[1rem] sm:px-4 sm:py-3.5"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.4rem] inline-flex size-2 shrink-0 rounded-full bg-accent sm:mt-1 sm:size-2.5"
                    />
                    <span className="text-[0.95rem] leading-6 text-foreground sm:text-base sm:leading-7">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card
            variant="elevated"
            className="grid gap-4 rounded-[1.15rem] border-[#394165] bg-[#1d2230] p-4 shadow-none sm:rounded-[1.35rem] sm:p-6 sm:shadow-[var(--shadow)] lg:p-7"
          >
            <div className="grid gap-3 sm:gap-4">
              <div className="inline-flex w-fit rounded-[1rem] border border-white/8 bg-[#12172f] p-2.5 shadow-[var(--shadow)] sm:rounded-[1.15rem] sm:p-3">
                <div className="grid gap-2 rounded-[0.75rem] border border-[#ffb31e]/20 bg-[linear-gradient(180deg,rgba(255,179,30,0.12),rgba(18,23,47,0.92))] px-3 py-3 text-left sm:rounded-[0.85rem] sm:px-3.5">
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#ffb31e]">
                    EAU
                  </span>
                  <p className="text-sm font-semibold leading-5 text-foreground sm:text-[0.95rem]">
                    Hosting internacional y operación técnica especializada
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
                <Badge
                  variant="outline"
                  className="border-[#ffb31e]/35 px-2.25 py-1 text-[0.68rem] tracking-[0.14em] text-[#ffb31e] sm:px-2.5 sm:text-[0.72rem]"
                >
                  Operación técnica
                </Badge>
                <p className="text-[0.84rem] font-medium text-foreground-muted sm:text-sm">Infraestructura internacional</p>
              </div>
            </div>

            <div className="grid gap-2.5 sm:gap-3">
              <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
                La contraparte operativa coordina la infraestructura minera, la formalización según modalidad y la administración técnica de la operación.
              </p>
              <div className="rounded-[0.95rem] border border-[#ffb31e]/20 bg-[#12172f] px-3.5 py-3 sm:rounded-[1rem] sm:px-4 sm:py-3.5">
                <p className="text-[0.95rem] leading-6 text-foreground sm:text-base sm:leading-7">
                  Costo energético referencial de hosting: USD 0,078/kWh.
                </p>
              </div>
              <ul className="grid gap-2.5 sm:gap-3">
                {operatorResponsibilities.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded-[0.95rem] border border-white/8 bg-white/[0.03] px-3.5 py-3 sm:gap-3 sm:rounded-[1rem] sm:px-4 sm:py-3.5"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.4rem] inline-flex size-2 shrink-0 rounded-full bg-[#ffb31e] sm:mt-1 sm:size-2.5"
                    />
                    <span className="text-[0.95rem] leading-6 text-foreground sm:text-base sm:leading-7">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        <p className="max-w-5xl text-[0.88rem] leading-5 text-foreground-muted sm:text-sm sm:leading-6">
          La prestación del servicio minero, la operación técnica, el contrato y la facturación corresponden a la contraparte operativa definida según la modalidad elegida. Kapa21 participa como asesor y canal comercial, acompañando la evaluación sin prometer rentabilidad.
        </p>
      </Container>
    </Section>
  );
}
