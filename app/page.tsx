import type { Metadata } from "next";

import { AudienceBlock } from "@/components/home/AudienceBlock";
import { HomeMarketSection } from "@/components/home/HomeMarketSection";
import { PlatformPreview } from "@/components/home/PlatformPreview";
import { MarketingFooter } from "@/components/site/MarketingFooter";
import { MarketingHeader } from "@/components/site/MarketingHeader";
import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kapa21.cl";
const PAGE_TITLE = "Kapa21 | Ahorro y tesorería sobre Bitcoin";
const PAGE_DESCRIPTION =
  "Kapa21 acompaña a personas y empresas que quieren ahorrar en Bitcoin, construir tesorería y evaluar alternativas de liquidez con claridad y control.";
const HOME_URL = `${SITE_URL.replace(/\/$/, "")}/`;

const CALENDLY_URL = "https://calendly.com/contacto-kapa21/30min";
const WHATSAPP_URL =
  "https://wa.me/56971381604?text=Hola%2C%20quiero%20conversar%20sobre%20los%20servicios%20de%20Kapa21.";
const CONTACT_EMAIL = "contacto@kapa21.cl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: HOME_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: HOME_URL,
    siteName: "Kapa21",
    locale: "es_CL",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const homeNavItems = [
  { current: true, href: "/", label: "Inicio" },
  { href: "#personas", label: "Personas" },
  { href: "#pymes", label: "Pymes" },
  { href: "/consulting", label: "Consulting" },
  { href: "/mining", label: "Minería" },
  { href: "#contacto", label: "Contacto" },
];

const homeMobileNavItems = [
  { href: "#personas", label: "Personas" },
  { href: "#pymes", label: "Pymes" },
  { href: "/consulting", label: "Consulting" },
  { href: "/mining", label: "Minería" },
];

const valueProps = [
  {
    description:
      "Objetivos, ritmo de acumulación, horizonte, exposición y criterios de uso para que Bitcoin no quede reducido a una intuición difusa.",
    title: "Estrategia",
  },
  {
    description:
      "Compra, custodia, registro, seguimiento y toma de decisiones bajo reglas entendibles, trazables y sostenibles en el tiempo.",
    title: "Control",
  },
  {
    description:
      "Orientación en cada etapa, con lenguaje claro y criterio financiero tanto para ahorro personal como para tesorería empresarial.",
    title: "Acompañamiento",
  },
] as const;

const liquidityBlocks = [
  {
    description:
      "Liquidez puntual respaldada por Bitcoin, considerando costo, LTV y riesgos antes de mover una posición de largo plazo.",
    title: "Para personas",
  },
  {
    description:
      "Liquidez complementaria para capital de trabajo, proveedores, inventario o descalces transitorios de caja cuando la operación lo exige.",
    title: "Para empresas",
  },
  {
    description:
      "Límites de exposición, margen, renovación, amortización y capacidad real de pago antes de evaluar si la estructura tiene sentido.",
    title: "Con reglas claras",
  },
] as const;

