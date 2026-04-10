import type { Metadata } from "next";
import Image from "next/image";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { SectionHeading } from "@/app/tesoreria-kapa21-biterva/_components/PartnershipPageChrome";

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

const whyNow = [
  {
    title: "Bitcoin ya entró en la conversación financiera seria",
    body:
      "Cada vez más personas y empresas lo entienden como reserva, colateral y herramienta de decisión financiera. La infraestructura para operarlo con criterio todavía es escasa.",
  },
  {
    title: "La liquidez tradicional sigue castigando flexibilidad",
    body:
      "Pymes, patrimonios y empresas conviven con deuda cara, procesos lentos y estructuras rígidas. Kapa21 entra precisamente donde esa fricción ya pesa en la operación.",
  },
  {
    title: "Latam abre espacio para infraestructura, no solo intercambio",
    body:
      "Entre el exchange y la consultoría tradicional existe un espacio claro para una capa que conecte ahorro, tesorería, liquidez y acompañamiento de alto contexto.",
  },
  {
    title: "La ventaja está en construir antes de la siguiente ola",
    body:
      "La oportunidad está en montar estructura legal, tecnológica, comercial y de marca antes de que la siguiente fase de adopción haga más caro construirla.",
  },
] as const;

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

function MetricCard({
  label,
  value,
  hint,
  featured = false,
  className = "",
}: {
  label: string;
  value: string;
  hint?: string;
  featured?: boolean;
  className?: string;
}) {
  return (
    <article
      className={`k21-card relative h-full overflow-hidden p-5 ${
        featured
          ? "border-[#F7931A]/25 bg-[linear-gradient(180deg,rgba(247,147,26,0.14),rgba(255,255,255,0.03))]"
          : "bg-white/[0.02]"
      } ${className}`}
    >
      {featured && (
        <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(247,147,26,0.16),rgba(247,147,26,0))]" />
      )}
      <div className="relative">
        <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{label}</div>
        <div className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</div>
        {hint && <p className="mt-3 text-sm leading-6 text-neutral-400">{hint}</p>}
      </div>
    </article>
  );
}

function CopyCard({
  title,
  body,
  eyebrow,
  accent = false,
  className = "",
}: {
  title: string;
  body: string;
  eyebrow?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <article
      className={`k21-card relative h-full overflow-hidden p-6 ${
        accent
          ? "border-[#F7931A]/20 bg-[linear-gradient(180deg,rgba(247,147,26,0.08),rgba(255,255,255,0.03))]"
          : "bg-white/[0.02]"
      } ${className}`}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(247,147,26,0.14),rgba(247,147,26,0))]" />
      )}
      <div className="relative">
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">{eyebrow}</div>
        )}
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-neutral-300">{body}</p>
      </div>
    </article>
  );
}

function FundUseCard({
  amount,
  label,
  share,
}: {
  amount: string;
  label: string;
  share: number;
}) {
  return (
    <article className="k21-card relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(247,147,26,0.1),rgba(247,147,26,0))]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="text-2xl font-semibold tracking-tight text-white">{amount}</div>
          <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-neutral-400">
            {share}%
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-neutral-300">{label}</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-[#F7931A]" style={{ width: `${share}%` }} />
        </div>
      </div>
    </article>
  );
}

