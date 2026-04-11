import type { Metadata } from "next";
import Image from "next/image";
import { ParticipationSimulator } from "./_components/ParticipationSimulator";
import { InvestorHeader } from "./_components/InvestorHeader";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kapa21.cl";
const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL ||
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
  "contacto@kapa21.cl";
const MAILTO_URL = `mailto:${CONTACT_EMAIL}?subject=Kapa21%20Friends%20%26%20Family`;
const CALENDLY_URL = "https://calendly.com/contacto-kapa21/30min";
const WHATSAPP_URL =
  "https://wa.me/56971381604?text=Hola%2C%20quiero%20conocer%20la%20oportunidad%20Friends%20%26%20Family%20de%20Kapa21.";
const PAGE_BACKGROUND =
  "min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top_right,rgba(247,147,26,0.16),transparent_24%),radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_20%),linear-gradient(to_bottom,rgba(11,12,15,1),rgba(7,8,11,1))] text-neutral-100";
const KAPA21_CORE_STATEMENT =
  "Kapa21 construye infraestructura financiera sobre Bitcoin para personas, pymes y empresas que quieren ahorrar mejor, ordenar su tesorería y acceder a liquidez con una lógica más simple, más flexible, más sólida y más alineada con el largo plazo.";

const navItems = [
  { href: "#oportunidad", label: "Oportunidad" },
  { href: "#inversion", label: "Inversión" },
  { href: "#mercado", label: "Mercado" },
  { href: "#founder", label: "Founder" },
  { href: "#faq", label: "FAQ" },
] as const;

const roundHighlights = [
  { label: "Tramo 1", value: "US$50.000" },
  { label: "Tramo extendido", value: "Hasta US$100.000" },
  { label: "Valorización tramo 1", value: "US$1M" },
  { label: "Referencia tramo 2", value: "US$1,5M – US$2M" },
  { label: "Ticket mínimo", value: "US$3.000" },
  { label: "Instrumento", value: "SAFE" },
] as const;

const opportunityThemes = [
  {
    title: "Bitcoin como infraestructura financiera",
    body:
      "El punto de partida es simple: usar Bitcoin para ahorro, tesorería y liquidez con una lógica financiera concreta, no como un producto aislado.",
  },
  {
    title: "Un espacio mal resuelto",
    body:
      "Entre exchange, deuda rígida y advisory tradicional hay una franja amplia de necesidad práctica que hoy sigue fragmentada y mal servida.",
  },
  {
    title: "Una capa más flexible y útil",
    body:
      "La oportunidad es construir una capa que combine software, acompañamiento y estructura para tomar mejores decisiones de caja y patrimonio.",
  },
] as const;

const investmentSteps = [
  {
    title: "Acceso privado",
    body: "La ronda Friends & Family se abre por invitación y conversación directa con el founder.",
  },
  {
    title: "SAFE y términos base",
    body:
      "El tramo inicial se estructura vía SAFE, con una lógica simple para una etapa temprana y una valorización inicial de US$1M.",
  },
  {
    title: "Capital para ejecución",
    body:
      "El uso del tramo 1 está diseñado para estructura, regulación, despliegue operativo y activación comercial.",
  },
] as const;

const segments = [
  {
    title: "Personas",
    body:
      "Ahorro sobre Bitcoin con experiencia simple de compra y venta, más acceso a liquidez respaldada en BTC cuando la situación lo pide.",
  },
  {
    title: "Pymes y microempresas",
    body:
      "Tesorería y colateral con una capa de asesoría liviana por suscripción para caja, reservas y acceso a crédito.",
  },
  {
    title: "Empresas y alto patrimonio",
    body:
      "Un frente de alto contacto para formación ejecutiva, diagnósticos estratégicos, acompañamiento y flujo OTC.",
  },
] as const;

