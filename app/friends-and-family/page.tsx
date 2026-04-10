import type { Metadata } from "next";
import Image from "next/image";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

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
  "min-h-screen text-neutral-100 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(247,147,26,0.14),transparent_45%),radial-gradient(900px_circle_at_80%_20%,rgba(255,255,255,0.08),transparent_42%),linear-gradient(to_bottom,rgba(11,12,15,1),rgba(5,5,7,1))]";
const KAPA21_CORE_STATEMENT =
  "Kapa21 construye infraestructura financiera sobre Bitcoin para personas, pymes y empresas que quieren ahorrar mejor, ordenar su tesorería y acceder a liquidez con una lógica más simple, más flexible, más sólida y más alineada con el largo plazo.";

const roundSummary: Array<{
  label: string;
  value: string;
  hint?: string;
}> = [
  {
    label: "Tramo 1",
    value: "US$50.000",
    hint: "Capital de arranque para dejar montada la base operativa, comercial y societaria.",
  },
  {
    label: "Tramo 2 opcional",
    value: "Hasta US$100.000 total",
    hint: "Capital adicional para profundizar distribución, producto y tracción si el tramo inicial se completa.",
  },
  {
    label: "Valorización tramo 1",
    value: "US$1M",
    hint: "Entrada temprana para una fase de construcción y validación comercial.",
  },
  {
    label: "Valorización tramo 2",
    value: "US$2M",
    hint: "Escalón siguiente una vez instalada la base de ejecución.",
  },
  {
    label: "Ticket visible",
    value: "Desde US$3.000",
    hint: "Umbral comercial para una ronda Friends & Family por invitación.",
  },
  {
    label: "Instrumento",
    value: "SAFE",
    hint: "Estructura simple para una ronda privada de etapa temprana.",
  },
];

const valuePillars = [
  {
    title: "Ahorro con estructura",
    body:
      "Bitcoin como tecnología de ahorro de largo plazo, con una experiencia simple de compra, venta y lectura de posición.",
  },
  {
    title: "Tesorería sobre Bitcoin",
    body:
      "Una capa para ordenar caja, reservas y exposición con lógica financiera y una lectura más clara del balance.",
  },
  {
    title: "Liquidez con colateral BTC",
    body:
      "Acceso a crédito respaldado en Bitcoin para quienes necesitan flexibilidad sin desarmar una posición de ahorro o reserva.",
  },
] as const;

const segments = [
  {
    title: "Personas",
    body:
      "Kapa21 propone Bitcoin como tecnología de ahorro para personas, con una experiencia simple de compra y venta, y también con acceso a crédito respaldado en Bitcoin.",
  },
  {
    title: "Pymes y microempresas",
    body:
      "Kapa21 ayuda a usar Bitcoin como herramienta de tesorería y colateral, con una capa de asesoría liviana por suscripción.",
  },
  {
    title: "Grandes empresas y alto patrimonio",
    body:
      "Kapa21 opera como capa de alto contacto: charlas, formación ejecutiva, diagnósticos de balance, acompañamiento estratégico y agente OTC.",
  },
] as const;

const revenueStreams = [
  {
    title: "Compra y venta para personas",
    body: "Margen transaccional sobre una experiencia simple de compra, venta y lectura de posición.",
  },
  {
    title: "Liquidez respaldada en Bitcoin",
    body: "Originación, estructuración y administración de crédito con colateral BTC.",
  },
  {
    title: "Suscripción de tesorería para pymes",
    body: "Acompañamiento recurrente para usar Bitcoin como herramienta de caja, reserva y colateral.",
  },
  {
    title: "Servicios de alto contacto",
    body:
      "Charlas, formación ejecutiva, diagnósticos estratégicos y acompañamiento OTC para empresas y patrimonios.",
  },
] as const;

