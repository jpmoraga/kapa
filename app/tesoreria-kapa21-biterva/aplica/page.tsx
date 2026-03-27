import type { Metadata } from "next";
import Image from "next/image";
import {
  PARTNERSHIP_PAGE_BACKGROUND,
  PARTNERSHIP_SITE_URL,
  PartnershipFooter,
  PartnershipHeader,
} from "../_components/PartnershipPageChrome";
import { ScrollToFormButton } from "../_components/ScrollToFormButton";
import { TreasuryReviewForm } from "../_components/TreasuryReviewForm";

const PAGE_PATH = "/tesoreria-kapa21-biterva/aplica";
const PAGE_TITLE = "Bitcoin Treasury Assessment | Aplica | Kapa21 x Biterva";
const PAGE_DESCRIPTION =
  "Diagnóstico gratuito para empresas con problemas de flujo de caja, costos financieros o capital mal asignado.";

const PROBLEM_SIGNALS = [
  "Tiene capital atrapado en inventarios o activos improductivos",
  "Depende de financiamiento caro",
  "Pierde oportunidades por falta de liquidez",
  "No tiene estrategia financiera de largo plazo",
] as const;

const TARGET_COMPANIES = [
  "Inventarios obsoletos o activos improductivos",
  "Necesidades de flexibles y baratas de liquidez",
  "Actividades desafiantes de COMEX",
] as const;

const SESSION_OUTCOMES = [
  "Mapeamos el flujo de caja real",
  "Identificamos fugas de valor",
  "Cuantificamos costos ocultos",
  "Detectamos oportunidades concretas",
] as const;

const DIFFERENTIAL_POINTS = [
  "¿Dónde está la liquidez atrapada?",
  "¿Dónde emergen costos ocultos?",
  "¿Qué oportunidades se vislumbran?",
] as const;

const REPORT_ITEMS = [
  "Cuánto dinero estás perdiendo hoy",
  "Dónde está atrapada tu liquidez",
  "Qué puedes hacer inmediatamente",
  "Un roadmap para construir una tesorería basada en Bitcoin",
] as const;

