import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  LogoSlot,
  PARTNERSHIP_LOGOS,
  PARTNERSHIP_PAGE_BACKGROUND,
  PARTNERSHIP_SITE_URL,
  PartnershipFooter,
  PartnershipHeader,
  SectionHeading,
} from "./_components/PartnershipPageChrome";
import { ScrollToFormButton } from "./_components/ScrollToFormButton";
import { TreasuryReviewForm } from "./_components/TreasuryReviewForm";

const PAGE_PATH = "/tesoreria-kapa21-biterva";
const PAGE_TITLE =
  "Planificación financiera y estrategia de tesorería sobre Bitcoin para empresas | Kapa21 x Biterva";
const PAGE_DESCRIPTION =
  "Landing ejecutiva de Kapa21 x Biterva para evaluar Bitcoin como infraestructura financiera desde la tesorería, la reserva y la capacidad de decisión.";

const HERO_BULLET = "Bitcoin como infraestructura financiera";

const TEAM_MEMBERS = [
  {
    name: "Juan Pablo Moraga",
    company: "KAPA21",
    headline: "CEO de KAPA21 · profesor · autor de Bitcoin, un imperativo moral",
    description:
      "Trayectoria en planificación, analítica, servicios financieros y trabajo con directorios. Su experiencia permite traducir Bitcoin a lenguaje de tesorería, estrategia y decisiones empresariales.",
    initials: "JPM",
    photoSrc: null,
  },
  {
    name: "Gabriel Amorocho",
    company: "Biterva",
    headline: "Biterva · estrategia comercial y advisory B2B",
    description:
      "Experiencia en estrategia comercial, crecimiento, advisory y construcción de sistemas de venta B2B. Su trayectoria permite estructurar procesos comerciales, leer oportunidades reales y acompañar decisiones de implementación con foco en negocio.",
    initials: "GA",
    photoSrc: null,
  },
] as const;

export const metadata: Metadata = {
  metadataBase: new URL(PARTNERSHIP_SITE_URL),
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_PATH,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: PAGE_PATH,
    siteName: "Kapa21",
  },
};