const differentiators = [
  {
    title: "Producto con criterio financiero",
    body:
      "Kapa21 traduce Bitcoin a decisiones de ahorro, tesorería y liquidez que hacen sentido para personas y empresas reales.",
  },
  {
    title: "Tesis del founder convertida en infraestructura",
    body:
      "La visión del founder se expresa en producto, procesos, software y conversación comercial con una sola lógica.",
  },
  {
    title: "Modelo multisegmento",
    body:
      "La misma infraestructura sirve a personas, pymes y empresas, con niveles distintos de ticket, contacto y profundidad.",
  },
  {
    title: "Simplicidad, flexibilidad y solidez",
    body:
      "La propuesta combina interfaz, acompañamiento y estructura para que Bitcoin funcione como herramienta financiera útil.",
  },
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

const founderLoop = [
  "La tesis, el producto y la conversación comercial avanzan en una misma línea de decisión.",
  "El founder participa directamente en fundraising, alianzas, ventas y articulación de marca.",
  "El aprendizaje de mercado vuelve rápido a oferta, software, pricing y posicionamiento.",
] as const;

const validationCases = [
  {
    quote:
      "Partí usando ahorro mensual desde la caja para construir posición. Eso me ha permitido reemplazar parte del factoring por financiamiento respaldado en Bitcoin, con más flexibilidad y mejor costo para la operación.",
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

// Wire final round materials here when document links or attachments are ready to share.
const documents = [
  {
    title: "SAFE",
    body: "Instrumento de la ronda Friends & Family con valorización por tramo y lógica de acceso.",
    status: "Acceso privado",
    availability: "Se comparte en conversación.",
  },
  {
    title: "Resumen de la ronda",
    body: "Síntesis de tesis, estructura del levantamiento, uso previsto del capital y secuencia de ejecución.",
    status: "Disponible por solicitud",
    availability: "Se comparte en conversación.",
  },
  {
    title: "Uso de fondos",
    body: "Desglose del tramo 1, prioridades operativas y foco de despliegue en producto, estructura y demanda.",
    status: "Disponible para revisión",
    availability: "Acceso por solicitud.",
  },
  {
    title: "Preguntas frecuentes",
    body: "Respuestas breves sobre estructura, timing, foco comercial, validación inicial y siguientes hitos.",
    status: "Disponible por solicitud",
    availability: "Se comparte en conversación.",
  },
  {
    title: "Conversación directa con founder",
    body: "Espacio para revisar tesis, oportunidad, clientes tempranos, ejecución y encaje de la ronda.",
    status: "Agenda abierta",
    availability: "Coordinación directa.",
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

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
        {title}
      </h2>
      {description && <p className="mt-3 text-sm leading-7 text-neutral-200">{description}</p>}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`border-t border-white/12 pt-3 ${className}`}>
      <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{label}</div>
      <div className="mt-2 text-lg font-semibold tracking-tight text-white">{value}</div>
      {hint && <p className="mt-2 text-sm leading-6 text-neutral-300">{hint}</p>}
    </div>
  );
}

function ValidationCaseCard({
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
    <article className="rounded-2xl border border-white/12 bg-white/[0.04] p-5 shadow-[0_16px_42px_rgba(0,0,0,0.18)]">
      <div className="text-2xl leading-none text-[#F7931A]">“</div>
      <p className="mt-3 text-sm leading-7 text-neutral-100">{quote}</p>
      <div className="mt-5 border-t border-white/12 pt-4">
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="mt-1 text-sm text-neutral-300">
          {company} · {sector}
        </div>
      </div>
    </article>
  );
}

function FundUseRow({
  amount,
  label,
  share,
}: {
  amount: string;
  label: string;
  share: number;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-semibold text-white">{amount}</div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{share}%</div>
      </div>
      <p className="mt-2 text-sm leading-6 text-neutral-200">{label}</p>
    </div>
  );
}

function DocumentRow({
  title,
  body,
  status,
  availability,
}: {
  title: string;
  body: string;
  status: string;
  availability: string;
}) {
  const statusClassName =
    status === "Agenda abierta"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
      : status === "Acceso privado"
        ? "border-[#F7931A]/25 bg-[#F7931A]/10 text-[#FFD29E]"
        : "border-white/12 bg-white/[0.04] text-neutral-200";

  return (
    <div className="flex flex-col gap-3 border-b border-white/12 px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{title}</div>
        <p className="mt-1 text-sm leading-6 text-neutral-200">{body}</p>
        <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-neutral-400">
          {availability}
        </div>
      </div>
      <div
        className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClassName}`}
      >
        {status}
      </div>
    </div>
  );
}

function AssetPlaceholder({
  label,
  variant,
  className,
}: {
  label: string;
  variant: "portrait" | "book";
  className: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-dashed border-white/12 bg-white/[0.035] ${className}`}
    >
      <div className="absolute inset-2 rounded-[0.9rem] border border-white/12" />
      {variant === "portrait" ? (
        <>
          <div className="absolute left-1/2 top-[24%] h-9 w-9 -translate-x-1/2 rounded-full border border-white/12 bg-white/[0.06]" />
          <div className="absolute bottom-4 left-1/2 h-14 w-[4.5rem] -translate-x-1/2 rounded-t-[999px] border border-white/12 bg-white/[0.04]" />
        </>
      ) : (
        <Image
          src="/brand/k21-mark-white.svg"
          alt="Marca Kapa21"
          width={44}
          height={44}
          className="absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 opacity-[0.05]"
        />
      )}
      <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.24em] text-white/70">
        {label}
      </div>
    </div>
  );
}

