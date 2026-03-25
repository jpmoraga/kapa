import type { Metadata } from "next";
import {
  LogoSlot,
  PARTNERSHIP_LOGOS,
  PARTNERSHIP_PAGE_BACKGROUND,
  PARTNERSHIP_SITE_URL,
  PartnershipFooter,
  PartnershipHeader,
  SectionHeading,
} from "../_components/PartnershipPageChrome";
import { ScrollToFormButton } from "../_components/ScrollToFormButton";
import { TreasuryReviewForm } from "../_components/TreasuryReviewForm";

const PAGE_PATH = "/tesoreria-kapa21-biterva/aplica";
const PAGE_TITLE = "Bitcoin Treasury Diagnostic | Aplica | Kapa21 x Biterva";
const PAGE_DESCRIPTION =
  "Landing corta de campaña de Kapa21 x Biterva para postular al Bitcoin Treasury Diagnostic.";

const HERO_BULLETS = [
  "Usan financiamiento: bancos, factoring o crédito",
  "Tienen presión de flujo de caja",
  "Operan con ciclos de 30 a 90 días",
] as const;

const HIDDEN_COSTS = [
  "Dinero atrapado en inventario",
  "Intereses por financiamiento",
  "Devaluación del efectivo",
  "Ciclos de caja ineficientes",
] as const;

const TARGET_COMPANIES = [
  "Dependen de crédito para operar",
  "Tienen inventario o capital inmovilizado",
  "Sufren presión de liquidez",
  "Operan en economías inflacionarias",
] as const;

const SESSION_OUTCOMES = [
  "Mapeamos tu flujo de caja real",
  "Identificamos fugas de valor",
  "Cuantificamos costos ocultos",
  "Detectamos oportunidades concretas",
] as const;

const REPORT_ITEMS = [
  "Puntos críticos de tu tesorería",
  "Estimación de pérdidas financieras",
  "Oportunidades aplicables a tu negocio",
  "Roadmap inicial",
] as const;

const PROCESS_STEPS = [
  "Aplicas al programa",
  "Evaluamos tu perfil",
  "Si eres seleccionado, agendamos sesión",
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
      <PartnershipHeader ctaLabel="Aplicar al diagnóstico" showServicesLink={false} />

      <div className="mx-auto max-w-6xl px-6 pb-16">
        <section className="grid gap-8 pb-12 pt-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="max-w-3xl">
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

            <h1 className="mt-8 text-4xl font-semibold tracking-[0.06em] text-white sm:text-5xl lg:text-6xl">
              BITCOIN TREASURY DIAGNOSTIC
            </h1>

            <p className="mt-5 max-w-2xl text-2xl font-medium tracking-tight text-white sm:text-3xl">
              Recupera el control sobre la liquidez de tu empresa
            </p>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              Estamos seleccionando 5 empresas para realizar un diagnóstico estratégico de
              tesorería.
            </p>

            <div className="mt-6">
              <div className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
                Este proceso está diseñado para empresas que:
              </div>
              <div className="mt-4 grid gap-3">
                {HERO_BULLETS.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-neutral-200"
                  >
                    <span className="mr-3 inline-block h-2.5 w-2.5 rounded-full bg-[#F7931A]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ScrollToFormButton className="k21-btn-primary px-5 py-3">
                Aplicar al diagnóstico
              </ScrollToFormButton>
              <div className="rounded-full border border-[#F7931A]/20 bg-[#F7931A]/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#F7931A]">
                Solo 5 empresas en esta cohorte
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="k21-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#F7931A]">
                    Aplica aquí
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-300">
                    Si tu empresa encaja, podrás avanzar a una sesión privada de 90 a 120 minutos.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.2em] text-neutral-400">
                  Cohorte limitada
                </div>
              </div>
            </div>

            <TreasuryReviewForm />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="k21-card p-6 sm:p-8">
            <SectionHeading
              eyebrow="Problema"
              title="El problema que nadie te dice"
              description="Tu empresa no pierde dinero solo en ventas. Lo pierde en el tiempo:"
            />

            <div className="mt-8">
              <BulletList items={HIDDEN_COSTS} />
            </div>

            <p className="mt-8 max-w-2xl text-base leading-7 text-neutral-300">
              Esto ocurre todos los días. Y la mayoría de empresas no lo mide.
            </p>
          </article>

          <article className="k21-card p-6 sm:p-8">
            <SectionHeading
              eyebrow="Para quién es"
              title="A quién está dirigido"
              description="Empresas donde la tesorería ya afecta margen, liquidez y capacidad de decisión."
            />

            <div className="mt-8">
              <BulletList items={TARGET_COMPANIES} />
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="k21-card p-6 sm:p-8">
            <SectionHeading
              eyebrow="Qué vas a obtener"
              title="Una lectura ejecutiva de tu tesorería real"
              description="En una sesión privada de 90 a 120 minutos trabajamos sobre tu operación y tus restricciones concretas."
            />

            <div className="mt-8">
              <BulletList items={SESSION_OUTCOMES} />
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                Qué hace diferente este diagnóstico
              </div>
              <p className="mt-3 text-sm leading-7 text-neutral-300">
                Es un análisis estratégico de cómo tu empresa gestiona el tiempo financiero. Busca
                hacer visible dónde se inmoviliza liquidez, dónde aparecen costos ocultos y qué
                oportunidades son aplicables a tu negocio.
              </p>
              <p className="mt-3 text-sm leading-7 text-neutral-400">
                Está pensado para decisiones reales de tesorería, no para una conversación general.
              </p>
            </div>
          </article>

          <div className="grid gap-4">
            <article className="k21-card p-6 sm:p-8">
              <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-neutral-500">
                Entregable
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Treasury Stress Report
              </h2>
              <p className="mt-4 text-base leading-7 text-neutral-300">
                Recibirás una síntesis ejecutiva con foco en tesorería, pérdidas financieras y
                oportunidades concretas.
              </p>

              <div className="mt-8">
                <BulletList items={REPORT_ITEMS} />
              </div>
            </article>

            <article className="k21-card p-6 sm:p-8">
              <SectionHeading
                eyebrow="Cómo funciona"
                title="Proceso simple y directo"
              />

              <ol className="mt-8 space-y-4">
                {PROCESS_STEPS.map((step, index) => (
                  <li key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7931A] text-sm font-semibold text-black">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-sm leading-6 text-neutral-200">{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </section>

        <section className="mt-6">
          <article className="k21-card p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <SectionHeading
                  eyebrow="Cupos limitados"
                  title="Solo trabajaremos con 5 empresas en esta cohorte"
                  description="La liquidez y la tesorería suelen esconder problemas que muchas empresas todavía no están viendo. Si quieres medirlos con criterio ejecutivo, esta es la instancia para hacerlo."
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  CTA principal
                </div>
                <p className="mt-3 text-lg leading-8 text-neutral-200">Aplica aquí</p>
                <p className="mt-3 text-sm leading-7 text-neutral-300">
                  Revisaremos tu perfil y, si hay encaje, coordinaremos la sesión privada.
                </p>
                <div className="mt-6">
                  <ScrollToFormButton className="k21-btn-primary w-full px-5 py-3 sm:w-auto">
                    Aplicar al diagnóstico
                  </ScrollToFormButton>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>

      <PartnershipFooter />
    </main>
  );
}