const TEAM_MEMBERS = [
  {
    name: "Juan Pablo Moraga",
    company: "KAPA21",
    title: "CEO · Profesor · Autor de Bitcoin, un imperativo moral",
    description:
      "Especialista en planificación financiera y estrategia empresarial. Traduce Bitcoin a decisiones concretas de tesorería, directorio y creación de valor en empresas.",
    photoSrc: "/team/juan-pablo-moraga.png",
  },
  {
    name: "Gabriel Amorocho",
    company: "Biterva",
    title: "CEO - Consultor Empresarial B2B - Mentor Bitcoin",
    description:
      "Consultor en empresas e implementaciones tecnológicas en B2B. Identifica oportunidades e implementa estrategias de preservación de valor alineadas con Bitcoin.",
    photoSrc: "/team/gabriel-amorocho.png",
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

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-7 text-neutral-200 sm:text-base">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#F7931A]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function TesoreriaKapa21BitervaAplicaPage() {
  return (
    <main className={PARTNERSHIP_PAGE_BACKGROUND}>
      <PartnershipHeader
        ctaLabel="Aplica ahora (5 cupos disponibles)"
        showServicesLink={false}
      />

      <div className="mx-auto max-w-6xl px-6 pb-16">
        <section className="grid gap-8 pb-12 pt-6 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
          <div className="max-w-3xl pt-1 lg:pt-6">
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-[2.35rem] sm:leading-[1.12] lg:text-[2.8rem] lg:leading-[1.08]">
              Transforma la rigidez financiera de tu empresa incorporando Bitcoin en tu tesorería
            </h1>

            <div className="mt-6 max-w-2xl text-lg leading-8 text-neutral-100 sm:text-[1.35rem] sm:leading-8">
              <p>Evalúa tus capacidades para crear una tesorería robusta con Bitcoin.</p>
              <p className="mt-2">
                Entiende rápidamente dónde estás perdiendo dinero y cómo construir una tesorería
                estable.
              </p>
            </div>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              Te ofrecemos un diagnóstico gratuito pensado para empresas con problemas de flujo de
              caja, costos financieros o capital mal asignado.
            </p>

            <div className="mt-10 space-y-3">
              <ScrollToFormButton className="k21-btn-primary px-5 py-3">
                Aplica ahora (5 cupos disponibles)
              </ScrollToFormButton>
              <p className="text-sm leading-6 text-neutral-400">
                Diagnóstico 100% gratuito – sin compromiso
              </p>
            </div>
          </div>

          <div className="lg:sticky lg:top-6">
            <TreasuryReviewForm />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <article className="k21-card h-full p-6 sm:p-7">
            <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Las decisiones financieras mal estructuradas no siempre generan crisis inmediatas,
              pero SI erosionan valor con el tiempo.
            </h2>

            <p className="mt-6 text-base leading-7 text-neutral-300 sm:text-lg">
              Si tu empresa hoy:
            </p>

            <div className="mt-6">
              <BulletList items={PROBLEM_SIGNALS} />
            </div>

            <p className="mt-6 text-base leading-7 text-neutral-200 sm:text-lg">
              Entonces estás perdiendo dinero… aunque no lo veas.
            </p>
            <p className="mt-3 text-base leading-7 text-neutral-300 sm:text-lg">
              El problema es estructural: estás operando dentro de un sistema que destruye valor
              con el tiempo.
            </p>
          </article>

          <article className="k21-card h-full p-6 sm:p-7">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              ¿A quién está dirigido este Bitcoin Treasury Assessment?
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-300 sm:text-lg">
              Este es un ejercicio financiero pensado para empresas que enfrentan retos de
              operación en tesorería. Con:
            </p>

            <div className="mt-7">
              <BulletList items={TARGET_COMPANIES} />
            </div>

            <div className="mt-8 space-y-3">
              <ScrollToFormButton className="k21-btn-primary w-full px-5 py-3 sm:w-auto">
                Aplica ahora (5 cupos disponibles)
              </ScrollToFormButton>
              <p className="text-sm leading-6 text-neutral-400">
                Diagnóstico 100% gratuito – sin compromiso
              </p>
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="k21-card h-full p-6 sm:p-7">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              ¿Qué vamos a hacer?
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-300 sm:text-lg">
              Exploramos las oportunidades de maximización de valor en tesorerías corporativas.
            </p>

            <div className="mt-7">
              <BulletList items={SESSION_OUTCOMES} />
            </div>
          </article>

          <article className="k21-card h-full p-6 sm:p-7">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              ¿Qué hace diferente este assessment?
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-300 sm:text-lg">
              Ponemos en perspectiva la protección del valor de tu empresa, evaluando cómo una
              estrategia de tesorería en Bitcoin puede preservar y fortalecer tu capital en el
              tiempo.
            </p>

            <div className="mt-7">
              <BulletList items={DIFFERENTIAL_POINTS} />
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
          <article className="k21-card h-full p-6 sm:p-7">
            <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Te llevas un informe claro y accionable: Nuestro Bitcoin Treasury Assessment Report
              que incluye:
            </h2>

            <div className="mt-6">
              <BulletList items={REPORT_ITEMS} />
            </div>
          </article>

          <article className="k21-card h-full p-6 sm:p-7">
            <ul className="space-y-3 text-sm leading-7 text-neutral-200 sm:text-base">
              <li className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#F7931A]" />
                <span>Aplicas (toma 2 minutos)</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#F7931A]" />
                <span>Evaluamos tu caso</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#F7931A]" />
                <span>Agendamos la sesión</span>
              </li>
            </ul>

            <p className="mt-6 text-base leading-7 text-neutral-300 sm:text-lg">
              Solo 5 empresas para garantizar profundidad. SIN COSTO.
            </p>

            <div className="mt-8 space-y-3">
              <ScrollToFormButton className="k21-btn-primary w-full px-5 py-3 sm:w-auto">
                Aplica ahora (5 cupos disponibles)
              </ScrollToFormButton>
              <p className="text-sm leading-6 text-neutral-400">
                Diagnóstico 100% gratuito – sin compromiso
              </p>
            </div>
          </article>
        </section>

        <section className="mt-6">
          <article className="k21-card p-6 sm:p-7">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              ¿Quién está detrás del assessment?
            </h2>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {TEAM_MEMBERS.map((member) => (
                <div
                  key={member.name}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                      <Image
                        src={member.photoSrc}
                        alt={member.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold tracking-tight text-white">
                        {member.name} · {member.company}
                      </h3>
                      <p className="mt-2 text-sm font-medium leading-6 text-neutral-200">
                        {member.title}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-neutral-300">{member.description}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-base leading-7 text-neutral-200 sm:text-lg">
              Trabajaremos directamente contigo. Sin intermediarios. Sin teoría innecesaria.
            </p>
          </article>
        </section>
      </div>

      <PartnershipFooter />
    </main>
  );
}
