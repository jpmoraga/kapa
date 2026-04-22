import AdminModuleCard from "./_components/AdminModuleCard";
import AdminPageHeader from "./_components/AdminPageHeader";
import { getAdminHubSummary } from "@/lib/adminHub";

function formatTimestamp(value: string | null) {
  if (!value) return "Sin snapshot";
  return new Date(value).toLocaleString("es-CL");
}

function formatBalance(label: string, value: string | null) {
  if (!value) return `${label}: —`;
  return `${label}: ${value}`;
}

export default async function AdminHomePage() {
  const summary = await getAdminHubSummary();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AdminPageHeader
        eyebrow="Admin / Dashboard"
        title="Master admin hub"
        description="Punto de entrada del master admin. Consolida navegación, visibilidad y acceso a los módulos actuales sin introducir operaciones nuevas sobre balances."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Movimientos pendientes</div>
          <div className="mt-2 text-3xl font-semibold text-white">{summary.pendingMovements}</div>
          <div className="mt-2 text-sm text-neutral-400">Lectura directa de tesorería sin cambios operativos.</div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Movimientos processing</div>
          <div className="mt-2 text-3xl font-semibold text-white">{summary.processingMovements}</div>
          <div className="mt-2 text-sm text-neutral-400">Seguimiento de operaciones todavía en curso.</div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Usuarios registrados</div>
          <div className="mt-2 text-3xl font-semibold text-white">{summary.totalUsers}</div>
          <div className="mt-2 text-sm text-neutral-400">Dato solo lectura sobre `User`.</div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Empresas pendientes</div>
          <div className="mt-2 text-3xl font-semibold text-white">{summary.pendingCompanies}</div>
          <div className="mt-2 text-sm text-neutral-400">Cola comercial pendiente de revisión manual.</div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Empresas registradas</div>
          <div className="mt-2 text-3xl font-semibold text-white">{summary.totalCompanies}</div>
          <div className="mt-2 text-sm text-neutral-400">Excluye la empresa técnica `__SYSTEM_WALLET__`.</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <section className="k21-card p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Módulos admin</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Accesos principales</h2>
          <p className="mt-2 text-sm text-neutral-400">
            La estructura queda alineada al modelo futuro del panel admin, con placeholders útiles
            para los módulos que vienen.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <AdminModuleCard
              href="/admin/customers"
              title="Clientes"
              description="Base para listado, detalle y control center por cliente."
              status="Disponible"
              meta="Listado real y vista por cliente en modo solo lectura."
            />
            <AdminModuleCard
              href="/admin/companies"
              title="Empresas"
              description="Alta manual, revisión y aprobación de empresas pyme."
              status="Disponible"
              meta="Lifecycle comercial mínimo operativo, sin tocar treasury."
            />
            <AdminModuleCard
              href="/admin/treasury"
              title="Tesorería"
              description="Entrada consolidada a overview y operaciones heredadas."
              status="Disponible"
              meta="Reutiliza /admin/overview y /admin/ops dentro del nuevo layout."
            />
            <AdminModuleCard
              href="/admin/subscriptions"
              title="Suscripciones"
              description="Estado de suscripción comercial por empresa y notas admin."
              status="Disponible"
              meta="Solo modela y administra estado; no cobra ni toca saldos."
            />
            <AdminModuleCard
              href="/admin/pricing"
              title="Pricing"
              description="Plan base, precedencia explícita y overrides por empresa."
              status="Disponible"
              meta="No recalcula pricing histórico ni modifica treasury."
            />
            <AdminModuleCard
              href="/admin/loans"
              title="Créditos"
              description="Base separada para el futuro módulo admin de créditos."
              status="Base lista"
              meta="Sin cambios sobre el flujo productivo actual."
            />
            <AdminModuleCard
              href="/admin/audit"
              title="Auditoría"
              description="Historial de AdminAction, efectos derivados y resultados."
              status="Disponible"
              meta="Incluye trazabilidad operativa del master admin."
            />
          </div>
        </section>

        <div className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Resumen disponible</div>
            <h2 className="mt-2 text-xl font-semibold text-white">System wallet snapshot</h2>
            <div className="mt-3 text-sm text-neutral-400">
              Último snapshot: {formatTimestamp(summary.latestSystemSnapshotAt)}
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Persistido: {formatTimestamp(summary.latestSystemSnapshotCreatedAt)}
            </div>

            <div className="mt-4 space-y-2 text-sm text-neutral-200">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                {formatBalance("CLP", summary.latestSystemBalances?.CLP ?? null)}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                {formatBalance("BTC", summary.latestSystemBalances?.BTC ?? null)}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                {formatBalance("USDT", summary.latestSystemBalances?.USD ?? null)}
              </div>
            </div>
          </section>

          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Alcance de esta fase</div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-200">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                /admin queda como entrypoint real del master admin.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                Se consolida navegación y layout comunes para módulos actuales y futuros.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                No se agregan acciones nuevas que alteren balances, pricing aplicado o patrimonio.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
