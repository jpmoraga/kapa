import Link from "next/link";
import BackofficePageHeader from "./_components/BackofficePageHeader";
import { getBackofficeSession } from "@/lib/backofficeAuth";
import { getBackofficeNavItems } from "@/lib/backofficePermissions";

export default async function BackofficeHomePage() {
  const session = await getBackofficeSession();
  const items = session ? getBackofficeNavItems(session.user.role) : [];
  const modules = items.filter((item) => item.section !== "home");

  return (
    <div className="mx-auto max-w-[1760px] px-5 py-5 lg:px-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Inicio"
        title="Hub comercial"
        description="Base segura del nuevo backoffice de Kapa21. Desde aquí se separan los futuros módulos de Consulting, Mining y Usuarios sin compartir auth ni namespace con /admin."
      />

      <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        {modules.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="k21-card block border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Módulo</div>
            <div className="mt-2 text-lg font-semibold text-white">{item.title}</div>
            <div className="mt-2 text-sm leading-relaxed text-white/58">{item.description}</div>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <section className="k21-card p-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
            Alcance de esta etapa
          </div>
          <ul className="mt-3 space-y-2.5 text-sm text-white/72">
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
              Login, sesión y logout propios del backoffice.
            </li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
              Guards por rol para Consulting, Mining y Usuarios.
            </li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
              Shell protegida y aislada del admin legado de `/admin`.
            </li>
          </ul>
        </section>

        <section className="k21-card p-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Estado</div>
          <div className="mt-2 text-2xl font-semibold text-white">Casa cerrada</div>
          <p className="mt-2 text-sm leading-relaxed text-white/58">
            La estructura base queda lista para crecer sin tocar el admin viejo ni la auth pública.
          </p>
        </section>
      </div>
    </div>
  );
}
