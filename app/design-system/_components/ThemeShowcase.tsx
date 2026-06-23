import Image from "next/image";

import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";

type ThemeName = "platform" | "consulting";

type ThemeShowcaseProps = {
  description: string;
  eyebrow: string;
  logoSrc: string;
  status: string;
  theme: ThemeName;
  title: string;
};

export function ThemeShowcase({
  description,
  eyebrow,
  logoSrc,
  status,
  theme,
  title,
}: ThemeShowcaseProps) {
  const isConsulting = theme === "consulting";

  return (
    <div data-theme={theme} className="overflow-hidden rounded-[calc(var(--radius-lg)+0.5rem)] border border-border shadow-[var(--shadow)]">
      <Section spacing="lg" tone="default">
        <Container width="wide" className="grid gap-10">
          <div className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Image src={logoSrc} alt="Kapa21" width={176} height={44} unoptimized />
              <Badge variant="accent">{status}</Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-foreground-muted">
              <span>Overview</span>
              <span>Servicios</span>
              <span>Proceso</span>
              <span>Contacto</span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center">
            <div className="grid gap-6">
              <SectionHeading
                eyebrow={eyebrow}
                title={title}
                description={description}
              />
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Agendar conversacion</Button>
                <Button variant="secondary">Descargar overview</Button>
                <Button variant="ghost">Ver estructura</Button>
                <Button variant="ghost" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            <Card variant="elevated" className="grid gap-5">
              <Badge variant="outline">Panel de ejemplo</Badge>
              <div className="grid gap-2">
                <span className="text-sm uppercase tracking-[0.14em] text-foreground-muted">
                  Holdings revisados
                </span>
                <strong className="text-4xl font-semibold tracking-tight text-foreground">
                  12.4 BTC
                </strong>
              </div>
              <p className="text-sm leading-7 text-foreground-muted">
                {isConsulting
                  ? "La variante editorial sigue soportando paneles de datos siempre que la jerarquia entre fondo, tipografia y accion este clara."
                  : "La identidad carbon mantiene foco operacional y suficiente espacio para datos, modulos y llamadas comerciales."}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-4">
                  <span className="block text-xs uppercase tracking-[0.14em] text-foreground-muted">
                    Custodia
                  </span>
                  <strong className="mt-2 block text-base text-foreground">Multi-entity</strong>
                </div>
                <div className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-4">
                  <span className="block text-xs uppercase tracking-[0.14em] text-foreground-muted">
                    Reporting
                  </span>
                  <strong className="mt-2 block text-base text-foreground">Semanal</strong>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      <Section spacing="md" tone="muted">
        <Container width="wide" className="grid gap-8">
          <SectionHeading
            eyebrow="Primitives"
            title="Botones, cards, badges y jerarquia de superficies"
            description="Esta seccion prueba la capa reutilizable sobre un tono intermedio del mismo tema, sin cambiar el tema global de la ruta."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="grid gap-4">
              <Badge variant="default">Card default</Badge>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Marco operativo
              </h3>
              <p className="text-sm leading-7 text-foreground-muted">
                Pensada para explicar etapas, capacidades o piezas de una propuesta.
              </p>
            </Card>

            <Card variant="highlight" className="grid gap-4">
              <Badge variant="accent">Card highlight</Badge>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                Reserva corporativa en Bitcoin
              </h3>
              <p className="text-sm leading-7 text-foreground-muted">
                La variante highlight enfatiza el eje estrategico sin romper la sobriedad del sistema.
              </p>
            </Card>

            <Card variant="elevated" className="grid gap-4">
              <Badge variant="outline">Dato numerico</Badge>
              <strong className="text-4xl font-semibold tracking-tight text-foreground">
                36 meses
              </strong>
              <p className="text-sm leading-7 text-foreground-muted">
                Horizonte sugerido para gobernanza, control y acompanamiento.
              </p>
            </Card>
          </div>
        </Container>
      </Section>

      <Section spacing="md" tone="inverse">
        <Container width="wide" className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start">
          <div className="grid gap-6">
            <SectionHeading
              eyebrow="Tono inverse"
              title={isConsulting ? "La narrativa puede volver al carbon cuando hace falta densidad." : "La narrativa puede abrirse a superficies claras como recurso editorial."}
              description={isConsulting ? "Consulting parte claro, pero puede volver a oscuro para reforzar foco, datos o confianza institucional." : "Platform y partnerships pueden insertar bloques marfil para explicar tesis, proceso y contexto sin abandonar la identidad base."}
            />
            <Card variant="default" className="grid gap-4 bg-transparent shadow-none">
              <p className="text-base leading-8 text-foreground-muted">
                La alternancia ocurre con <code className="rounded bg-surface px-1.5 py-0.5 text-[0.9em] text-foreground">data-tone</code>, no con un switch global en el documento. Eso permite que una misma ruta combine bloques densos, editoriales y comerciales sin duplicar layout ni tokens.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">default</Badge>
                <Badge variant="outline">inverse</Badge>
                <Badge variant="default">muted</Badge>
              </div>
            </Card>
          </div>

          <Card variant="elevated" className="grid gap-4">
            <Field
              id={`${theme}-name`}
              label="Nombre"
              placeholder="Tesoreria Kapa21"
              hint="Campo base con helper text y focus-visible." 
            />
            <Field
              id={`${theme}-email`}
              label="Correo"
              placeholder="equipo@empresa.cl"
              type="email"
              error="Ejemplo de mensaje de error visible y legible."
            />
            <Field
              id={`${theme}-context`}
              label="Contexto"
              placeholder="Describe el objetivo de tesoreria, consulting o partnership que quieres evaluar."
              textarea
            />
            <Field
              id={`${theme}-disabled`}
              label="Campo deshabilitado"
              value="Disponible tras validacion comercial"
              disabled
              readOnly
            />
          </Card>
        </Container>
      </Section>

      <Section spacing="sm" tone="accent">
        <Container width="wide" className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3">
            <Badge variant="outline">Tono accent</Badge>
            <h3 className="text-3xl font-semibold tracking-tight text-foreground">
              Capa final de llamada a la accion
            </h3>
            <p className="max-w-2xl text-base leading-7 text-foreground-muted">
              El acento se usa para destacar decision y conversion, no como fondo dominante de toda la experiencia.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Solicitar propuesta</Button>
            <Button variant="secondary">Ver ejemplo</Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}
