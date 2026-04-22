import Link from "next/link";
import AdminPageHeader from "../_components/AdminPageHeader";
import {
  adminActionStatusOptions,
  adminActionTypeOptions,
  listAdminActions,
} from "@/lib/adminActions";

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL");
}

function badgeClasses(kind: "neutral" | "success" | "warning" | "danger" | "info") {
  if (kind === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (kind === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  if (kind === "danger") return "border-red-500/30 bg-red-500/10 text-red-200";
  if (kind === "info") return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  return "border-white/10 bg-white/[0.04] text-neutral-300";
}

function statusTone(status: string) {
  if (status === "Succeeded") return "success" as const;
  if (status === "Processing" || status === "Pending") return "warning" as const;
  if (status === "Failed") return "danger" as const;
  return "neutral" as const;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = firstString(sp.q) ?? "";
  const type = firstString(sp.type) ?? "all";
  const status = firstString(sp.status) ?? "all";
  const companyId = firstString(sp.companyId) ?? null;
  const rows = await listAdminActions({ q, type, status, companyId, take: 100 });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AdminPageHeader
        eyebrow="Admin / Auditoría"
        title="Admin actions"
        description="Historial operativo del master admin. Cada acción sensible queda registrada con actor, target, resultado e idempotencia."
        actions={
          <Link href="/admin" className="k21-btn-secondary px-3 py-2 text-sm">
            Volver al dashboard
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Filas visibles</div>
          <div className="mt-2 text-3xl font-semibold text-white">{rows.length}</div>
        </div>
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Succeeded</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {rows.filter((row) => row.status === "SUCCEEDED").length}
          </div>
        </div>
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Failed</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {rows.filter((row) => row.status === "FAILED").length}
          </div>
        </div>
      </div>

      <section className="mt-6 k21-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Filtros</div>
            <h2 className="mt-2 text-lg font-semibold text-white">Log de acciones admin</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Esta vista no toca patrimonio. Solo consolida la trazabilidad ya persistida.
            </p>
          </div>

          <form method="get" className="flex w-full max-w-3xl flex-wrap items-end gap-3">
            {companyId ? <input type="hidden" name="companyId" value={companyId} /> : null}
            <div className="min-w-[220px] flex-1">
              <label className="text-xs text-neutral-400">Buscar por actor, empresa o error</label>
              <input
                name="q"
                defaultValue={q}
                placeholder="empresa, actor o código"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="text-xs text-neutral-400">Tipo</label>
              <select
                name="type"
                defaultValue={type}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#101216] px-4 py-3 text-sm text-white outline-none"
              >
                {adminActionTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="text-xs text-neutral-400">Status</label>
              <select
                name="status"
                defaultValue={status}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#101216] px-4 py-3 text-sm text-white outline-none"
              >
                {adminActionStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
              Filtrar
            </button>
            <Link href="/admin/audit" className="k21-btn-secondary px-4 py-3 text-sm">
              Limpiar
            </Link>
          </form>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.id} className="align-top text-neutral-200">
                    <td className="px-4 py-4">
                      <div>{formatDateTime(row.createdAt)}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        fin {formatDateTime(row.completedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-300">{row.actorAdminEmail}</td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{row.typeLabel}</div>
                      <div className="mt-1 text-xs text-neutral-500">{row.reason ?? "Sin reason"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{row.targetCompanyName}</div>
                      <div className="mt-1 text-xs text-neutral-500">{row.targetCompanyId}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] ${badgeClasses(
                          statusTone(row.statusLabel)
                        )}`}
                      >
                        {row.statusLabel}
                      </span>
                      <div className="mt-2 text-xs text-neutral-500">
                        {row.resultSummary ?? row.errorCode ?? row.errorMessage ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/api/admin/actions/${row.id}`}
                          className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
                        >
                          JSON
                        </Link>
                        {row.status !== "SUCCEEDED" && row.status !== "CANCELLED" ? (
                          <form action={`/api/admin/actions/${row.id}/reconcile`} method="post">
                            <input type="hidden" name="returnTo" value={`/admin/audit${companyId ? `?companyId=${companyId}` : ""}`} />
                            <button
                              type="submit"
                              className="inline-flex rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 transition hover:border-amber-400/40 hover:bg-amber-500/15"
                            >
                              Reconciliar
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-500">
                    No hay admin actions para el filtro actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
