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
  "min-h-screen text-neutral-100 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(247,147,26,0.12),transparent_45%),radial-gradient(900px_circle_at_80%_20%,rgba(255,255,255,0.06),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,1))]";
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
    status: "Disponible bajo conversación",
    availability: "Acceso por solicitud.",
  },
  {
    title: "Resumen de la ronda",
    body: "Síntesis de tesis, estructura del levantamiento, uso previsto del capital y secuencia de ejecución.",
    status: "Disponible bajo conversación",
    availability: "Acceso por solicitud.",
  },
  {
    title: "Uso de fondos",
    body: "Desglose del tramo 1, prioridades operativas y foco de despliegue en producto, estructura y demanda.",
    status: "Disponible bajo conversación",
    availability: "Disponible en conversación directa.",
  },
  {
    title: "Preguntas frecuentes",
    body: "Respuestas breves sobre estructura, timing, foco comercial, validación inicial y siguientes hitos.",
    status: "En preparación final",
    availability: "Versión de trabajo.",
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
      <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{eyebrow}</div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
        {title}
      </h2>
      {description && <p className="mt-3 text-sm leading-7 text-neutral-300">{description}</p>}
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
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-white">{value}</div>
      {hint && <p className="mt-2 text-sm leading-6 text-neutral-400">{hint}</p>}
    </div>
  );
}