const revenueStreams = [
  {
    title: "Compra y venta para personas",
    body: "Margen transaccional sobre una experiencia simple y legible para ahorro y toma de posición.",
  },
  {
    title: "Crédito respaldado en Bitcoin",
    body: "Originación y estructuración de liquidez con colateral BTC para clientes con necesidades reales de caja.",
  },
  {
    title: "Suscripción pyme",
    body: "Acompañamiento recurrente para tesorería, reservas y uso disciplinado de Bitcoin como herramienta financiera.",
  },
  {
    title: "Enterprise, OTC y advisory",
    body: "Servicios de alto contacto que abren relación, validan demanda y capturan tickets más altos desde etapas tempranas.",
  },
] as const;

const revenueSequence = [
  "Primero ingresos de alto contacto, advisory, validación comercial y suscripción pyme, con clientes que ya tienen problemas reales de caja y financiamiento.",
  "Después mayor recurrencia y volumen vía crédito respaldado en Bitcoin y profundidad transaccional.",
] as const;

const fundUse = [
  {
    amount: "US$5.000",
    label: "Estructura societaria, bancaria y administración inicial",
    share: 10,
  },
  {
    amount: "US$8.000",
    label: "Adecuación legal y regulatoria inicial",
    share: 16,
  },
  {
    amount: "US$2.000",
    label: "Prospección comercial y desarrollo de negocio",
    share: 4,
  },
  {
    amount: "US$12.000",
    label: "Infraestructura, hardening y despliegue operativo del software",
    share: 24,
  },
  {
    amount: "US$18.000",
    label: "Marca, rediseño comercial y activación de demanda",
    share: 36,
  },
  {
    amount: "US$5.000",
    label: "Dedicación operativa inicial del founder",
    share: 10,
  },
] as const;

const validationCases = [
  {
    quote:
      "Partimos comprando Bitcoin de a poco todos los meses y al poco tiempo eso me ayudó a reemplazar una parte importante del factoring por financiamiento más flexible y más barato.",
    name: "Felipe Cordova",
    company: "HOREK",
    sector: "Distribución alimentaria B2B",
  },
  {
    quote:
      "En este negocio necesito moverme cuando aparece una oportunidad de compra. Tener financiamiento respaldado en Bitcoin me da una flexibilidad que el crédito tradicional no me entrega, y eso cambia cómo tomo decisiones.",
    name: "Cristobal Galecio",
    company: "Fagacresal",
    sector: "Desarmaduría",
  },
] as const;

const documents = [
  {
    title: "SAFE",
    availability: "Se comparte en conversación.",
    status: "Acceso privado",
  },
  {
    title: "Resumen ejecutivo de la ronda",
    availability: "Disponible por solicitud.",
    status: "Por solicitud",
  },
  {
    title: "Detalle ampliado de uso de fondos",
    availability: "Disponible para revisión.",
    status: "Disponible",
  },
  {
    title: "Preguntas frecuentes",
    availability: "Se comparte en conversación.",
    status: "Por solicitud",
  },
] as const;

