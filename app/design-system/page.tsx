import type { Metadata } from "next";
import Image from "next/image";

import { ThemePreviewCard } from "./_components/ThemePreviewCard";
import { ThemeShowcase } from "./_components/ThemeShowcase";
import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Design System | Kapa21",
  description:
    "Sandbox de tokens, temas y primitives para la siguiente etapa del sistema visual de Kapa21.",
};

const approvedThemes = [
  {
    theme: "platform" as const,
    title: "Platform",
    status: "Aprobado base",
    logoSrc: "/brand/k21-lockup-white.svg",
    description:
      "Tema oscuro base para producto, autenticacion, operacion y futuras mejoras graduales de la plataforma.",
    note:
      "Usa carbon sofisticado como identidad principal. No cambia ninguna ruta existente por si solo; solo actua dentro de wrappers con data-theme.",
    palette: [
      { label: "Background", value: "#171A1F" },
      { label: "Surface", value: "#1E232B" },
      { label: "Foreground", value: "#F2EEE8" },
      { label: "Accent", value: "#F7931A" },
    ],
  },
  {
    theme: "consulting" as const,
    title: "Consulting",
    status: "Aprobado editorial",
    logoSrc: "/brand/k21-lockup-dark.svg",
    description:
      "Tema claro para narrativa, landings y secciones editoriales con continuidad directa respecto de la identidad oscura.",
    note:
      "Parte sobre marfil y blanco suave, pero puede alternar bloques oscuros mediante data-tone sin cambiar el tema global del documento.",
    palette: [
      { label: "Background", value: "#F4EFE6" },
      { label: "Surface", value: "#FBF8F1" },
      { label: "Foreground", value: "#1D2126" },
      { label: "Accent", value: "#F7931A" },
    ],
  },
  {
    theme: "partnership" as const,
    title: "Partnership",
    status: "Aprobado comercial",
    logoSrc: "/brand/k21-lockup-white.svg",
    description:
      "Comparte la base carbon de platform, pero queda preparado para usar bandas claras, medios ricos y bloques comerciales cuando el contenido lo pida.",
    note:
      "Es un tema distinto para poder aislar decisiones futuras de layout y tono sin duplicar la paleta base.",
    palette: [
      { label: "Background", value: "#171A1F" },
      { label: "Surface", value: "#1E232B" },
      { label: "Foreground", value: "#F2EEE8" },
      { label: "Accent", value: "#F7931A" },
    ],
  },
];

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-[#0b1016] text-white">
      <Section
        theme="platform"
        spacing="lg"
        className="border-b border-white/5"
        style={{
          backgroundImage:
            "radial-gradient(circle at top, rgba(247, 147, 26, 0.14), transparent 26%), linear-gradient(180deg, #0d1117 0%, #10161f 100%)",
        }}
      >
        <Container width="wide" className="grid gap-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="accent">Etapa de cimientos</Badge>
            <Badge variant="outline">Sin migracion masiva</Badge>
            <Badge variant="default">Sin impacto en rutas actuales</Badge>
          </div>
          <SectionHeading
            eyebrow="Sistema visual aprobado"
            title="Carbón Kapa21 como identidad principal y superficies claras como recurso editorial"
            description="Esta etapa solo implementa tokens, temas, tonos de seccion y primitives reutilizables. No construye todavia /consulting, no rehace el home y no migra rutas existentes."
          />
          <div className="flex flex-wrap gap-3">
            <Button href="#approved-themes" variant="primary">
              Ver temas aprobados
            </Button>
            <Button href="#platform-showcase" variant="secondary">
              Ver showcase base
            </Button>
          </div>
        </Container>
      </Section>

      <Section theme="platform" tone="muted" spacing="md" id="approved-themes">
        <Container width="wide" className="grid gap-10">
          <SectionHeading
            eyebrow="Tokens y wrappers"
            title="Tres temas aprobados y una referencia historica descartada"
            description="Los tres temas se activan con wrappers locales mediante data-theme. Los tonos default, inverse, muted y accent se aplican con data-tone dentro de cada ruta."
          />

          <div className="grid gap-5 xl:grid-cols-3">
            {approvedThemes.map((theme) => (
              <ThemePreviewCard key={theme.title} {...theme} />
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
            <Card
              className="grid gap-5 border-[#2B3039] bg-[#050607] text-[#F5F7FA] shadow-[0_28px_72px_rgba(0,0,0,0.32)]"
              style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0) 40%)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Image
                  src="/brand/k21-lockup-white.svg"
                  alt="Kapa21"
                  width={170}
                  height={42}
                  unoptimized
                />
                <Badge className="border-[#2B3039] bg-transparent text-[#B4BAC3]" variant="outline">
                  Referencia historica
                </Badge>
              </div>
              <div className="grid gap-3">
                <h3 className="text-2xl font-semibold tracking-tight text-[#F5F7FA]">
                  Propuesta A descartada
                </h3>
                <p className="text-sm leading-7 text-[#B4BAC3]">
                  Se mantiene solo como punto de comparacion. No forma parte del sistema de temas nuevo y no se usara como direccion futura.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                <div className="rounded-[1rem] border border-[#2B3039] bg-[#111318] px-3 py-3 text-sm text-[#F5F7FA]">#050607</div>
                <div className="rounded-[1rem] border border-[#2B3039] bg-[#191C22] px-3 py-3 text-sm text-[#F5F7FA]">#191C22</div>
                <div className="rounded-[1rem] border border-[#2B3039] bg-[#F7931A] px-3 py-3 text-sm font-semibold text-[#171A1F]">#F7931A</div>
                <div className="rounded-[1rem] border border-[#2B3039] bg-[#050607] px-3 py-3 text-sm text-[#B4BAC3]">#B4BAC3</div>
              </div>
            </Card>

            <Card variant="elevated" className="grid gap-4">
              <Badge variant="accent">Decision tomada</Badge>
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                La arquitectura nueva nace desde B y C
              </h3>
              <p className="text-sm leading-7 text-foreground-muted">
                Platform y partnership heredan la base carbon. Consulting hereda la base editorial clara. La alternancia entre oscuro y claro se resuelve por tono de seccion, no por duplicacion de layout.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button href="#consulting-showcase" variant="secondary">
                  Ver consulting
                </Button>
                <Button href="#partnership-proof" variant="ghost">
                  Ver partnership
                </Button>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      <section id="platform-showcase" className="border-t border-white/5 bg-[#0b1016] px-4 py-6 sm:px-6 lg:px-8">
        <ThemeShowcase
          theme="platform"
          eyebrow="Platform · Tema oscuro aprobado"
          title="Base carbon para operacion, confianza y crecimiento gradual"
          description="Este es el tono oscuro principal aprobado para Kapa21. Mantiene el caracter financiero y tecnico, pero abandona el negro absoluto y ordena mejor las superficies."
          logoSrc="/brand/k21-lockup-white.svg"
          status="Aprobado base"
        />
      </section>

      <section id="consulting-showcase" className="bg-[#0b1016] px-4 py-6 sm:px-6 lg:px-8">
        <ThemeShowcase
          theme="consulting"
          eyebrow="Consulting · Variante editorial aprobada"
          title="Superficies claras para narrativa, contexto y captacion"
          description="La variante editorial clara conserva el acento naranja y la continuidad de marca, pero habilita una lectura mas corporativa y aireada para futuras landings publicas."
          logoSrc="/brand/k21-lockup-dark.svg"
          status="Aprobado editorial"
        />
      </section>

      <div data-theme="partnership" id="partnership-proof" className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[calc(var(--radius-lg)+0.5rem)] border border-border shadow-[var(--shadow)]">
          <Section spacing="md" tone="default">
            <Container width="wide" className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
              <div className="grid gap-5">
                <SectionHeading
                  eyebrow="Partnership · Prueba de tema"
                  title="Misma base carbon, preparada para un lenguaje mas comercial"
                  description="Partnership arranca desde la misma identidad oscura que platform, pero queda listo para bloques de datos, media y CTA mas agresivos cuando se construyan futuras landings comerciales."
                />
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Hablar con ventas</Button>
                  <Button variant="secondary">Ver caso de mineria</Button>
                </div>
              </div>

              <Card variant="highlight" className="grid gap-4">
                <div className="flex items-center justify-between gap-4">
                  <Image
                    src="/brand/k21-lockup-white.svg"
                    alt="Kapa21"
                    width={170}
                    height={42}
                    unoptimized
                  />
                  <Badge variant="accent">Partnership</Badge>
                </div>
                <p className="text-sm leading-7 text-foreground-muted">
                  Esta prueba confirma que el tercer tema existe como wrapper independiente, aunque comparta la misma paleta base que platform.
                </p>
              </Card>
            </Container>
          </Section>

          <Section spacing="sm" tone="inverse">
            <Container width="wide" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="grid gap-3">
                <Badge variant="outline">Tono inverse sobre partnership</Badge>
                <p className="max-w-3xl text-base leading-7 text-foreground-muted">
                  Cuando el contenido comercial necesite aire editorial, casos, formularios o bloques de evidencia, el cambio ocurrira con data-tone dentro de la misma ruta.
                </p>
              </div>
              <Button variant="ghost">Ver tono claro</Button>
            </Container>
          </Section>
        </div>
      </div>
    </main>
  );
}
