import Image from "next/image";

import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const kapa21Responsibilities = [
  "orientación inicial",
  "explicación de alternativas",
  "selección de modalidad o equipo",
  "coordinación comercial",
  "acompañamiento del lead",
] as const;

const operatorResponsibilities = [
  "contrato y formalización",
  "recepción del pago",
  "infraestructura minera",
  "operación de equipos",
  "hosting y mantenimiento",
  "producción y reportes",
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
          eyebrow="PARTNER OPERATIVO"
          title="Kapa21 te ayuda a elegir. Andes SolarHash opera la infraestructura."
          className="gap-3 [&_h2]:max-w-5xl [&_h2]:text-[2.04rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.12rem]"
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
                <Image
                  src="/mining/partners/andes-solarhash-logo-blue-bg.jpg"
                  alt="Logo Andes SolarHash"
                  width={1042}
                  height={1042}
                  className="h-auto w-20 rounded-[0.75rem] object-cover sm:w-28 sm:rounded-[0.85rem]"
                  sizes="(min-width: 1024px) 7rem, 5rem"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
                <Badge
                  variant="outline"
                  className="border-[#ffb31e]/35 px-2.25 py-1 text-[0.68rem] tracking-[0.14em] text-[#ffb31e] sm:px-2.5 sm:text-[0.72rem]"
                >
                  Andes SolarHash
                </Badge>
                <p className="text-[0.84rem] font-medium text-foreground-muted sm:text-sm">Partner operativo</p>
              </div>
            </div>

            <div className="grid gap-2.5 sm:gap-3">
              <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
                Andes SolarHash ejecuta la infraestructura minera, formaliza la contratación y administra la operación según la modalidad acordada.
              </p>
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
          La prestación del servicio minero, la operación técnica, el contrato y la facturación corresponden a Andes SolarHash. Kapa21 participa como asesor y canal comercial de la alianza.
        </p>
      </Container>
    </Section>
  );
}