const faqItems = [
  {
    question: "¿Cómo se accede a la ronda?",
    answer:
      "El acceso es privado y por invitación. La secuencia es simple: conversación inicial, resolución de dudas y firma del SAFE para quienes decidan avanzar.",
  },
  {
    question: "¿Qué instrumento se está usando?",
    answer:
      "La ronda se estructura vía SAFE (Simple Agreement for Future Equity), un instrumento usado en etapas tempranas para invertir hoy y convertir en equity en una ronda futura bajo términos predefinidos. El tramo inicial considera US$50.000 a US$1M de valorización, con posibilidad de ampliar la ronda en una etapa siguiente.",
  },
  {
    question: "¿Qué debe validar el tramo 1?",
    answer:
      "El objetivo es instalar base societaria y regulatoria, dejar operativo el software, activar demanda y ordenar la primera capa comercial de Kapa21.",
  },
  {
    question: "¿De dónde esperamos los primeros ingresos?",
    answer:
      "Primero desde servicios de alto contacto, advisory, validación comercial y suscripción pyme. Después, con mayor recurrencia vía crédito respaldado en Bitcoin y volumen transaccional.",
  },
] as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Friends & Family | Kapa21",
  description:
    "Oportunidad privada Friends & Family para Kapa21: infraestructura financiera sobre Bitcoin para ahorro, tesorería y liquidez.",
  alternates: {
    canonical: "/friends-and-family",
  },
  openGraph: {
    title: "Friends & Family | Kapa21",
    description:
      "Ronda privada de Kapa21 para construir infraestructura financiera sobre Bitcoin.",
    type: "website",
    url: "/friends-and-family",
    siteName: "Kapa21",
  },
};

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">{eyebrow}</div>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
        {title}
      </h2>
      {description && <p className="mt-4 text-sm leading-7 text-neutral-200">{description}</p>}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.03))] px-4 py-4 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{label}</div>
      <div className="mt-2 text-[1.02rem] font-semibold tracking-tight text-white">{value}</div>
    </div>
  );
}

function StepItem({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <li className="border-t border-white/12 pt-5">
      <div className="inline-flex rounded-full border border-[#F7931A]/25 bg-[#F7931A]/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#F9B662]">
        {step}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-neutral-200">{body}</p>
    </li>
  );
}

function ValidationQuote({
  quote,
  name,
  company,
  sector,
}: {
  quote: string;
  name: string;
  company: string;
  sector: string;
}) {
  return (
    <blockquote className="border-l border-white/12 pl-5">
      <p className="text-sm leading-7 text-neutral-100">{quote}</p>
      <footer className="mt-4 text-sm text-neutral-300">
        <span className="font-semibold text-white">{name}</span>
        <span> · </span>
        <span>{company}</span>
        <span> · </span>
        <span>{sector}</span>
      </footer>
    </blockquote>
  );
}

function FundUseLine({
  amount,
  label,
  share,
}: {
  amount: string;
  label: string;
  share: number;
}) {
  return (
    <div className="grid gap-3 border-b border-white/12 px-5 py-4 last:border-b-0 md:grid-cols-[150px_1fr_auto] md:items-center md:gap-5 md:px-6 md:py-5">
      <div className="text-lg font-semibold tracking-tight text-white">{amount}</div>
      <div className="text-sm leading-6 text-neutral-200">{label}</div>
      <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-neutral-300 md:justify-self-end">
        {share}%
      </div>
    </div>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group border-b border-white/12 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-white sm:px-6">
        <span>{question}</span>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-neutral-400 transition group-open:rotate-45 group-open:text-white">
          +
        </span>
      </summary>
      <div className="px-5 pb-5 text-sm leading-7 text-neutral-200 sm:px-6">{answer}</div>
    </details>
  );
}

function DocumentLine({
  title,
  availability,
  status,
}: {
  title: string;
  availability: string;
  status: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/12 px-5 py-4 last:border-b-0 sm:px-6">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="mt-1 text-sm text-neutral-300">{availability}</div>
      </div>
      <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-neutral-300">
        {status}
      </div>
    </div>
  );
}

function InvestorFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 py-6 text-xs text-neutral-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>© {new Date().getFullYear()} Kapa21</div>
        <div>Contacto: {CONTACT_EMAIL}</div>
      </div>
    </footer>
  );
}