function TextBlock({
  title,
  body,
  eyebrow,
}: {
  title: string;
  body: string;
  eyebrow?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      {eyebrow && <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{eyebrow}</div>}
      <div className={eyebrow ? "mt-2" : ""}>
        <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-300">{body}</p>
      </div>
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
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-2xl leading-none text-[#F7931A]">“</div>
      <p className="mt-3 text-sm leading-7 text-neutral-200">{quote}</p>
      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="mt-1 text-sm text-neutral-400">
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-semibold text-white">{amount}</div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{share}%</div>
      </div>
      <p className="mt-2 text-sm leading-6 text-neutral-300">{label}</p>
    </div>
  );
}

function DocumentRow({
  title,
  status,
  availability,
}: {
  title: string;
  status: string;
  availability: string;
}) {
  const statusClassName =
    status === "En preparación final"
      ? "text-neutral-300"
      : status === "Agenda abierta"
        ? "text-emerald-200"
        : "text-[#F7931A]";

  return (
    <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500">
          {availability}
        </div>
      </div>
      <div className={`text-xs uppercase tracking-[0.18em] ${statusClassName}`}>{status}</div>
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
      className={`relative overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/[0.02] ${className}`}
    >
      <div className="absolute inset-2 rounded-[0.9rem] border border-white/10" />
      {variant === "portrait" ? (
        <>
          <div className="absolute left-1/2 top-[24%] h-9 w-9 -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.04]" />
          <div className="absolute bottom-4 left-1/2 h-14 w-[4.5rem] -translate-x-1/2 rounded-t-[999px] border border-white/10 bg-white/[0.03]" />
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
      <div className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.24em] text-white/55">
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
        <section className="pb-12 pt-4">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-[#F7931A]/20 bg-[#F7931A]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#F7931A]">
                  Friends &amp; Family
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  Ronda privada Kapa21
                </div>
              </div>

              <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                La oportunidad privada para construir la capa financiera sobre Bitcoin que falta.
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-neutral-300 sm:text-lg">
                {KAPA21_CORE_STATEMENT}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <div className="k21-badge">SAFE</div>
                <div className="k21-badge">Desde US$3.000</div>
                <div className="k21-badge">Por invitación</div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
              </div>

              <p className="mt-4 text-sm leading-6 text-neutral-400">
                Ronda pensada para una fase de construcción con foco: estructura, software,
                distribución y validación comercial.
              </p>
            </div>

            <aside className="k21-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    Resumen de ronda
                  </div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    US$50.000
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-300">
                    Tramo inicial para instalar la base operativa, comercial y societaria de
                    Kapa21.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                  <Image
                    src="/logo/kapa21-symbol.svg"
                    alt="Símbolo Kapa21"
                    width={36}
                    height={36}
                    className="h-9 w-9"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SummaryStat
                  label={roundSummary[1].label}
                  value={roundSummary[1].value}
                  hint={roundSummary[1].hint}
                />
                <SummaryStat
                  label={roundSummary[2].label}
                  value={roundSummary[2].value}
                  hint={roundSummary[2].hint}
                />
                <SummaryStat
                  label={roundSummary[3].label}
                  value={roundSummary[3].value}
                  hint={roundSummary[3].hint}
                />
                <SummaryStat
                  label={roundSummary[4].label}
                  value={roundSummary[4].value}
                  hint={roundSummary[4].hint}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                      Instrumento
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">SAFE</div>
                  </div>
                  <div className="text-sm text-neutral-400">Ronda privada, por invitación.</div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-14">
          <div className="k21-card p-6 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div>
                <SectionHeader
                  eyebrow="Qué es Kapa21"
                  title="Infraestructura financiera sobre Bitcoin."
                  description="Kapa21 parte desde problemas financieros reales: ahorro, tesorería, liquidez y flexibilidad de decisión."
                />
                <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-300 sm:text-base">
                  {KAPA21_CORE_STATEMENT}
                </p>
              </div>

              <div className="space-y-4">
                {valuePillars.map((item, index) => (
                  <div
                    key={item.title}
                    className={`border-l pl-4 ${
                      index === 0 ? "border-[#F7931A]/40" : "border-white/10"
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                      Pilar 0{index + 1}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-neutral-300">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <SectionHeader
            eyebrow="Mercado y modelo"
            title="A quién sirve Kapa21 y cómo captura valor."
            description="La misma infraestructura se despliega con distinta profundidad comercial según segmento y necesidad."
          />

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {segments.map((item, index) => (
              <TextBlock
                key={item.title}
                title={item.title}
                body={item.body}
                eyebrow={`Segmento 0${index + 1}`}
              />
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
              Ingresos
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {revenueStreams.map((item, index) => (
                <TextBlock
                  key={item.title}
                  title={item.title}
                  body={item.body}
                  eyebrow={`Ingreso 0${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="k21-card p-6 sm:p-7">
              <SectionHeader
                eyebrow="Diferenciación"
                title="Producto, criterio financiero y validación inicial."
                description="Kapa21 une tesis, software, acompañamiento y conversación comercial en una misma arquitectura."
              />

              <div className="mt-6 space-y-4">
                {differentiators.map((item, index) => (
                  <div key={item.title} className="border-l border-white/10 pl-4">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                      0{index + 1}
                    </div>
                    <div className="mt-2 text-base font-semibold text-white">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-neutral-300">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="k21-card p-6 sm:p-7">
              <SectionHeader
                eyebrow="Validación temprana"
                title="Lo que ya estamos viendo en clientes reales."
                description="Casos iniciales que muestran a Bitcoin funcionando como ahorro y como colateral con impacto directo en caja y flexibilidad."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-2">
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
        </section>

        <section className="mt-14">
          <div className="k21-card p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeader
                eyebrow="Uso de fondos"
                title="Asignación del tramo 1."
                description="Una distribución sobria para resolver estructura, software, validación comercial y ejecución del founder."
              />
              <div className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-neutral-300">
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

        <section className="mt-14 scroll-mt-24" id="documents">
          <div className="k21-card p-6 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <SectionHeader
                  eyebrow="Founder y visión"
                  title="Bitcoin como infraestructura financiera cotidiana."
                  description="La tesis del founder es que Bitcoin puede reordenar cómo personas y empresas ahorran, protegen caja y toman decisiones con más libertad."
                />

                {/* Replace with final founder portrait when the asset is ready. */}
                <div className="mt-5 flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <AssetPlaceholder
                    label="Founder portrait"
                    variant="portrait"
                    className="h-28 w-24 shrink-0"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">Founder in the loop</div>
                    <p className="mt-2 text-sm leading-6 text-neutral-300">
                      Capital paciente para una fase de diseño de oferta, aprendizaje comercial,
                      despliegue operativo y fortalecimiento de la tesis pública de Kapa21.
                    </p>
                    <div className="mt-3 space-y-2">
                      {founderLoop.map((item) => (
                        <div key={item} className="text-sm leading-6 text-neutral-400">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Replace with final production book cover when the asset is ready. */}
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <AssetPlaceholder
                    label="Book cover"
                    variant="book"
                    className="h-24 w-[5.5rem] shrink-0"
                  />
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                      Libro del founder
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-300">
                      Espacio preparado para integrar la portada final y su relación editorial con
                      la tesis de Kapa21.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    Documentos
                  </div>
                  {/* Replace each row with final links or attachments when documents are ready to share. */}
                  <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                    {documents.map((item) => (
                      <DocumentRow
                        key={item.title}
                        title={item.title}
                        status={item.status}
                        availability={item.availability}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    Conversación privada
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
                    Solicitar acceso o agendar una conversación.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-300">
                    Email, agenda o mensaje directo. Después compartimos el material que haga
                    sentido para avanzar.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
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
                    Escribir directamente
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
