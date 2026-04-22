import Link from "next/link";
import AdminModuleCard from "../_components/AdminModuleCard";
import AdminPageHeader from "../_components/AdminPageHeader";
import { getAdminHubSummary } from "@/lib/adminHub";

function formatSnapshotAt(value: string | null) {
  if (!value) return "Sin snapshot persistido";
  return new Date(value).toLocaleString("es-CL");
}

export default async function AdminTreasuryPage() {
  const summary = await getAdminHubSummary();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AdminPageHeader
        eyebrow="Admin / Tesorería"
        title="Tesorería"
        description="Acceso consolidado a las vistas admin existentes de tesorería. Esta fase no modifica balances, no agrega nuevas operaciones y no amplía la lógica contable heredada."
        actions={
          <Link href="/admin" className="k21-btn-secondary px-3 py-2 text-sm">
            Volver al dashboard
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Movimientos pendientes</div>
          <div className="mt-2 text-3xl font-semibold text-white">{summary.pendingMovements}</div>
          <div className="mt-2 text-sm text-neutral-400">Lectura directa sobre `TreasuryMovement.status = PENDING`.</div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Movimientos processing</div>
          <div className="mt-2 text-3xl font-semibold text-white">{summary.processingMovements}</div>
          <div className="mt-2 text-sm text-neutral-400">Lectura directa sobre `TreasuryMovement.status = PROCESSING`.</div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Último snapshot</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {formatSnapshotAt(summary.latestSystemSnapshotAt)}
          </div>
          <div className="mt-2 text-sm text-neutral-400">Último snapshot persistido de system wallet.</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
        Las vistas de tesorería reutilizadas en esta fase siguen siendo heredadas. No se amplió la
        lógica de aprobación ni se agregaron acciones nuevas que modifiquen patrimonio.
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminModuleCard
          href="/admin/overview"
          title="Overview de tesorería"
          description="Snapshot del system wallet, resumen de fees y actividad reciente."
          status="Disponible"
          meta="Vista existente reutilizada dentro del nuevo entrypoint admin."
        />

        <AdminModuleCard
          href="/admin/ops"
          title="Operaciones"
          description="Seguimiento operativo de movimientos y pendientes heredados."
          status="Heredado"
          meta="Mantiene compatibilidad con la vista actual, con advertencias visibles sobre sus límites."
        />
      </div>
    </div>
  );
}