export default function FriendsAndFamilyPage() {
  return (
    <main className={`${PAGE_BACKGROUND} relative`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_15%_15%,rgba(247,147,26,0.18),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.12),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[40rem] h-[70rem] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_34%)]" />

      <InvestorHeader navItems={navItems} whatsappUrl={WHATSAPP_URL} />

      <div className="relative mx-auto max-w-6xl px-6 pb-20">
        <section className="pt-6">
          <div className="relative overflow-hidden rounded-[2.2rem] border border-white/12 bg-[#0b0d11] shadow-[0_32px_100px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0">
              <Image
                src="/friends-and-family/founder.png"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-[72%_18%] opacity-38 grayscale"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,10,13,0.95)_0%,rgba(9,10,13,0.88)_36%,rgba(9,10,13,0.58)_62%,rgba(9,10,13,0.82)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(247,147,26,0.24),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_30%,rgba(0,0,0,0.3)_100%)]" />
            </div>

            <div className="relative px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <div className="max-w-[40rem]">
                <div className="inline-flex rounded-full border border-[#F7931A]/25 bg-[#F7931A]/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[#F9B662]">
                  Ronda privada Kapa21
                </div>

                <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.7rem]">
                  Invertir en la base financiera de Kapa21.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-7 text-neutral-200 sm:text-lg">
                  Infraestructura sobre Bitcoin para ahorro, tesorería y crédito respaldado, con
                  una lógica más simple, más flexible y más alineada con el largo plazo.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href={MAILTO_URL}
                    className="k21-btn-primary px-5 py-3 shadow-[0_16px_38px_rgba(247,147,26,0.25)]"
                  >
                    Solicitar acceso
                  </a>
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="k21-btn-secondary border-white/12 bg-white/[0.04] px-5 py-3 text-neutral-100 hover:bg-white/[0.08]"
                  >
                    Agendar conversación
                  </a>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="k21-btn-secondary border-[#F7931A]/20 bg-[#F7931A]/10 px-5 py-3 text-[#FFD29E] hover:bg-[#F7931A]/14"
                  >
                    WhatsApp
                  </a>
                </div>

                <p className="mt-4 text-sm leading-6 text-neutral-300">
                  Acceso por invitación vía SAFE. También disponible por WhatsApp.
                </p>
              </div>

              <div className="mt-14 rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,12,16,0.62),rgba(9,12,16,0.34))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md sm:p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {roundHighlights.map((item) => (
                    <HeroStat key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="scroll-mt-40 pt-20" id="oportunidad">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div>
              <SectionIntro
                eyebrow="La oportunidad"
                title="Una capa financiera útil sobre Bitcoin."
                description={KAPA21_CORE_STATEMENT}
              />

              <p className="mt-6 max-w-2xl text-sm leading-7 text-neutral-200 sm:text-base">
                Bitcoin ya entró en la conversación financiera seria. La oportunidad no está solo
                en comprar y vender, sino en conectar mejor ahorro, tesorería y liquidez dentro de
                una misma lógica financiera.
              </p>
            </div>

            <div className="space-y-8">
              {opportunityThemes.map((item) => (
                <div key={item.title} className="border-t border-white/12 pt-5">
                  <h3 className="text-lg font-semibold tracking-tight text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-neutral-200">
                    {item.title === "Un espacio mal resuelto"
                      ? "Entre la compra simple de Bitcoin, la deuda tradicional y la asesoría financiera de alto contacto, existe un espacio poco resuelto para personas y empresas que necesitan ahorrar mejor, ordenar caja y acceder a crédito con más flexibilidad."
                      : item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="scroll-mt-40 pt-18 sm:pt-20" id="inversion">
          <div className="rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_72px_rgba(0,0,0,0.22)] sm:p-8 lg:p-10">
            <SectionIntro
              eyebrow="Cómo funciona"
              title="Cómo funciona la inversión."
              description="Una estructura simple para una ronda privada temprana, con secuencia clara entre acceso, instrumento y uso del capital."
            />

            <ol className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-10">
              {investmentSteps.map((item, index) => (
                <StepItem
                  key={item.title}
                  step={`Paso ${index + 1}`}
                  title={item.title}
                  body={item.body}
                />
              ))}
            </ol>
          </div>
        </section>

        <section className="scroll-mt-40 pt-16 sm:pt-18 lg:pt-20" id="simulador">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_72px_rgba(0,0,0,0.22)] sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(247,147,26,0.08),transparent_24%),radial-gradient(circle_at_82%_72%,rgba(255,255,255,0.05),transparent_28%)]" />
            <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14">
              <div>
                <SectionIntro
                  eyebrow="Simulador"
                  title="Escenario simple de participación."
                  description="Una referencia rápida para entender qué representa entrar en esta etapa: monto, participación estimada y peso relativo dentro del tramo inicial."
                />

                <p className="mt-6 max-w-xl text-sm leading-7 text-neutral-200">
                  El objetivo es hacer legible la ronda y dar una intuición clara de entrada,
                  usando como referencia el cap base del tramo 1.
                </p>
              </div>

              <div className="relative">
                <ParticipationSimulator />
              </div>
            </div>
          </div>
        </section>

        <section className="scroll-mt-40 pt-16 sm:pt-18 lg:pt-20" id="mercado">
          <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
            <div>
              <SectionIntro
                eyebrow="Mercado"
                title="Tres capas de oportunidad."
                description="La oportunidad de Kapa21 se organiza en tres capas de mercado: personas, pymes y empresas que necesitan ahorrar mejor, ordenar caja y acceder a liquidez con más flexibilidad."
              />

              <div className="mt-8">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                  Capas de oportunidad
                </div>
              </div>

              <div className="mt-4 divide-y divide-white/12 border-y border-white/12">
                {segments.map((item) => (
                  <div key={item.title} className="py-5 first:pt-5 last:pb-5">
                    <h3 className="text-lg font-semibold tracking-tight text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-neutral-200">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_72px_rgba(0,0,0,0.18)] sm:p-7">
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                Revenue model
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Un modelo que parte por alto contacto y luego gana recurrencia.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-200">
                El modelo parte por relaciones de alto contacto y evoluciona hacia mayor
                recurrencia, volumen y profundidad de producto.
              </p>

              <div className="mt-7 divide-y divide-white/12 border-y border-white/12">
                {revenueStreams.map((item) => (
                  <div key={item.title} className="py-5 first:pt-5 last:pb-5">
                    <div className="text-base font-semibold text-white">{item.title}</div>
                    <p className="mt-2 text-sm leading-7 text-neutral-200">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                  Secuencia esperada
                </div>
                <div className="mt-4 space-y-3">
                  {revenueSequence.map((item) => (
                    <p key={item} className="text-sm leading-7 text-neutral-200">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 sm:p-7">
            <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                  Validación temprana
                </div>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  Señales iniciales en clientes reales.
                </h3>
                <p className="mt-4 text-sm leading-7 text-neutral-200">
                  Los primeros casos muestran un patrón concreto: ahorro disciplinado, uso de
                  Bitcoin como colateral y búsqueda de financiamiento más flexible que el sistema
                  tradicional.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {validationCases.map((item) => (
                  <ValidationQuote
                    key={`${item.name}-${item.company}`}
                    quote={item.quote}
                    name={item.name}
                    company={item.company}
                    sector={item.sector}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pt-20">
          <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:gap-14">
            <div>
              <SectionIntro
                eyebrow="Uso de fondos"
                title="Uso del tramo 1."
                description="Una asignación pensada para instalar base societaria y regulatoria, dejar operativo el software y abrir la primera capa comercial."
              />

              <div className="mt-6 inline-flex rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-neutral-200">
                US$50.000 total
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] shadow-[0_24px_72px_rgba(0,0,0,0.18)]">
              {fundUse.map((item) => (
                <FundUseLine
                  key={item.label}
                  amount={item.amount}
                  label={item.label}
                  share={item.share}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="scroll-mt-40 pt-20" id="founder">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.03] shadow-[0_24px_72px_rgba(0,0,0,0.18)]">
              <Image
                src="/friends-and-family/founder.png"
                alt="Founder de Kapa21"
                fill
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="object-cover object-[center_18%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
            </div>

            <div>
              <SectionIntro
                eyebrow="Visión del founder"
                title="De promesas a tesoro."
                description="Kapa21 nace de una convicción concreta: que Bitcoin sirve para rediseñar cómo personas y empresas ahorran, protegen caja y toman decisiones financieras con mayor libertad."
              />

              <p className="mt-6 max-w-2xl text-sm leading-7 text-neutral-200 sm:text-base">
                La visión es pasar de un mundo financiero basado en promesas a uno basado en
                tesoro: reserva, caja y crédito construidos sobre Bitcoin para personas, pymes y
                empresas que necesitan herramientas más simples, más útiles y más alineadas con el
                largo plazo.
              </p>

              <div className="mt-8 grid gap-8 md:grid-cols-[1fr_220px] md:items-start">
                <div className="space-y-4">
                  <div className="border-l border-white/12 pl-4 text-sm leading-7 text-neutral-200">
                    Kapa21 busca construir productos y servicios sobre Bitcoin para ahorro,
                    tesorería y crédito respaldado, con una arquitectura que una software,
                    acompañamiento y criterio financiero en una sola capa.
                  </div>
                  <div className="border-l border-white/12 pl-4 text-sm leading-7 text-neutral-200">
                    El libro funciona como una expresión de esa tesis: una forma de ordenar el
                    marco intelectual de Kapa21 y traducirlo a producto, servicio y conversación
                    comercial.
                  </div>
                  <div className="border-l border-white/12 pl-4 text-sm leading-7 text-neutral-200">
                    Desde ahí, el rol del founder no es solo operar la ronda, sino articular una
                    visión amplia sobre cómo Bitcoin puede convertirse en infraestructura financiera
                    cotidiana.
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/12 bg-white/[0.035] p-3">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-[1.3rem] bg-black/20">
                    <Image
                      src="/friends-and-family/book-cover.png"
                      alt="Portada del libro del founder"
                      fill
                      sizes="220px"
                      className="object-contain p-3"
                    />
                  </div>
                  <div className="mt-3 text-sm leading-6 text-neutral-300">
                    <span className="font-medium text-white">De promesas a tesoro</span> ordena la
                    tesis que luego se traduce en producto, servicios y construcción de marca.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="scroll-mt-40 pt-20" id="faq">
          <div className="rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 shadow-[0_24px_72px_rgba(0,0,0,0.22)] sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:gap-12">
              <div>
                <SectionIntro
                  eyebrow="FAQ"
                  title="Preguntas, documentos y contacto."
                  description="Una salida clara para entender la ronda, revisar materiales y abrir conversación directa."
                />

                <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.14))]">
                  {faqItems.map((item) => (
                    <FaqItem
                      key={item.question}
                      question={item.question}
                      answer={item.answer}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="overflow-hidden rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.14))]">
                  <div className="border-b border-white/12 px-5 py-4 sm:px-6">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                      Documentos
                    </div>
                  </div>
                  {documents.map((item) => (
                    <DocumentLine
                      key={item.title}
                      title={item.title}
                      availability={item.availability}
                      status={item.status}
                    />
                  ))}
                </div>

                <div className="rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.03))] p-6">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                    Contacto
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    Solicitar acceso, revisar materiales o conversar directo.
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-neutral-200">
                    El flujo es simple: conversación inicial, acceso al material relevante y una
                    segunda instancia para profundizar tesis, estructura y plan de ejecución.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <a href={MAILTO_URL} className="k21-btn-primary px-5 py-3">
                      Solicitar acceso
                    </a>
                    <a
                      href={CALENDLY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="k21-btn-secondary border-white/12 bg-white/[0.04] px-5 py-3 text-neutral-100 hover:bg-white/[0.08]"
                    >
                      Agendar conversación
                    </a>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="k21-btn-secondary border-[#F7931A]/20 bg-[#F7931A]/10 px-5 py-3 text-[#FFD29E] hover:bg-[#F7931A]/14"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <InvestorFooter />
      </div>
    </main>
  );
}
