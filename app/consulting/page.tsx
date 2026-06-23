import type { Metadata } from "next";
import Image from "next/image";

import { ApplicationBlock } from "@/components/consulting/ApplicationBlock";
import { DiagnosticSteps } from "@/components/consulting/DiagnosticSteps";
import { Kapa21Cycle } from "@/components/consulting/Kapa21Cycle";
import { MarketingFooter } from "@/components/site/MarketingFooter";
import { MarketingHeader } from "@/components/site/MarketingHeader";
import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kapa21.cl";
const PAGE_PATH = "/consulting";
const PAGE_TITLE = "Kapa21 Consulting | Infraestructura financiera sobre Bitcoin";
const PAGE_DESCRIPTION =
  "Tesorería Operativa, Fondeo Flexible, custodia, OTC y formación ejecutiva para empresas que buscan integrar Bitcoin a su estructura financiera.";

const CONTACT_EMAIL = "contacto@kapa21.cl";
const CALENDLY_URL = "https://calendly.com/contacto-kapa21/30min";
const WHATSAPP_URL =
  "https://wa.me/56971381604?text=Hola%2C%20quiero%20conversar%20sobre%20los%20servicios%20de%20Kapa21.";
const MAILTO_URL = `mailto:${CONTACT_EMAIL}`;

const diagnosticSteps = [
  {
    title: "Entender la operación",
    description:
      "Caja, deuda, líneas, cuentas por cobrar y pagar, inventario, vencimientos, estacionalidad y fuentes de financiamiento.",
  },
  {
    title: "Identificar fricciones",
    description:
      "Momentos en que la empresa pierde margen, velocidad o capacidad de decisión por falta de liquidez o dependencia de terceros.",
  },
  {
    title: "Diseñar la reserva",
    description:
      "Tamaño inicial, política de acumulación, límites de exposición, custodia, colateralización y LTV.",
  },
  {
    title: "Entregar una recomendación",
    description:
      "Una respuesta ejecutiva sobre aplicabilidad, tamaño de reserva, uso como colateral y reglas de operación.",
  },
] as const;

const diagnosticOutcomes = [
  "Si la solución aplica a la realidad financiera de la empresa.",
  "Qué tamaño inicial debería tener la reserva.",
  "Cuándo podría utilizarse como colateral.",
  "Bajo qué reglas debería operar.",
] as const;

const additionalCapabilities = [
  {
    title: "Formación y conversaciones ejecutivas",
    description:
      "Charlas, sesiones y workshops diseñados según la audiencia y el objetivo, desde directorios y equipos ejecutivos hasta inversionistas, universidades y comunidades.",
  },
  {
    title: "Compra y venta OTC",
    description:
      "Acompañamiento en operaciones de compra y venta de Bitcoin, con foco en precio, seguridad, trazabilidad y coordinación de la ejecución.",
  },
  {
    title: "Custodia y continuidad patrimonial",
    description:
      "Diseño de esquemas de custodia, control, recuperación y continuidad para personas, familias y empresas.",
  },
] as const;

