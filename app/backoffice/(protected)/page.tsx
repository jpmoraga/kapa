import Link from "next/link";
import BackofficePageHeader from "./_components/BackofficePageHeader";
import { getBackofficeSession } from "@/lib/backofficeAuth";
import { getBackofficeNavItems } from "@/lib/backofficePermissions";

export default async function BackofficeHomePage() {
  const session = await getBackofficeSession();
  const items = session ? getBackofficeNavItems(session.user.role) : [];
  const modules = items.filter((item) => item.section !== "home");

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <BackofficePageHeader
        eyebrow="Backoffice / Inicio"
        title="Hub comercial"
        description="Base segura del nuevo backoffice de Kapa21. Desde aquí se separan los futuros módulos de Consulting, Mining y Usuarios sin compartir auth ni namespace con /admin."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {modules.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="k21-card block p-5 transition hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="text-xs uppercase tracking-wide text-white/45">Módulo</div>
            <div className="mt-2 text-xl font-semibold text-white">{item.title}</div>
            <div className="mt-2 text-sm text-white/60">{item.description}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="k21-card p-6">
          <div className="text-xs uppercase tracking-wide text-white/45">
            Alcance de esta etapa
          </div>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              Login, sesión y logout propios del backoffice.
            </li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              Guards por rol para Consulting, Mining y Usuarios.
            </li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              Shell protegida y aislada del admin legado de `/admin`.
            </li>
          </ul>
        </section>

        <section className="k21-card p-6">
          <div className="text-xs uppercase tracking-wide text-white/45">Estado</div>
          <div className="mt-2 text-3xl font-semibold text-white">Casa cerrada</div>
          <p className="mt-2 text-sm text-white/60">
            La estructura base queda lista para crecer sin tocar el admin viejo ni la auth pública.
          </p>
        </section>
      </div>
    </div>
  );
}
