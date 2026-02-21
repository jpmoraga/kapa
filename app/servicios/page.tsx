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
  const calendlyUrl = "https://calendly.com/contacto-kapa21/30min";
  const whatsappUrl =
    "https://wa.me/56971381604?text=Hola%2C%20quiero%20conversar%20sobre%20los%20servicios%20de%20Kapa21.";

  return (
    <main className="min-h-screen text-neutral-100 bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(247,147,26,0.12),transparent_45%),radial-gradient(900px_circle_at_80%_20%,rgba(255,255,255,0.06),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,1))]">
      <LandingHeader />

      <div className="mx-auto max-w-5xl px-6 pb-12">
        <section className="k21-card p-6 sm:p-8">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Servicios</div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Bitcoin como base estratégica.
          </h1>
          <p className="mt-4 text-base text-neutral-300 max-w-3xl">
            Diseño, formación e implementación para organizaciones y patrimonios que quieren ir
            más allá del titular y entender el impacto real de Bitcoin en su estructura financiera.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="k21-btn-secondary px-5 py-2"
            >
              Agendar reunión
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="k21-btn-secondary px-4 py-2 text-sm"
              aria-label="Abrir WhatsApp"
            >
              WhatsApp
            </a>
            <Link
              href="/"
              className="text-sm text-neutral-300 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Conocer Kapa21
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="k21-card p-6">
              <h2 className="text-lg font-semibold text-white">Análisis estratégico</h2>
              <p className="mt-3 text-sm text-neutral-300">
                Impacto macroeconómico, regulación, balance, riesgos y oportunidades estructurales.
              </p>
            </div>
            <div className="k21-card p-6">
              <h2 className="text-lg font-semibold text-white">Diseño financiero</h2>
              <p className="mt-3 text-sm text-neutral-300">
                Política de tesorería, exposición estructurada y planificación patrimonial sobre
                Bitcoin.
              </p>
            </div>
            <div className="k21-card p-6">
              <h2 className="text-lg font-semibold text-white">Arquitectura técnica</h2>
              <p className="mt-3 text-sm text-neutral-300">
                Custodia, esquemas multisig y diseño de seguridad institucional.
              </p>
            </div>
            <div className="k21-card p-6">
              <h2 className="text-lg font-semibold text-white">Formación ejecutiva</h2>
              <p className="mt-3 text-sm text-neutral-300">
                Charlas para directorios, workshops y sesiones estratégicas para equipos
                financieros.
              </p>
            </div>
          </div>
        </section>

        <section className="k21-card mt-10 p-6" aria-labelledby="servicios-audiencia">
          <h2 id="servicios-audiencia" className="text-lg font-semibold text-white">
            A quién acompañamos
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-neutral-300 list-disc pl-5">
            <li>Directorios y equipos de management</li>
            <li>Empresas que evalúan Bitcoin en su balance</li>
            <li>Think tanks e instituciones</li>
            <li>Empresarios con patrimonio relevante</li>
          </ul>
        </section>

        <section className="k21-card mt-10 p-6" aria-labelledby="servicios-metodo">
          <h2 id="servicios-metodo" className="text-lg font-semibold text-white">
            Cómo trabajamos
          </h2>
          <ol className="mt-4 space-y-2 text-sm text-neutral-300 list-decimal pl-5">
            <li>Diagnóstico estratégico</li>
            <li>Diseño estructural</li>
            <li>Implementación técnica</li>
            <li>Acompañamiento continuo</li>
          </ol>
        </section>

        <section className="k21-card mt-10 p-6" aria-labelledby="servicios-libro">
          <h2 id="servicios-libro" className="text-lg font-semibold text-white">
            Referencia
          </h2>
          <p className="mt-3 text-sm text-neutral-300">
            Esta visión se desarrolla en profundidad en el libro{" "}
            <span className="italic">&quot;Bitcoin, un imperativo moral.&quot;</span>
          </p>
        </section>

        <section className="k21-card mt-8 p-6 flex flex-col items-start gap-3">
          <div className="text-lg font-semibold text-white">¿Conversamos?</div>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="k21-btn-secondary px-5 py-2"
          >
            Agendar reunión
          </a>
        </section>

        <LandingFooter />
      </div>
    </main>
  );
}