function DocumentCard({
  index,
  title,
  body,
  status,
  availability,
  className = "",
}: {
  index: number;
  title: string;
  body: string;
  status: string;
  availability: string;
  className?: string;
}) {
  const statusClassName =
    status === "En preparación final"
      ? "border-white/10 bg-white/[0.04] text-neutral-300"
      : status === "Agenda abierta"
        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
        : "border-[#F7931A]/20 bg-[#F7931A]/10 text-[#F7931A]";

  return (
    <article className={`k21-card relative overflow-hidden p-6 ${className}`}>
      <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(247,147,26,0.12),rgba(247,147,26,0))]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            Documento 0{index}
          </div>
          <div
            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${statusClassName}`}
          >
            {status}
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">Preview</div>
            <Image
              src="/logo/kapa21-symbol.svg"
              alt="Símbolo Kapa21"
              width={18}
              height={18}
              className="h-[18px] w-[18px] opacity-30"
            />
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-2 w-3/4 rounded-full bg-white/10" />
            <div className="h-2 w-full rounded-full bg-white/8" />
            <div className="h-2 w-5/6 rounded-full bg-white/8" />
          </div>
        </div>

        <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-neutral-300">{body}</p>
        <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-xs uppercase tracking-[0.18em] text-neutral-500">
          {availability}
        </div>
      </div>
    </article>
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
    <article className="k21-card relative overflow-hidden p-6">
      <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(247,147,26,0.1),rgba(247,147,26,0))]" />
      <div className="relative">
        <div className="text-3xl leading-none text-[#F7931A]">“</div>
        <p className="mt-3 text-sm leading-7 text-neutral-200">{quote}</p>
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="text-base font-semibold text-white">{name}</div>
          <div className="mt-1 text-sm text-neutral-300">
            {company} · {sector}
          </div>
        </div>
      </div>
    </article>
  );
}

function PlaceholderArtwork({
  label,
  title,
  note,
  aspectClassName,
  variant,
}: {
  label: string;
  title: string;
  note: string;
  aspectClassName: string;
  variant: "portrait" | "book";
}) {
  return (
    <div
      className={`relative overflow-hidden ${aspectClassName} rounded-[1.75rem] border border-dashed border-white/12 bg-[linear-gradient(180deg,rgba(247,147,26,0.06),rgba(255,255,255,0.02))] p-6`}
    >
      <div className="absolute -right-12 top-8 h-32 w-32 rounded-full bg-[#F7931A]/6 blur-3xl" />
      <div className="absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-white/[0.03] blur-3xl" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex w-fit rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-neutral-400">
            {label}
          </div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            Preparado para reemplazo
          </div>
        </div>

        <div className="mt-8 flex flex-1 items-center justify-center">
          {variant === "book" ? (
            <div className="relative h-[17rem] w-[12.25rem] rounded-[1.65rem] border border-white/12 bg-[linear-gradient(180deg,rgba(247,147,26,0.14),rgba(10,10,10,0.92))] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <div className="absolute inset-3 rounded-[1.35rem] border border-white/10" />
              <div className="absolute left-5 top-5 text-[10px] uppercase tracking-[0.28em] text-white/60">
                Book cover
              </div>
              <Image
                src="/brand/k21-mark-white.svg"
                alt="Marca Kapa21"
                width={84}
                height={84}
                className="absolute right-4 top-1/2 h-[72px] w-[72px] -translate-y-1/2 opacity-[0.06]"
              />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="h-px bg-white/15" />
                <div className="mt-4 text-base font-medium tracking-tight text-white/90">
                  Book cover slot
                </div>
              </div>
            </div>
          ) : (
            <div className="relative h-[19rem] w-full max-w-[17rem] overflow-hidden rounded-[1.75rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(10,10,10,0.92))] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
              <div className="absolute inset-3 rounded-[1.45rem] border border-white/10" />
              <div className="absolute left-1/2 top-[24%] h-[72px] w-[72px] -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.05]" />
              <div className="absolute bottom-9 left-1/2 h-[7.5rem] w-[9.5rem] -translate-x-1/2 rounded-t-[999px] border border-white/10 bg-white/[0.035]" />
              <div className="absolute bottom-5 left-5 text-[10px] uppercase tracking-[0.28em] text-white/60">
                Founder portrait
              </div>
              <Image
                src="/brand/k21-mark-white.svg"
                alt="Marca Kapa21"
                width={84}
                height={84}
                className="absolute right-4 top-4 h-12 w-12 opacity-[0.06]"
              />
            </div>
          )}
        </div>

        <div className="mt-8 space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Asset final pendiente
          </div>
          <div className="text-2xl font-semibold tracking-tight text-white">{title}</div>
          <p className="max-w-sm text-sm leading-6 text-neutral-400">{note}</p>
        </div>
      </div>
    </div>
  );
}

export default function FriendsAndFamilyPage() {
  return (
    <main className={PAGE_BACKGROUND}>
      <LandingHeader />

      <div className="mx-auto max-w-6xl px-6 pb-16">
        <section className="relative pb-16 pt-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(247,147,26,0.08),rgba(255,255,255,0.04)_45%,rgba(255,255,255,0)_100%)] px-6 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.28)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-[#F7931A]/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-white/[0.05] blur-3xl" />
            <Image
              src="/brand/k21-mark-white.svg"
              alt="Marca Kapa21"
              width={420}
              height={420}
              className="pointer-events-none absolute -right-20 top-8 hidden h-auto w-[18rem] opacity-[0.04] lg:block"
            />

            <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-full border border-[#F7931A]/20 bg-[#F7931A]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#F7931A]">
                    Private round · Friends &amp; Family
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                    Por invitación
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <Image
                      src="/logo/kapa21-symbol.svg"
                      alt="Símbolo Kapa21"
                      width={28}
                      height={28}
                      className="h-7 w-7"
                    />
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
                    Ronda privada Kapa21
                  </div>
                </div>

                <h1 className="mt-7 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.7rem] lg:leading-[1.02]">
                  La oportunidad privada para construir la capa financiera sobre Bitcoin que falta.
                </h1>

                <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-300">
                  {KAPA21_CORE_STATEMENT}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="k21-badge">Ronda privada, por invitación</div>
                  <div className="k21-badge">SAFE</div>
                  <div className="k21-badge">Desde US$3.000</div>
                  <div className="k21-badge">Infraestructura financiera sobre Bitcoin</div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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

                <div className="mt-4 text-sm text-neutral-400">
                  <a
                    href="#documents"
                    className="hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Ver estructura, documentos y siguiente paso →
                  </a>
                </div>

                <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    Lectura rápida
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-300">
                    Una síntesis de tesis, modelo, validación temprana y estructura de una ronda
                    privada para una etapa de construcción con foco.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 md:grid-cols-3">
                  {valuePillars.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        {item.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-neutral-300">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside>
                <div className="k21-card relative overflow-hidden border-[#F7931A]/15 bg-black/40 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
                  <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(247,147,26,0.2),rgba(247,147,26,0))]" />

                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                          Resumen de ronda
                        </div>
                        <div className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                          US$50.000
                        </div>
                        <p className="mt-3 max-w-md text-sm leading-7 text-neutral-300">
                          Tramo 1 para instalar estructura, software, validación comercial y ritmo
                          operativo en una fase donde cada decisión todavía define la base.
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
                        <Image
                          src="/logo/kapa21-symbol.svg"
                          alt="Símbolo Kapa21"
                          width={52}
                          height={52}
                          className="h-[52px] w-[52px]"
                        />
                      </div>
                    </div>

                    <div className="mt-8 rounded-[1.5rem] border border-[#F7931A]/20 bg-[#F7931A]/10 p-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-[#F7931A]">
                        Tramo 2 opcional
                      </div>
                      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                        Hasta US$100.000 total
                      </div>
                      <p className="mt-2 text-sm leading-6 text-neutral-200">
                        Extensión prevista para profundizar distribución, producto y demanda una
                        vez validado el arranque del tramo inicial.
                      </p>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <MetricCard
                        label="Valorización tramo 1"
                        value="US$1M"
                        featured
                        className="min-h-[150px]"
                      />
                      <MetricCard
                        label="Valorización tramo 2"
                        value="US$2M"
                        className="min-h-[150px]"
                      />
                      <MetricCard label="Ticket visible" value="Desde US$3.000" />
                      <MetricCard label="Instrumento" value="SAFE" hint="Ronda privada, por invitación." />
                    </div>

                    <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        Tesis de fondo
                      </div>
                      <p className="mt-3 text-sm leading-7 text-neutral-200">
                        Entre el ahorro en Bitcoin, la tesorería empresarial y la liquidez
                        respaldada en BTC existe un espacio donde producto, estructura y
                        acompañamiento siguen siendo escasos. Kapa21 se está construyendo para
                        ocupar ese lugar.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <div className="k21-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(247,147,26,0.12),rgba(247,147,26,0))]" />
              <div className="relative">
                <SectionHeading
                  eyebrow="Resumen de la ronda"
                  title="Una ronda privada, acotada y diseñada para instalar la base correcta."
                  description="El tramo 1 busca dejar montada la capacidad mínima necesaria para operar, vender, validar clientes y consolidar una narrativa comercial clara."
                />

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {roundSummary.slice(0, 2).map((item) => (
                    <MetricCard
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      hint={item.hint}
                      featured
                      className="min-h-[180px]"
                    />
                  ))}
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    Estructura comercial
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-300">
                    Ronda Friends & Family para capital cercano, con ticket visible desde US$3.000
                    y una conversación directa para quienes quieran entender la oportunidad con más
                    profundidad.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {roundSummary.slice(2).map((item, index) => (
                <MetricCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  hint={item.hint}
                  featured={index === 0}
                  className="min-h-[170px]"
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20">
          <SectionHeading
            eyebrow="Por qué ahora"
            title="Porque la demanda financiera ya existe y la infraestructura todavía se está ordenando."
            description="La oportunidad surge de una combinación de madurez de Bitcoin, necesidad financiera concreta y escasez de producto bien diseñado."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {whyNow.map((item, index) => (
              <CopyCard
                key={item.title}
                title={item.title}
                body={item.body}
                eyebrow={`Ahora 0${index + 1}`}
                accent={index === 0}
              />
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="k21-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_center,rgba(247,147,26,0.14),transparent_70%)]" />
              <Image
                src="/brand/k21-mark-white.svg"
                alt="Marca Kapa21"
                width={220}
                height={220}
                className="pointer-events-none absolute bottom-0 right-0 hidden h-auto w-36 opacity-[0.05] sm:block"
              />
              <div className="relative">
                <SectionHeading
                  eyebrow="Qué es Kapa21"
                  title="Infraestructura financiera sobre Bitcoin, diseñada para operar con más criterio."
                  description="Kapa21 parte desde problemas financieros reales: ahorro, tesorería, liquidez y flexibilidad de decisión."
                />

                <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
                  <p className="max-w-3xl text-lg leading-8 text-neutral-200">
                    {KAPA21_CORE_STATEMENT}
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {["Ahorro", "Tesorería", "Liquidez"].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm font-medium text-neutral-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {valuePillars.map((item, index) => (
                <CopyCard
                  key={item.title}
                  title={item.title}
                  body={item.body}
                  eyebrow={`Pilar 0${index + 1}`}
                  accent={index === 0}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20">
          <SectionHeading
            eyebrow="A quién sirve"
            title="Tres segmentos, una misma tesis estructural."
            description="La misma infraestructura se aplica a tres segmentos con distinta profundidad comercial y operativa."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {segments.map((item, index) => (
              <CopyCard
                key={item.title}
                title={item.title}
                body={item.body}
                eyebrow={`Segmento 0${index + 1}`}
                accent={index === 1}
              />
            ))}
          </div>
        </section>

        <section className="mt-20">
          <SectionHeading
            eyebrow="Cómo gana dinero Kapa21"
            title="Un negocio con ingresos transaccionales, recurrentes y de alto contacto."
            description="La monetización combina operación, liquidez, suscripción y servicios ejecutivos dentro de una misma tesis."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {revenueStreams.map((item, index) => (
              <CopyCard
                key={item.title}
                title={item.title}
                body={item.body}
                eyebrow={`Ingreso 0${index + 1}`}
                accent={index === 0 || index === 2}
              />
            ))}
          </div>
        </section>

        <section className="mt-20">
          <div className="k21-card overflow-hidden p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(247,147,26,0.1),rgba(255,255,255,0.03))] p-6">
                <SectionHeading
                  eyebrow="En qué se diferencia"
                  title="Kapa21 integra producto, criterio financiero y conversación de alto contexto."
                  description="La diferenciación está en unir tesis, software, acompañamiento y lectura financiera en una misma experiencia."
                />

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      Ejecución
                    </div>
                    <div className="mt-2 text-sm leading-6 text-neutral-300">
                      Operación eficiente, con poco contexto estratégico.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      Advisory
                    </div>
                    <div className="mt-2 text-sm leading-6 text-neutral-300">
                      Criterio útil, sin infraestructura propia ni capa operativa.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#F7931A]/20 bg-[#F7931A]/10 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-[#F7931A]">
                      Kapa21
                    </div>
                    <div className="mt-2 text-sm leading-6 text-neutral-200">
                      Producto, criterio y acompañamiento en una sola arquitectura.
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {differentiators.map((item, index) => (
                  <CopyCard
                    key={item.title}
                    title={item.title}
                    body={item.body}
                    eyebrow={`Diferencial 0${index + 1}`}
                    accent={index === 0 || index === 3}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="k21-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(247,147,26,0.14),rgba(247,147,26,0))]" />
              <div className="relative">
                <SectionHeading
                  eyebrow="Validación temprana"
                  title="Lo que ya estamos viendo en clientes reales."
                  description="Los primeros casos muestran que Bitcoin puede funcionar como ahorro y como colateral con impacto directo en caja, flexibilidad y costo de financiamiento."
                />

                <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    Validación inicial
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-300">
                    Son casos iniciales y acotados, pero ya muestran el tipo de problema que Kapa21
                    puede resolver cuando Bitcoin entra como herramienta financiera.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
        </section>

        <section className="mt-20">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="k21-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(247,147,26,0.12),rgba(247,147,26,0))]" />
              <div className="relative">
                <SectionHeading
                  eyebrow="Uso de fondos"
                  title="El tramo 1 está pensado para dejar operativo el esqueleto completo."
                  description="Los US$50.000 iniciales se distribuyen en seis frentes que combinan estructura, software, demanda y la capacidad del founder para ejecutar de cerca."
                />

                <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-black/25 p-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                        Capital asignado en tramo 1
                      </div>
                      <div className="mt-3 text-4xl font-semibold tracking-tight text-white">
                        US$50.000
                      </div>
                    </div>
                    <div className="rounded-full border border-[#F7931A]/20 bg-[#F7931A]/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[#F7931A]">
                      6 frentes de ejecución
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {fundUse.map((item) => (
                    <FundUseCard
                      key={item.label}
                      amount={item.amount}
                      label={item.label}
                      share={item.share}
                    />
                  ))}
                </div>
              </div>
            </div>

            <aside className="k21-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(247,147,26,0.16),rgba(247,147,26,0))]" />
              <div className="relative">
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                  Lectura rápida
                </div>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  Primero capacidad real, después expansión.
                </h3>
                <p className="mt-4 text-sm leading-7 text-neutral-300">
                  La secuencia es deliberada: habilitación societaria y regulatoria, software listo
                  para operar, una base comercial inicial y presencia de marca suficiente para
                  activar demanda y aprender con clientes reales.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      Base legal + administrativa
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">26%</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      Producto + operación
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">24%</div>
                  </div>
                  <div className="rounded-2xl border border-[#F7931A]/20 bg-[#F7931A]/10 p-4 sm:col-span-2">
                    <div className="text-xs uppercase tracking-[0.2em] text-[#F7931A]">
                      Marca + demanda
                    </div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      36%
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-200">
                      La mayor asignación va a posicionamiento, rediseño comercial y activación de
                      demanda, porque la distribución acelera el aprendizaje real de mercado.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-2">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      Founder en ejecución
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">10%</div>
                    <p className="mt-2 text-sm leading-6 text-neutral-300">
                      Dedicación operativa inicial para cerrar el loop entre tesis, mercado, oferta
                      y producto.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-20">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="k21-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(247,147,26,0.12),rgba(247,147,26,0))]" />
              <div className="relative">
                <SectionHeading
                  eyebrow="La visión"
                  title="Que Bitcoin funcione como infraestructura financiera cotidiana."
                  description="La visión de Kapa21 es empujar una arquitectura más simple, más flexible y más alineada con el largo plazo para ahorro, tesorería y acceso a liquidez."
                />

                <div className="mt-8 space-y-4 text-sm leading-7 text-neutral-300">
                  <p>
                    La tesis del founder es que Bitcoin puede reordenar cómo personas y empresas
                    ahorran, protegen caja, leen balance y toman decisiones con más libertad.
                  </p>
                  <p>
                    Esa visión conecta la dimensión financiera, educativa y cultural de Kapa21, y
                    abre espacio para una marca que vende comprensión, estructura y criterio además
                    de acceso.
                  </p>
                </div>
              </div>
            </div>

            {/* Replace with final production book cover when the asset is ready. */}
            <PlaceholderArtwork
              label="Book cover"
              title="Portada del libro del founder"
              note="Espacio reservado para reemplazar luego por la imagen de portada. Puede convivir con una cita o una breve bajada editorial."
              aspectClassName="min-h-[340px]"
              variant="book"
            />
          </div>
        </section>

        <section className="mt-20">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            {/* Replace with final founder portrait when the asset is ready. */}
            <PlaceholderArtwork
              label="Founder portrait"
              title="Foto del founder"
              note="Espacio preparado para reemplazar luego por retrato oficial del founder, manteniendo el encuadre vertical de esta tarjeta."
              aspectClassName="min-h-[360px]"
              variant="portrait"
            />

            <div className="k21-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(247,147,26,0.12),rgba(247,147,26,0))]" />
              <div className="relative">
                <SectionHeading
                  eyebrow="Founder in the loop"
                  title="Founder-led en tesis, producto, ventas y narrativa."
                  description="La etapa de Kapa21 exige conversación directa con mercado, iteración rápida y presencia del founder donde se construye criterio."
                />

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="k21-badge">Tesis</div>
                  <div className="k21-badge">Producto</div>
                  <div className="k21-badge">Ventas</div>
                  <div className="k21-badge">Narrativa</div>
                </div>

                <div className="mt-8 rounded-[1.5rem] border border-[#F7931A]/20 bg-[#F7931A]/10 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#F7931A]">
                    Founder note
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-200">
                    Esta ronda busca capital paciente y cercano para una fase que combina diseño de
                    oferta, aprendizaje comercial, despliegue operativo y fortalecimiento de la
                    tesis pública de Kapa21.
                  </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {founderLoop.map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-2xl border p-5 ${
                        index === 0
                          ? "border-[#F7931A]/20 bg-[linear-gradient(180deg,rgba(247,147,26,0.1),rgba(255,255,255,0.03))] sm:col-span-2"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-[0.22em] text-[#F7931A]">
                        0{index + 1}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-neutral-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 scroll-mt-24" id="documents">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="k21-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(247,147,26,0.14),rgba(247,147,26,0))]" />
              <div className="relative">
                <SectionHeading
                  eyebrow="Documentos"
                  title="Documentos pensados para un flujo real de ronda privada."
                  description="La información se comparte de forma gradual y con contexto: primero la tesis, luego la estructura, después los detalles que hacen sentido para cada conversación."
                />

                <div className="mt-8 space-y-3">
                  {[
                    "SAFE",
                    "Resumen de la ronda",
                    "Uso de fondos",
                    "Preguntas frecuentes",
                    "Conversación directa con founder",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-neutral-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    Criterio de envío
                  </div>
                  <p className="mt-3 text-sm leading-7 text-neutral-300">
                    El material acompaña conversaciones privadas y se abre con criterio. La idea es
                    dar contexto suficiente para evaluar la oportunidad sin convertir la ronda en un
                    data room prematuro.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {documents.map((item, index) => (
                <DocumentCard
                  key={item.title}
                  index={index + 1}
                  title={item.title}
                  body={item.body}
                  status={item.status}
                  availability={item.availability}
                  className={index === documents.length - 1 ? "md:col-span-2" : ""}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20" id="final-cta">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(247,147,26,0.12),rgba(255,255,255,0.03)_40%,rgba(255,255,255,0)_100%)]">
            <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-[#F7931A]/12 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/[0.04] blur-3xl" />

            <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <div className="inline-flex rounded-full border border-[#F7931A]/20 bg-[#F7931A]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#F7931A]">
                  Conversación privada
                </div>
                <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Si quieres evaluar esta ronda Friends &amp; Family, el siguiente paso es simple.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-300">
                  Solicitar acceso, agendar una conversación o escribir directamente. La ronda es
                  privada, por invitación, y está pensada para personas cercanas a la tesis y al
                  tipo de construcción que Kapa21 quiere hacer.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {["Acceso", "Conversación", "Contacto directo"].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-sm font-medium text-neutral-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="k21-card border-white/10 bg-black/35 p-5 sm:p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Punto de entrada
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
                  Elegir el modo de entrada a la ronda
                </div>
                <div className="mt-6 space-y-4">
                  <a
                    href={MAILTO_URL}
                    className="k21-btn-primary flex w-full justify-center px-5 py-3"
                  >
                    Solicitar acceso
                  </a>
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="k21-btn-secondary flex w-full justify-center px-5 py-3"
                  >
                    Agendar conversación
                  </a>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="k21-btn-secondary flex w-full justify-center px-5 py-3"
                  >
                    Escribir directamente
                  </a>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                    Nota
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-300">
                    La conversación puede partir por email, agenda o mensaje directo. Después de
                    eso, compartimos el material que haga sentido para seguir avanzando.
                  </p>
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