function PlaceholderPortrait({
  name,
  initials,
  src,
}: {
  name: string;
  initials: string;
  src?: string | null;
}) {
  if (src) {
    return (
      <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        <Image src={src} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-center">
      <div className="text-lg font-semibold tracking-[0.12em] text-white">{initials}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
        Foto
      </div>
    </div>
  );
}

export default function TesoreriaKapa21BitervaPage() {
  return (
    <main className={PARTNERSHIP_PAGE_BACKGROUND}>
      <PartnershipHeader />

      <div className="mx-auto max-w-6xl px-6 pb-16">
        <section className="grid gap-8 pb-16 pt-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-neutral-500">
              Alianza KAPA21 x Biterva
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <LogoSlot
                src={PARTNERSHIP_LOGOS.kapa21}
                alt="Logo Kapa21"
                placeholder="Logo Kapa21"
              />
              <LogoSlot
                src={PARTNERSHIP_LOGOS.biterva}
                alt="Logo Biterva"
                placeholder="Espacio logo Biterva"
              />
            </div>

            <h1 className="mt-8 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Planificación financiera y estrategia de tesorería sobre Bitcoin para empresas
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-300">
              Una nueva forma de fortalecer reserva, flexibilidad y capacidad de decisión.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ScrollToFormButton className="k21-btn-primary px-5 py-3">
                Postular a una Revisión Estratégica de Tesorería
              </ScrollToFormButton>
              <Link
                href="/servicios"
                className="k21-btn-secondary px-5 py-3"
              >
                Ver servicios KAPA21
              </Link>
            </div>
          </div>

          <aside className="k21-card p-6 sm:p-8">
            <div className="inline-flex rounded-full border border-[#F7931A]/20 bg-[#F7931A]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#F7931A]">
              {HERO_BULLET}
            </div>
            <p className="mt-5 text-lg leading-8 text-neutral-200">
              Un enfoque para mirar balance, liquidez, reserva y acceso a capital desde criterios
              ejecutivos, no desde ruido de mercado.
            </p>
            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Reserva
                </div>
                <div className="mt-2 text-sm leading-6 text-neutral-300">
                  Diseñar qué rol cumple Bitcoin en la política financiera de la empresa.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Flexibilidad
                </div>
                <div className="mt-2 text-sm leading-6 text-neutral-300">
                  Conectar ahorro, liquidez y acceso a financiamiento con mayor margen de maniobra.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Criterio
                </div>
                <div className="mt-2 text-sm leading-6 text-neutral-300">
                  Traducir decisiones complejas en política, implementación y acompañamiento.
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="k21-card p-6 sm:p-8">
          <SectionHeading
            eyebrow="Problema"
            title="Muchas empresas operan. Pocas planifican con libertad financiera."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              "Deuda cara y poco flexible",
              "Garantías que inmovilizan",
              "Capital de trabajo exigente",
              "Planificación capturada por el corto plazo",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-base text-neutral-200"
              >
                <span className="mr-3 inline-block h-2.5 w-2.5 rounded-full bg-[#F7931A]" />
                {item}
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-3xl text-base leading-7 text-neutral-300">
            Bitcoin entra como infraestructura financiera cuando mejora tesorería, reserva y
            capacidad de decisión.
          </p>
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Enfoque"
            title="Bitcoin como infraestructura financiera"
            description="Un marco ejecutivo para ordenar decisiones financieras, no para sumar complejidad."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Planificación financiera",
                body:
                  "Definir qué función cumple Bitcoin dentro del balance, la política de reserva y la estrategia de crecimiento.",
              },
              {
                title: "Tesorería más flexible",
                body:
                  "Diseñar una estructura que conecte ahorro, liquidez y acceso a financiamiento con mayor flexibilidad.",
              },
              {
                title: "Implementación ejecutiva",
                body:
                  "Traducir la estrategia en política, custodia, acompañamiento y decisiones operativas.",
              },
            ].map((item, index) => (
              <article key={item.title} className="k21-card p-6">
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#F7931A]">
                  0{index + 1}
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-neutral-300">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 k21-card p-6 sm:p-8">
          <SectionHeading
            eyebrow="Oferta de entrada"
            title="Punto de partida: Revisión Estratégica de Tesorería"
            description="Una instancia acotada para evaluar contexto, criterio de decisión y posibilidad real de implementación."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              "Sesión ejecutiva de 60 a 90 minutos",
              "Conversación enfocada en negocio, tesorería y criterios de decisión",
              "Síntesis ejecutiva con hallazgos y siguiente paso recomendado",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-sm leading-7 text-neutral-200">{item}</div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <ScrollToFormButton className="k21-btn-primary px-5 py-3">
              Postular a la revisión
            </ScrollToFormButton>
          </div>
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Mejor encaje"
            title="Esta propuesta genera más valor en empresas con este perfil"
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <article className="k21-card p-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Perfil de mejor encaje
              </h3>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-neutral-300">
                <li>Flujo de caja real y visibilidad operativa</li>
                <li>Horizonte de decisión de 12 a 36 meses</li>
                <li>Capital de trabajo exigente o crecimiento bloqueado</li>
                <li>Voluntad de aprender y decidir con criterio</li>
              </ul>
            </article>

            <article className="k21-card p-6">
              <h3 className="text-xl font-semibold tracking-tight text-white">
                Dónde suele aparecer más valor
              </h3>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-neutral-300">
                <li>Cuando la estructura financiera limita flexibilidad</li>
                <li>Cuando el financiamiento tradicional encarece la operación</li>
                <li>Cuando la tesorería ya es un tema estratégico</li>
                <li>Cuando existe voluntad de construir reserva y criterio de largo plazo</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="mt-16">
          <SectionHeading
            eyebrow="Equipo"
            title="Dos trayectorias complementarias para trabajar con empresas reales"
            description="La propuesta combina experiencia en planificación financiera, lectura ejecutiva, estrategia comercial y trabajo directo con empresas en procesos de decisión e implementación."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {TEAM_MEMBERS.map((member) => (
              <article key={member.name} className="k21-card p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <PlaceholderPortrait
                    name={member.name}
                    initials={member.initials}
                    src={member.photoSrc}
                  />

                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-white">
                      {member.name} · {member.company}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-neutral-200">{member.headline}</p>
                    <p className="mt-4 text-sm leading-7 text-neutral-300">{member.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 scroll-mt-24" id="postulacion-section">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <SectionHeading
                eyebrow="Conversación inicial"
                title="Si esto hace sentido, conversemos."
                description="La forma de partir es una Revisión Estratégica de Tesorería para entender contexto, necesidad y posibilidad real de implementación."
              />

              <div className="mt-8 space-y-4">
                {[
                  {
                    label: "Punto de partida",
                    value: "Revisión Estratégica de Tesorería",
                  },
                  {
                    label: "Qué incluye",
                    value: "Sesión ejecutiva de 60 a 90 minutos",
                  },
                  {
                    label: "Resultado",
                    value: "Síntesis ejecutiva con hallazgos y recomendación",
                  },
                ].map((item) => (
                  <div key={item.label} className="k21-card p-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      {item.label}
                    </div>
                    <div className="mt-2 text-sm leading-7 text-neutral-200">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="k21-card p-6">
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  Qué evaluamos en esa conversación
                </h3>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-neutral-300">
                  <li>Contexto financiero y operativo</li>
                  <li>Necesidad real de tesorería o planificación</li>
                  <li>Criterios de decisión y factibilidad de implementación</li>
                  <li>Casos de uso aplicables en la empresa</li>
                  <li>Posible siguiente fase de diseño o implementación</li>
                </ul>
              </div>

              <TreasuryReviewForm />
            </div>
          </div>
        </section>
      </div>

      <PartnershipFooter />
    </main>
  );
}