const profileAreas = [
  {
    title: "Sector financiero",
    description: "Inversiones, servicios financieros y financiamiento empresarial.",
  },
  {
    title: "Consultoría, datos e inteligencia artificial",
    description: "Consultoría, analítica avanzada, inteligencia artificial y transformación empresarial.",
  },
  {
    title: "Bitcoin aplicado a empresas",
    description: "Tesorería, crédito, custodia e infraestructura financiera.",
  },
] as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: PAGE_PATH,
    siteName: "Kapa21",
    locale: "es_CL",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default function ConsultingPage() {
  return (
    <main data-theme="consulting" className="min-h-screen bg-background text-foreground">
      <Section
        tone="inverse"
        spacing="none"
        className="overflow-hidden pt-0 pb-16 sm:pb-20 lg:pb-20"
        style={{
          backgroundImage:
            "radial-gradient(960px circle at 18% 10%, rgba(247, 147, 26, 0.17), transparent 42%), radial-gradient(760px circle at 82% 18%, rgba(255, 255, 255, 0.06), transparent 34%), linear-gradient(180deg, #161c24 0%, #171a1f 100%)",
        }}
      >
        <MarketingHeader
          active="consulting"
          tone="dark"
          ctaHref={CALENDLY_URL}
          contactHref="#contacto"
        />

        <Container
          width="wide"
          className="grid gap-8 px-5 pb-4 pt-6 sm:px-6 sm:pt-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-start lg:gap-11 lg:px-8 lg:pb-8 lg:pt-8"
        >
          <div className="grid gap-4 sm:gap-5">
            <Badge
              variant="accent"
              className="justify-start px-2.25 py-1 text-[0.72rem] tracking-[0.14em] sm:text-[0.74rem]"
            >
              Kapa21 Consulting
            </Badge>
            <div className="grid gap-3.5 sm:gap-[1.125rem]">
              <h1 className="max-w-5xl text-balance text-[2.9rem] leading-[1.03] font-semibold tracking-[-0.045em] text-foreground max-[390px]:text-[2.78rem] sm:text-[3.35rem] lg:text-[4.65rem]">
                Infraestructura financiera sobre Bitcoin para empresas
              </h1>
              <p className="max-w-3xl text-[1.12rem] leading-7 text-foreground-muted sm:text-[1.17rem] sm:leading-8 lg:max-w-[44rem] lg:text-[1.28rem] lg:leading-9">
                Diseñamos y acompañamos una reserva propia, gobernada y colateralizable,
                integrada a la tesorería, el fondeo y las necesidades reales de liquidez de la
                empresa.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <Button
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm"
              >
                Agendar una reunión
              </Button>
              <Button
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm"
              >
                WhatsApp
              </Button>
              <Button
                href="#ciclo"
                variant="ghost"
                className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm"
              >
                Conocer cómo trabajamos
              </Button>
            </div>

            <p className="max-w-2xl text-[0.96rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-6">
              Tesorería Operativa y Fondeo Flexible son dos puntos de entrada sobre una misma lógica:
              una reserva Bitcoin que amplía flexibilidad, capacidad y criterio de decisión.
            </p>
          </div>

          <Card
            variant="elevated"
            className="relative overflow-hidden rounded-[1.35rem] p-5 sm:p-6 lg:p-8"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-9 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-10 bottom-9 h-px bg-gradient-to-r from-transparent via-border to-transparent"
            />
            <div className="relative grid gap-5">
              <Badge
                variant="outline"
                className="justify-start border-accent/30 px-2.25 py-1 text-[0.7rem] tracking-[0.14em] text-accent"
              >
                Reserva · Balance · Liquidez
              </Badge>

              <div className="grid gap-4 sm:gap-5">
                <div className="grid gap-2.5 rounded-[1.05rem] border border-border bg-background/70 p-3.5 backdrop-blur-sm sm:p-[1.125rem]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                      Reserva
                    </span>
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-xs">
                      01
                    </span>
                  </div>
                  <p className="max-w-md text-[0.94rem] leading-6 text-foreground-muted sm:text-sm">
                    Una posición propia con política definida, tamaño observable y reglas explícitas de uso.
                  </p>
                </div>

                <div className="grid gap-2.5 pl-5 sm:pl-7">
                  <span aria-hidden="true" className="h-6 w-px bg-gradient-to-b from-accent/70 to-border" />
                  <div className="grid gap-2.5 rounded-[1.05rem] border border-border bg-background/50 p-3.5 sm:p-[1.125rem]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                        Colateral
                      </span>
                      <span className="inline-flex size-8 items-center justify-center rounded-full border border-accent/30 bg-transparent text-[11px] font-semibold tracking-[0.12em] text-accent sm:size-9 sm:text-xs">
                        02
                      </span>
                    </div>
                    <p className="max-w-md text-[0.94rem] leading-6 text-foreground-muted sm:text-sm">
                      Una reserva que puede respaldar liquidez con reglas de margen, renovación, amortización y control.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2.5 pl-10 sm:pl-14">
                  <span aria-hidden="true" className="h-6 w-px bg-gradient-to-b from-border to-accent/70" />
                  <div className="grid gap-2.5 rounded-[1.05rem] border border-border bg-surface p-3.5 sm:p-[1.125rem]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                        Liquidez
                      </span>
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-xs">
                        03
                      </span>
                    </div>
                    <p className="max-w-md text-[0.94rem] leading-6 text-foreground-muted sm:text-sm">
                      Capacidad de transformar la reserva en margen de maniobra cuando la operación lo exige.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      <Section id="infraestructura" tone="default" spacing="md" className="scroll-mt-16 sm:scroll-mt-20">
        <Container
          width="wide"
          className="grid gap-8 px-5 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-12 lg:px-8"
        >
          <SectionHeading
            eyebrow="Infraestructura financiera sobre Bitcoin"
            title="Una reserva que conecta balance, colateral y liquidez"
            description="Kapa21 ayuda a empresas a incorporar Bitcoin dentro de su estructura financiera con políticas claras, custodia, control de riesgo y capacidad de uso operativo. El objetivo es construir una reserva propia que permanezca en balance y pueda transformarse en liquidez cuando la operación lo exige."
            className="gap-4 [&_h2]:max-w-3xl [&_h2]:text-[2.2rem] [&_h2]:leading-[1.03] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.65rem] lg:[&_h2]:text-[3.25rem] [&_p]:max-w-2xl [&_p]:text-[1.03rem] [&_p]:leading-7 sm:[&_p]:text-[1.1rem] sm:[&_p]:leading-8"
          />

          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-start md:gap-4 lg:gap-5">
            {[
              {
                title: "Reserva",
                body: "Permanece en balance, con reglas claras de acumulación, límites y gobierno.",
              },
              {
                title: "Colateral",
                body: "Puede respaldar liquidez cuando existe una política de uso, cobertura y control.",
              },
              {
                title: "Liquidez",
                body: "Se integra a decisiones reales de operación, fondeo y capacidad financiera.",
              },
            ]
              .map((item, index) => (
                <div key={item.title} className="grid gap-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-full bg-accent text-xs font-semibold tracking-[0.12em] text-accent-foreground">
                    0{index + 1}
                  </div>
                  <div className="grid gap-2.5">
                    <h3 className="text-[1.32rem] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.55rem]">
                      {item.title}
                    </h3>
                    <p className="max-w-xs text-sm leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-7">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))
              .flatMap((node, index, array) =>
                index < array.length - 1
                  ? [
                      node,
                      <div
                        key={`connector-${index}`}
                        aria-hidden="true"
                        className="hidden md:flex md:items-center md:justify-center"
                      >
                        <span className="h-px w-full bg-border" />
                      </div>,
                    ]
                  : [node],
              )}
          </div>
        </Container>
      </Section>

      <Section id="ciclo" tone="inverse" spacing="lg" className="scroll-mt-16 py-16 sm:scroll-mt-20 sm:py-20 lg:py-28">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:gap-10 lg:px-8">
          <SectionHeading
            eyebrow="El ciclo Kapa21"
            title="Del diseño de la política a la gestión continua de la reserva"
            description="Una reserva Bitcoin adquiere valor estratégico cuando se integra a decisiones de tesorería, fondeo y liquidez."
            className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.12rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.55rem] lg:[&_h2]:text-[3.2rem] [&_p]:max-w-3xl [&_p]:text-[1rem] [&_p]:leading-7 sm:[&_p]:text-[1.08rem] sm:[&_p]:leading-8"
          />
          <Kapa21Cycle />
        </Container>
      </Section>

      <Section id="aplicaciones" tone="default" spacing="md" className="scroll-mt-16 py-14 sm:scroll-mt-20 sm:py-16 lg:py-24">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:gap-10 lg:px-8">
          <SectionHeading
            eyebrow="Dos aplicaciones"
            title="La misma lógica, adaptada al negocio de cada empresa"
            description="La solución es una reserva propia, gobernada y colateralizable. Lo que cambia es el punto de entrada, el lenguaje financiero y las fricciones que se analizan."
            className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.1rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.45rem] lg:[&_h2]:text-[3.1rem] [&_p]:max-w-3xl [&_p]:text-[1rem] [&_p]:leading-7 sm:[&_p]:text-[1.08rem] sm:[&_p]:leading-8"
          />

          <div className="grid gap-4 lg:gap-5">
            <ApplicationBlock
              order="01"
              title="Tesorería Operativa"
              description="Para empresas cuya operación depende de caja, inventario, proveedores, cuentas por cobrar y capital de trabajo. Analizamos el ciclo operativo, los descalces de caja y los momentos en que la falta de liquidez afecta margen, velocidad o autonomía financiera."
              question="¿Dónde puede una reserva Bitcoin ampliar la flexibilidad financiera de la operación?"
              concepts={[
                "caja",
                "inventario",
                "proveedores",
                "cuentas por cobrar",
                "capital de trabajo",
              ]}
              variant="default"
            />
            <ApplicationBlock
              order="02"
              title="Fondeo Flexible"
              description="Para factorings, leasing, crédito automotriz y otras empresas cuya operación depende de la disponibilidad y estructura de fondeo. Analizamos líneas, costos, vencimientos, headroom, concentración de fuentes y operaciones que podrían haberse financiado con mayor disponibilidad de capital."
              question="¿Dónde puede una reserva Bitcoin agregar capacidad, velocidad y autonomía al fondeo?"
              concepts={[
                "líneas",
                "capacidad disponible",
                "vencimientos",
                "costo de fondeo",
                "colocaciones",
                "concentración de fuentes",
              ]}
              variant="highlight"
            />
          </div>
        </Container>
      </Section>

      <Section id="diagnostico" tone="inverse" spacing="md" className="scroll-mt-16 py-14 sm:scroll-mt-20 sm:py-16 lg:py-24">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:gap-10 lg:px-8">
          <SectionHeading
            eyebrow="Diagnóstico e implementación"
            title="Partimos por entender dónde la liquidez limita la operación"
            description="El proceso comienza con un diagnóstico ejecutivo de tres semanas. Kapa21 revisa la estructura financiera, identifica puntos de fricción y evalúa si una reserva Bitcoin puede aportar flexibilidad real."
            className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.08rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.45rem] lg:[&_h2]:text-[3.05rem] [&_p]:max-w-3xl [&_p]:text-[0.98rem] [&_p]:leading-7 sm:[&_p]:text-[1.08rem] sm:[&_p]:leading-8"
          />
          <DiagnosticSteps steps={[...diagnosticSteps]} outcomes={[...diagnosticOutcomes]} />
        </Container>
      </Section>

      <Section tone="default" spacing="sm" className="py-12 sm:py-14 lg:py-20">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:gap-10 lg:px-8">
          <SectionHeading
            eyebrow="Implementación"
            title="Del diagnóstico al piloto y la gestión recurrente"
            description="Cuando el diagnóstico confirma la oportunidad, Kapa21 acompaña una implementación acotada, medible y gobernada."
            className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.3rem] lg:[&_h2]:text-[2.85rem] [&_p]:max-w-3xl [&_p]:text-[0.98rem] [&_p]:leading-7 sm:[&_p]:text-[1.06rem] sm:[&_p]:leading-8"
          />

          <div className="grid gap-3.5 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center lg:gap-4">
            {[
              {
                title: "Diagnóstico",
                body: "Entender, medir y diseñar.",
              },
              {
                title: "Piloto",
                body: "Reserva inicial, custodia, compra, colateralización y reportería.",
              },
              {
                title: "Gestión recurrente",
                body: "Seguimiento mensual o trimestral, recomendaciones y ajustes.",
              },
            ]
              .map((item, index) => (
                <Card
                  key={item.title}
                  variant={index === 1 ? "highlight" : "elevated"}
                  className="grid gap-3 rounded-[1.08rem] p-4 sm:p-5 lg:min-h-[12rem]"
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-xs">
                    0{index + 1}
                  </span>
                  <div className="grid gap-2">
                    <h3 className="text-[1.08rem] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.2rem]">
                      {item.title}
                    </h3>
                    <p className="text-[0.94rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-7">
                      {item.body}
                    </p>
                  </div>
                </Card>
              ))
              .flatMap((node, index, array) =>
                index < array.length - 1
                  ? [
                      node,
                      <div
                        key={`stage-connector-${index}`}
                        aria-hidden="true"
                        className="hidden lg:flex lg:justify-center"
                      >
                        <span className="h-px w-10 bg-border" />
                      </div>,
                    ]
                  : [node],
              )}
          </div>

          <p className="max-w-3xl text-[0.98rem] leading-7 text-foreground-muted sm:text-[1.06rem] sm:leading-8">
            El nivel de acompañamiento se ajusta al tamaño de la operación y a la frecuencia de las decisiones.
          </p>
        </Container>
      </Section>

      <Section tone="muted" spacing="md" className="py-14 sm:py-16 lg:py-24">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:gap-10 lg:px-8">
          <SectionHeading
            eyebrow="Capacidades especializadas"
            title="Otras formas de trabajar con Kapa21"
            className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.08rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.42rem] lg:[&_h2]:text-[3rem]"
          />

          <div className="grid gap-3.5 lg:grid-cols-3 lg:gap-5">
            {additionalCapabilities.map((item, index) => (
              <Card
                key={item.title}
                variant={index === 1 ? "highlight" : "elevated"}
                className="grid gap-3 rounded-[1.08rem] p-5 sm:p-6"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-xs">
                  0{index + 1}
                </span>
                <div className="grid gap-2.5">
                  <h3 className="text-[1.16rem] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.32rem]">
                    {item.title}
                  </h3>
                  <p className="text-[0.94rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-7">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="default" spacing="md" className="py-14 sm:py-16 lg:py-24">
        <Container
          width="wide"
          className="grid gap-7 px-5 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-start lg:gap-12 lg:px-8"
        >
          <div className="grid gap-5">
            <SectionHeading
              eyebrow="Quién lidera Kapa21"
              title="Experiencia financiera, tecnológica y ejecutiva aplicada a Bitcoin"
              description="Kapa21 es liderada por Juan Pablo Moraga, matemático UC, consultor y ejecutivo con más de veinte años de experiencia profesional."
              className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.55rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.65rem] lg:[&_h2]:text-[3rem] [&_p]:max-w-3xl [&_p]:text-[1rem] [&_p]:leading-7 sm:[&_p]:text-[1.08rem] sm:[&_p]:leading-8"
            />

            <div className="grid gap-3">
              {profileAreas.map((area, index) => (
                <div
                  key={area.title}
                  className="grid grid-cols-[auto_1fr] gap-3 rounded-[1rem] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow)] sm:px-5 sm:py-4"
                >
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-xs">
                    0{index + 1}
                  </span>
                  <div className="grid gap-1.5">
                    <h3 className="text-[1rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.1rem]">
                      {area.title}
                    </h3>
                    <p className="text-[0.94rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-7">
                      {area.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Card variant="elevated" className="grid gap-3 rounded-[1.08rem] p-4 sm:p-5">
              <p className="text-[0.98rem] leading-7 text-foreground-muted sm:text-[1.02rem] sm:leading-8">
                Es autor de <span className="italic">Bitcoin, un imperativo moral</span> y profesor en programas ejecutivos y en el Instituto de Directores de Chile.
              </p>
              <p className="text-[0.98rem] leading-7 text-foreground-muted sm:text-[1.02rem] sm:leading-8">
                Esta combinación permite abordar Bitcoin desde la realidad concreta de una empresa: caja, riesgo, fondeo, gobierno y toma de decisiones.
              </p>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.54fr)] sm:items-start lg:grid-cols-[minmax(0,1fr)_minmax(170px,0.56fr)]">
            <Card
              variant="elevated"
              className="w-full max-w-[18.75rem] justify-self-start overflow-hidden rounded-[1.2rem] p-0 sm:max-w-none sm:rounded-[1.35rem]"
            >
              <div className="relative aspect-[4/4.85] w-full bg-surface-elevated">
                <Image
                  src="/team/juan-pablo-moraga.png"
                  alt="Juan Pablo Moraga, fundador de Kapa21"
                  fill
                  className="object-cover"
                  sizes="(max-width: 767px) 75vw, (max-width: 1023px) 60vw, 30vw"
                />
              </div>
              <div className="grid gap-1 border-t border-border px-4 py-3.5 sm:px-5 sm:py-4">
                <p className="text-sm font-semibold text-foreground">Juan Pablo Moraga</p>
                <p className="text-sm leading-6 text-foreground-muted">
                  Matemático UC · consultor · ejecutivo · profesor
                </p>
              </div>
            </Card>

            <Card
              variant="default"
              className="grid w-full max-w-[10rem] gap-3 rounded-[1.12rem] p-3.5 sm:max-w-none sm:rounded-[1.35rem] sm:p-4"
            >
              <Badge
                variant="outline"
                className="justify-start border-accent/30 px-2.25 py-1 text-[0.7rem] tracking-[0.14em] text-accent"
              >
                Libro
              </Badge>
              <div className="relative mx-auto aspect-[2/3] w-full max-w-[8.4rem] overflow-hidden rounded-[0.9rem] border border-border bg-surface-elevated sm:max-w-[9rem]">
                <Image
                  src="/friends-and-family/book-cover.png"
                  alt="Portada del libro Bitcoin, un imperativo moral"
                  fill
                  className="object-cover"
                  sizes="(max-width: 767px) 34vw, 14vw"
                />
              </div>
              <p className="text-[0.9rem] leading-6 text-foreground-muted sm:text-sm">
                Un marco de referencia para pensar Bitcoin con criterio moral, político y estratégico.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      <Section
        id="contacto"
        tone="inverse"
        spacing="md"
        className="scroll-mt-16 py-14 pb-8 sm:scroll-mt-20 sm:py-16 sm:pb-10 lg:py-24"
      >
        <Container
          width="wide"
          className="grid gap-7 px-5 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:items-center lg:gap-10 lg:px-8"
        >
          <div className="grid gap-4">
            <SectionHeading
              eyebrow="Conversemos"
              title="Una reserva propia puede ampliar la capacidad de decisión de la empresa"
              description="El primer paso es entender la operación, identificar sus puntos de fricción y evaluar si esta infraestructura financiera puede aportar flexibilidad real a la tesorería o al fondeo."
              className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.08rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.45rem] lg:[&_h2]:text-[3.15rem] [&_p]:max-w-3xl [&_p]:text-[0.98rem] [&_p]:leading-7 sm:[&_p]:text-[1.08rem] sm:[&_p]:leading-8"
            />
          </div>

          <Card variant="elevated" className="grid gap-3.5 rounded-[1.18rem] p-5 sm:p-6">
            <Badge
              variant="outline"
              className="justify-start border-accent/30 px-2.25 py-1 text-[0.7rem] tracking-[0.14em] text-accent"
            >
              Próximo paso
            </Badge>
            <p className="text-[0.94rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-7">
              Una conversación ejecutiva inicial permite ordenar el contexto financiero de la empresa y definir si vale la pena abrir el diagnóstico.
            </p>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <Button
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm"
              >
                Agendar una reunión
              </Button>
              <Button
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm"
              >
                WhatsApp
              </Button>
              <Button
                href={MAILTO_URL}
                variant="ghost"
                className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm"
              >
                Escribir a Kapa21
              </Button>
            </div>
          </Card>
        </Container>

        <MarketingFooter
          contactEmail={CONTACT_EMAIL}
          calendlyHref={CALENDLY_URL}
          tone="dark"
          className="mt-10 sm:mt-12"
        />
      </Section>
    </main>
  );
}