export default function LandingPage() {
  return (
    <main data-theme="platform" className="min-h-screen bg-background text-foreground">
      <Section
        tone="default"
        spacing="none"
        className="overflow-hidden pt-0 pb-16 sm:pb-20 lg:pb-20"
        style={{
          backgroundImage:
            "radial-gradient(960px circle at 18% 10%, rgba(247, 147, 26, 0.18), transparent 42%), radial-gradient(720px circle at 82% 16%, rgba(255, 255, 255, 0.06), transparent 34%), linear-gradient(180deg, #161c24 0%, #171a1f 100%)",
        }}
      >
        <MarketingHeader
          compactMobile
          navItems={homeNavItems}
          mobileNavItems={homeMobileNavItems}
          showLogin={false}
          tone="dark"
          primaryAction={{
            className: "min-h-9 px-3 text-[0.8rem] sm:min-h-10 sm:px-3.5 sm:text-sm lg:min-h-11 lg:px-4",
            href: WHATSAPP_URL,
            label: "Hablar con Kapa21",
            rel: "noopener noreferrer",
            target: "_blank",
            variant: "primary",
          }}
          secondaryAction={{
            ariaLabel: "Plataforma Kapa21 disponible próximamente",
            className: "hidden lg:inline-flex",
            disabled: true,
            label: "Plataforma próximamente",
            title: "Disponible próximamente",
            variant: "secondary",
          }}
        />

        <Container
          width="wide"
          className="grid gap-6 px-5 pb-4 pt-5 sm:gap-8 sm:px-6 sm:pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start lg:gap-11 lg:px-8 lg:pb-8 lg:pt-8"
        >
          <div className="grid gap-3.5 sm:gap-5">
            <Badge
              variant="outline"
              className="justify-start border-accent/35 px-2.25 py-1 text-[0.72rem] tracking-[0.14em] text-accent sm:text-[0.74rem]"
            >
              Kapa21
            </Badge>
            <div className="grid gap-3 sm:gap-[1.125rem]">
              <h1 className="max-w-5xl text-balance text-[2.8rem] leading-[1.02] font-semibold tracking-[-0.045em] text-foreground max-[390px]:text-[2.64rem] sm:text-[3.35rem] lg:text-[4.65rem]">
                Bitcoin para ahorrar y construir tesorería
              </h1>
              <p className="max-w-3xl text-[1.1rem] leading-[1.62] text-foreground-muted sm:text-[1.17rem] sm:leading-8 lg:max-w-[42rem] lg:text-[1.28rem] lg:leading-9">
                Ayudamos a personas y empresas a incorporar Bitcoin con una estrategia clara,
                control y acompañamiento.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button href="/consulting" variant="primary" className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm">
                Conocer Kapa21 Consulting
              </Button>
              <Button
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm"
              >
                Hablar con Kapa21
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
              <Badge variant="outline" className="border-accent/30 text-accent">
                Plataforma Kapa21
              </Badge>
              <span>Disponible próximamente</span>
            </div>
          </div>

          <Card
            variant="elevated"
            className="relative overflow-hidden rounded-[1.4rem] p-5 sm:p-6 lg:p-8"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-accent/55 to-transparent"
            />
            <div className="relative grid gap-4 sm:gap-5">
              <div className="grid gap-3 rounded-[1.08rem] border border-border bg-background/70 p-4 backdrop-blur-sm sm:p-[1.125rem]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                    Ahorro
                  </span>
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-xs">
                    01
                  </span>
                </div>
                <p className="max-w-md text-[0.94rem] leading-6 text-foreground-muted sm:text-sm">
                  Acumulación de largo plazo con criterio, ritmo y continuidad patrimonial.
                </p>
              </div>

              <div className="grid gap-3 pl-5 sm:pl-7">
                <span aria-hidden="true" className="h-6 w-px bg-gradient-to-b from-accent/70 to-border" />
                <div className="grid gap-3 rounded-[1.08rem] border border-border bg-background/55 p-4 sm:p-[1.125rem]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                      Tesorería
                    </span>
                    <span className="inline-flex size-8 items-center justify-center rounded-full border border-accent/30 text-[11px] font-semibold tracking-[0.12em] text-accent sm:size-9 sm:text-xs">
                      02
                    </span>
                  </div>
                  <p className="max-w-md text-[0.94rem] leading-6 text-foreground-muted sm:text-sm">
                    Reserva propia conectada a caja, políticas y decisiones de liquidez.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 pl-10 sm:pl-14">
                <span aria-hidden="true" className="h-6 w-px bg-gradient-to-b from-border to-accent/70" />
                <div className="grid gap-3 rounded-[1.08rem] border border-border bg-surface p-4 sm:p-[1.125rem]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                      Control
                    </span>
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-xs">
                      03
                    </span>
                  </div>
                  <p className="max-w-md text-[0.94rem] leading-6 text-foreground-muted sm:text-sm">
                    Custodia, seguimiento y decisiones tomadas con registro y reglas claras.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      <Section id="personas" tone="inverse" spacing="md" className="scroll-mt-16 py-14 sm:scroll-mt-20 sm:py-16 lg:py-24">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:gap-10 lg:px-8">
          <SectionHeading
            eyebrow="Personas y pymes"
            title="Dos formas de incorporar Bitcoin"
            className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.12rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.52rem] lg:[&_h2]:text-[3.15rem]"
          />

          <div className="grid gap-4 lg:gap-5">
            <AudienceBlock
              eyebrow="Personas"
              title="Ahorro en Bitcoin"
              body="Construye una posición de largo plazo con una estrategia de acumulación, custodia y continuidad acorde con tus objetivos. Kapa21 acompaña a personas y familias que buscan integrar Bitcoin a su ahorro y patrimonio con mayor claridad."
              question="¿Cómo construir una posición de largo plazo con continuidad y criterio?"
              concepts={["acumulación", "custodia", "continuidad", "largo plazo"]}
              ctaHref={WHATSAPP_URL}
              ctaLabel="Hablar con Kapa21"
              external
            />

            <div id="pymes" className="scroll-mt-16 sm:scroll-mt-20">
              <AudienceBlock
                eyebrow="Pymes"
                title="Tesorería sobre Bitcoin"
                body="Incorpora Bitcoin a la estructura financiera de la empresa y construye una reserva con políticas, control y criterios de gestión. Kapa21 acompaña a pymes que quieren comenzar gradualmente y conectar Bitcoin con sus decisiones de caja y tesorería."
                question="¿Dónde puede una reserva Bitcoin ampliar la flexibilidad financiera de la operación?"
                concepts={["caja", "reserva", "políticas", "control"]}
                ctaHref="/consulting"
                ctaLabel="Conocer soluciones para empresas"
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="default" spacing="md" className="py-14 sm:py-16 lg:py-24">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:gap-10 lg:px-8">
          <SectionHeading
            eyebrow="Qué aporta Kapa21"
            title="Una forma clara de incorporar Bitcoin"
            description="Kapa21 transforma una intención general en una estrategia concreta y aplicable."
            className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.08rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.42rem] lg:[&_h2]:text-[3rem] [&_p]:max-w-3xl [&_p]:text-[0.98rem] [&_p]:leading-7 sm:[&_p]:text-[1.06rem] sm:[&_p]:leading-8"
          />

          <div className="grid gap-3.5 lg:grid-cols-3 lg:gap-5">
            {valueProps.map((item, index) => (
              <Card
                key={item.title}
                variant={index === 1 ? "highlight" : "elevated"}
                className="grid gap-3 rounded-[1.08rem] p-5 sm:p-6"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-xs">
                  0{index + 1}
                </span>
                <div className="grid gap-2.5">
                  <h2 className="text-[1.16rem] leading-[1.05] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.32rem]">
                    {item.title}
                  </h2>
                  <p className="text-[0.94rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-7">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="inverse" spacing="md" className="py-14 sm:py-16 lg:py-24">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:gap-10 lg:px-8">
          <SectionHeading
            eyebrow="Plataforma Kapa21"
            title="Compra, gestión y seguimiento en un solo lugar"
            description="Estamos desarrollando una plataforma para que personas y empresas puedan comprar Bitcoin, administrar una posición y mantener registro de sus movimientos."
            className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.08rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.42rem] lg:[&_h2]:text-[3rem] [&_p]:max-w-3xl [&_p]:text-[0.98rem] [&_p]:leading-7 sm:[&_p]:text-[1.06rem] sm:[&_p]:leading-8"
          />

          <PlatformPreview />
        </Container>
      </Section>

      <Section tone="inverse" spacing="md" className="py-14 sm:py-16 lg:py-24">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:gap-10 lg:px-8">
          <SectionHeading
            eyebrow="Liquidez"
            title="Una reserva que también puede convertirse en colateral"
            description="Bitcoin puede permanecer como ahorro o reserva y, cuando corresponde, respaldar alternativas de liquidez sin vender la posición. Kapa21 ayuda a evaluar cuándo esta posibilidad tiene sentido, bajo qué condiciones y con qué límites."
            className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.08rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.42rem] lg:[&_h2]:text-[3rem] [&_p]:max-w-3xl [&_p]:text-[0.98rem] [&_p]:leading-7 sm:[&_p]:text-[1.06rem] sm:[&_p]:leading-8"
          />

          <div className="grid gap-3.5 lg:grid-cols-3 lg:gap-5">
            {liquidityBlocks.map((item, index) => (
              <Card
                key={item.title}
                variant={index === 2 ? "highlight" : "elevated"}
                className="grid gap-3 rounded-[1.08rem] p-5 sm:p-6"
              >
                <Badge
                  variant={index === 2 ? "accent" : "outline"}
                  className={index === 2 ? undefined : "justify-start border-accent/30 text-accent"}
                >
                  {item.title}
                </Badge>
                <p className="text-[0.94rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-7">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <HomeMarketSection />

      <Section tone="inverse" spacing="md" className="py-14 sm:py-16 lg:py-24">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-start lg:gap-12 lg:px-8">
          <div className="grid gap-5">
            <SectionHeading
              eyebrow="Kapa21 Consulting"
              title="Infraestructura financiera sobre Bitcoin para empresas"
              description="Para empresas que requieren una solución más estructurada, Kapa21 Consulting diseña y acompaña políticas de tesorería, fondeo, custodia, colateral y reportería. El trabajo comienza por entender la operación, identificar puntos de fricción y evaluar cómo una reserva Bitcoin puede integrarse a decisiones reales de caja, liquidez y financiamiento."
              className="gap-4 [&_h2]:max-w-4xl [&_h2]:text-[2.08rem] [&_h2]:leading-[1.04] [&_h2]:tracking-[-0.035em] sm:[&_h2]:text-[2.48rem] lg:[&_h2]:text-[3.05rem] [&_p]:max-w-3xl [&_p]:text-[0.98rem] [&_p]:leading-7 sm:[&_p]:text-[1.06rem] sm:[&_p]:leading-8"
            />
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button href="/consulting" variant="primary" className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm">
                Conocer Kapa21 Consulting
              </Button>
              <Button
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm"
              >
                Agendar una reunión
              </Button>
            </div>
          </div>

          <Card variant="elevated" className="grid gap-4 rounded-[1.25rem] p-5 sm:p-6">
            <Badge variant="outline" className="justify-start border-accent/30 text-accent">
              Solución estructurada
            </Badge>
            <div className="grid gap-3">
              {[
                "Políticas de tesorería y fondeo alineadas con la operación.",
                "Custodia, colateral y reportería con criterio de continuidad.",
                "Diagnóstico ejecutivo para entender si una reserva Bitcoin aporta flexibilidad real.",
              ].map((item) => (
                <div key={item} className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-foreground-muted">
                  <span aria-hidden="true" className="mt-2 size-2 rounded-full bg-accent" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </Section>

      <Section id="contacto" tone="default" spacing="md" className="scroll-mt-16 py-14 pb-8 sm:scroll-mt-20 sm:py-16 sm:pb-10 lg:py-24">
        <Container width="wide" className="grid gap-7 px-5 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:items-center lg:gap-10 lg:px-8">
          <div className="grid gap-4">
            <SectionHeading
              eyebrow="Conversemos"
              title="Bitcoin para ahorrar, construir reserva y ampliar opciones"
              description="Kapa21 acompaña a personas, familias y empresas que quieren incorporar Bitcoin con claridad, control y criterio financiero."
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
              Si quieres empezar a ahorrar en Bitcoin, construir una reserva o evaluar una estructura más profunda para la empresa, conversemos primero sobre tu contexto.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm"
              >
                Hablar con Kapa21
              </Button>
              <Button href="/consulting" variant="secondary" className="min-h-12 rounded-full px-4 text-[0.95rem] sm:min-h-11 sm:px-4 sm:text-sm">
                Conocer Kapa21 Consulting
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
              <Badge variant="outline" className="border-accent/30 text-accent">
                Plataforma Kapa21
              </Badge>
              <span>Disponible próximamente</span>
            </div>
          </Card>
        </Container>

        <MarketingFooter
          contactEmail={CONTACT_EMAIL}
          calendlyHref={CALENDLY_URL}
          tone="dark"
          className="mt-10 sm:mt-12"
          navLinks={[
            { href: "/", label: "Inicio" },
            { href: "#personas", label: "Personas" },
            { href: "#pymes", label: "Pymes" },
            { href: "/consulting", label: "Consulting" },
            { href: "/mining", label: "Minería" },
            { href: "#contacto", label: "Contacto" },
          ]}
        />
      </Section>
    </main>
  );
}