export default function FriendsAndFamilyPage() {
  return (
    <main className={PAGE_BACKGROUND}>
      <LandingHeader />

      <div className="mx-auto max-w-6xl px-6 pb-14">
        <section className="scroll-mt-28 pb-8 pt-4" id="oportunidad">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-[#F7931A]/25 bg-[#F7931A]/12 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#F9B662]">
                  Friends &amp; Family
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                  Ronda privada Kapa21
                </div>
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.9rem]">
                La ronda privada para construir Kapa21.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-200">
                Infraestructura financiera sobre Bitcoin para ahorro, tesorería y liquidez.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={MAILTO_URL}
                  className="k21-btn-primary px-5 py-3 shadow-[0_14px_34px_rgba(247,147,26,0.22)]"
                >
                  Solicitar acceso
                </a>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="k21-btn-secondary px-5 py-3"
                >
                  Agendar conversación
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="k21-btn-secondary border-white/12 bg-white/[0.04] px-5 py-3 text-neutral-100 hover:bg-white/[0.08]"
                >
                  WhatsApp
                </a>
              </div>

              <p className="mt-4 text-sm leading-6 text-neutral-300">
                SAFE · Desde US$3.000 · Por invitación
              </p>
            </div>

            <aside className="k21-card border-white/12 bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                    Resumen de ronda
                  </div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    US$50.000
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-200">
                    Tramo inicial para instalar la base operativa, comercial y societaria.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-3">
                  <Image
                    src="/logo/kapa21-symbol.svg"
                    alt="Símbolo Kapa21"
                    width={36}
                    height={36}
                    className="h-9 w-9"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-x-5 gap-y-1 sm:grid-cols-2">
                <SummaryStat label={roundSummary[1].label} value={roundSummary[1].value} />
                <SummaryStat label={roundSummary[2].label} value={roundSummary[2].value} />
                <SummaryStat label={roundSummary[3].label} value={roundSummary[3].value} />
                <SummaryStat label={roundSummary[4].label} value={roundSummary[4].value} />
              </div>

              <div className="mt-4 border-t border-white/12 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">
                      Instrumento
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">SAFE</div>
                  </div>
                  <div className="text-sm text-neutral-300">Ronda privada, por invitación.</div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <nav className="sticky top-3 z-20 -mx-6 mb-10 px-6" aria-label="Secciones de la página">
          <div className="mx-auto max-w-6xl overflow-x-auto rounded-2xl border border-white/12 bg-neutral-950/85 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex min-w-max items-center gap-2 px-3 py-3">
              <div className="pr-2 text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                Navegación
              </div>
              {[
                { href: "#oportunidad", label: "Oportunidad" },
                { href: "#modelo", label: "Modelo" },
                { href: "#casos", label: "Casos" },
                { href: "#fondos", label: "Fondos" },
                { href: "#founder", label: "Founder" },
                { href: "#documentos", label: "Documentos" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-transparent bg-white/[0.03] px-3 py-2 text-sm text-neutral-200 transition hover:border-white/12 hover:bg-white/[0.09] hover:text-white active:bg-white/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        <section className="mt-12 scroll-mt-28" id="modelo">
          <div className="k21-card border-white/12 bg-white/[0.035] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.2)] sm:p-7">
            <SectionHeader
              eyebrow="Modelo"
              title="Qué es Kapa21."
              description="Infraestructura financiera sobre Bitcoin para personas, pymes y empresas."
            />

            <div className="mt-5 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-sm leading-7 text-neutral-200 sm:text-base">
                  {KAPA21_CORE_STATEMENT}
                </p>
              </div>
              <div className="text-sm leading-7 text-neutral-200">
                Bitcoin ya entró en la conversación financiera seria. Kapa21 se está construyendo
                para resolver el tramo entre ahorro, tesorería y liquidez con una arquitectura más
                simple y de más alto contexto.
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {valuePillars.map((item, index) => (
                <div
                  key={item.title}
                  className={`border-t pt-4 ${
                    index === 0 ? "border-[#F7931A]/40" : "border-white/12"
                  }`}
                >
                  <h3 className="text-lg font-semibold tracking-tight text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-200">{item.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/12 pt-8">
              <SectionHeader
                eyebrow="Mercado y monetización"
                title="Para quién y cómo captura valor."
                description="La misma infraestructura se despliega con distinta profundidad según segmento y necesidad."
              />

              <div className="mt-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                  Segmentos
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {segments.map((item, index) => (
                    <div
                      key={item.title}
                      className={`border-t pt-4 ${
                        index === 0 ? "border-[#F7931A]/40" : "border-white/12"
                      }`}
                    >
                      <div className="text-base font-semibold text-white">{item.title}</div>
                      <p className="mt-2 text-sm leading-6 text-neutral-200">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-white/12 pt-8">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                  Ingresos
                </div>
                <div className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-2">
                  {revenueStreams.map((item) => (
                    <div key={item.title} className="border-t border-white/12 pt-4">
                      <div className="text-base font-semibold text-white">{item.title}</div>
                      <p className="mt-2 text-sm leading-6 text-neutral-200">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 scroll-mt-28" id="casos">
          <div className="k21-card border-white/12 bg-white/[0.035] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.2)] sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <SectionHeader
                  eyebrow="Casos"
                  title="Diferenciación y validación."
                  description="Producto, criterio financiero y clientes tempranos con problemas reales de caja y financiamiento."
                />

                <div className="mt-5 space-y-4">
                  {differentiators.map((item) => (
                    <div key={item.title} className="border-l border-white/12 pl-4">
                      <div className="text-base font-semibold text-white">{item.title}</div>
                      <p className="mt-2 text-sm leading-6 text-neutral-200">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                  Validación temprana
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {validationCases.map((item) => (
                    <ValidationCaseCard
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
          </div>
        </section>

        <section className="mt-12 scroll-mt-28" id="fondos">
          <div className="k21-card border-white/12 bg-white/[0.035] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.2)] sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeader
                eyebrow="Fondos"
                title="Uso del tramo 1."
                description="Distribución sobria para estructura, software, validación comercial y ejecución del founder."
              />
              <div className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-neutral-200">
                US$50.000 total
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {fundUse.map((item) => (
                <FundUseRow
                  key={item.label}
                  amount={item.amount}
                  label={item.label}
                  share={item.share}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 scroll-mt-28" id="founder">
          <div className="k21-card border-white/12 bg-white/[0.035] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.2)] sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <SectionHeader
                  eyebrow="Founder"
                  title="Founder y visión."
                  description="Bitcoin como infraestructura financiera cotidiana."
                />
                <p className="mt-4 text-sm leading-7 text-neutral-200">
                  La tesis del founder es que Bitcoin puede reordenar cómo personas y empresas
                  ahorran, protegen caja y toman decisiones con más libertad.
                </p>
                <div className="mt-5 space-y-3">
                  {founderLoop.map((item) => (
                    <div key={item} className="text-sm leading-6 text-neutral-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Replace with final founder portrait when the asset is ready. */}
                <AssetPlaceholder
                  label="Founder portrait"
                  variant="portrait"
                  className="h-32 w-full"
                />
                {/* Replace with final production book cover when the asset is ready. */}
                <AssetPlaceholder label="Book cover" variant="book" className="h-32 w-full" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 scroll-mt-28" id="documentos">
          <div className="k21-card border-white/12 bg-white/[0.035] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.2)] sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <SectionHeader
                  eyebrow="Documentos"
                  title="Documentos y siguiente paso."
                  description="Material compartido de forma gradual y con contexto, según avance la conversación."
                />

                {/* Replace each row with final links or attachments when documents are ready to share. */}
                <div className="mt-5 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04]">
                  {documents.map((item) => (
                    <DocumentRow
                      key={item.title}
                      title={item.title}
                      body={item.body}
                      status={item.status}
                      availability={item.availability}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                  Siguiente paso
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
                  Solicitar acceso o agendar una conversación.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-200">
                  Email, agenda o WhatsApp. Después compartimos el material que haga sentido para
                  avanzar.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a href={MAILTO_URL} className="k21-btn-primary px-5 py-3">
                    Solicitar acceso
                  </a>
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="k21-btn-secondary px-5 py-3"
                  >
                    Agendar conversación
                  </a>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="k21-btn-secondary px-5 py-3"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </main>
  );
}
