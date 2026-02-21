import type { Metadata } from "next";
import Link from "next/link";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL ||
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
  "contacto@kapa21.cl";

export const metadata: Metadata = {
  title: "Servicios | Kapa21",
  description:
    "Infraestructura y asesoría estratégica sobre Bitcoin en Chile para personas, familias e instituciones.",
};

export default function ServiciosPage() {
  const mailto = `mailto:${CONTACT_EMAIL}`;

  return (
    <main className="min-h-screen text-neutral-100 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(247,147,26,0.12),transparent_45%),radial-gradient(900px_circle_at_80%_20%,rgba(255,255,255,0.06),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,1))]">
      <LandingHeader />

      <div className="mx-auto max-w-5xl px-6 pb-12">
        <section className="k21-card p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Servicios</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Infraestructura y asesoría estratégica sobre Bitcoin en Chile
          </h1>
          <p className="mt-3 text-base text-neutral-300 max-w-2xl">
            Para personas, familias e instituciones que quieren entender, proteger y estructurar
            su patrimonio en la era digital.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={mailto} className="k21-btn-secondary px-5 py-2">
              Agendar reunión
            </a>
            <Link
              href="/"
              className="text-sm text-neutral-300 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Conocer Kapa21
            </Link>
          </div>
        </section>

        <div className="mt-8 grid gap-4">
          <section className="k21-card p-6" aria-labelledby="servicios-asesoria">
            <h2 id="servicios-asesoria" className="text-lg font-semibold text-white">
              Asesoría patrimonial en Bitcoin
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc pl-5">
              <li>Estrategia de exposición y acumulación responsable</li>
              <li>Diseño de custodia (individual o multisig)</li>
              <li>Planificación de herencia y continuidad familiar</li>
              <li>Coordinación con abogados y contadores (cuando aplique)</li>
              <li>Compras de alto volumen con ejecución estructurada</li>
            </ul>
          </section>

          <section className="k21-card p-6" aria-labelledby="servicios-balance">
            <h2 id="servicios-balance" className="text-lg font-semibold text-white">
              Bitcoin en el balance
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc pl-5">
              <li>Política de tesorería en BTC</li>
              <li>Gobernanza, custodia y controles</li>
              <li>Implementación operativa y reporting</li>
              <li>Capacitación de equipos financieros</li>
              <li>Créditos colateralizados (cuando corresponda)</li>
            </ul>
          </section>

          <section className="k21-card p-6" aria-labelledby="servicios-educacion">
            <h2 id="servicios-educacion" className="text-lg font-semibold text-white">
              Charlas, talleres y formación
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc pl-5">
              <li>Directorios y equipos ejecutivos</li>
              <li>Fondos y gestores</li>
              <li>Familias empresarias</li>
              <li>Colegios y universidades</li>
              <li>Gremios e instituciones</li>
            </ul>
            <p className="mt-3 text-xs text-neutral-500">
              Formatos: charla, taller práctico, seminario cerrado.
            </p>
          </section>

          <section className="k21-card p-6" aria-labelledby="servicios-otc">
            <h2 id="servicios-otc" className="text-lg font-semibold text-white">
              Ejecución OTC y operaciones de alto volumen
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc pl-5">
              <li>Intermediación con mesas OTC locales (cuando aplique)</li>
              <li>Ejecución escalonada para minimizar impacto</li>
              <li>Acompañamiento de custodia posterior</li>
              <li>Estandarización operativa y compliance básico</li>
            </ul>
          </section>

          <section className="k21-card p-6" aria-labelledby="servicios-seguridad">
            <h2 id="servicios-seguridad" className="text-lg font-semibold text-white">
              Autocustodia y seguridad
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc pl-5">
              <li>Taller de autocustodia (hardware wallets)</li>
              <li>Buenas prácticas operativas</li>
              <li>Esquemas de respaldo y recuperación</li>
              <li>Capacitación familiar/equipos</li>
            </ul>
          </section>
        </div>

        <section className="k21-card mt-8 p-6" aria-labelledby="servicios-sobre">
          <h2 id="servicios-sobre" className="text-lg font-semibold text-white">
            Sobre Juan Pablo Moraga
          </h2>
          <p className="mt-3 text-sm text-neutral-300 max-w-2xl">
            Autor de &quot;Bitcoin, un imperativo moral&quot;. Consultor y expositor en estrategia
            patrimonial y adopción de Bitcoin en Chile.
          </p>
        </section>

        <section className="k21-card mt-8 p-6" aria-labelledby="servicios-faq">
          <h2 id="servicios-faq" className="text-lg font-semibold text-white">
            Preguntas frecuentes
          </h2>
          <div className="mt-4 space-y-4 text-sm text-neutral-300">
            <div>
              <div className="font-medium text-neutral-100">¿Esto es solo para empresas?</div>
              <div>No. También para personas, familias e instituciones.</div>
            </div>
            <div>
              <div className="font-medium text-neutral-100">
                ¿Puedo pedir una charla para mi colegio/universidad?
              </div>
              <div>Sí, se adaptan formatos y contenidos.</div>
            </div>
            <div>
              <div className="font-medium text-neutral-100">¿Hacen ejecución OTC?</div>
              <div>Sí, para montos relevantes y según disponibilidad.</div>
            </div>
          </div>
        </section>

        <section className="k21-card mt-8 p-6 flex flex-col items-start gap-3">
          <div className="text-lg font-semibold text-white">¿Conversamos?</div>
          <a href={mailto} className="k21-btn-secondary px-5 py-2">
            Agendar reunión
          </a>
        </section>

        <LandingFooter />
      </div>
    </main>
  );
}
