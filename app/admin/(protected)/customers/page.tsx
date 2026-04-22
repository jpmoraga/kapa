import Link from "next/link";
import AdminPageHeader from "../_components/AdminPageHeader";
import {
  adminCustomerFilters,
  listAdminCustomers,
  type AdminCustomerFilter,
} from "@/lib/adminCustomers";

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildCustomersHref(filter: AdminCustomerFilter, q: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/customers?${query}` : "/admin/customers";
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL");
}

function formatClp(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} CLP`;
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function formatUsd(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} USD`;
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatBtc(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} BTC`;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

function sourceLabel(value: "movement" | "loan" | null) {
  if (value === "movement") return "Movimiento";
  if (value === "loan") return "Crédito";
  return "—";
}

function badgeClasses(kind: "neutral" | "success" | "warning") {
  if (kind === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (kind === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-white/10 bg-white/[0.04] text-neutral-300";
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = firstString(sp.q) ?? "";
  const filter = firstString(sp.filter) ?? "all";
  const data = await listAdminCustomers({ filter, q });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AdminPageHeader
        eyebrow="Admin / Clientes"
        title="Clientes"
        description="Vista read-only de la base actual de clientes. La entidad central es la empresa (`Company`), porque ahí viven los saldos vigentes, los movimientos y los créditos."
        actions={
          <Link href="/admin" className="k21-btn-secondary px-3 py-2 text-sm">
            Volver al dashboard
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section className="k21-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Filtros</div>
              <h2 className="mt-2 text-lg font-semibold text-white">Listado consolidado</h2>
              <p className="mt-2 text-sm text-neutral-400">
                Los saldos se leen directo desde <code>TreasuryAccount</code>. No se recalculan desde
                movimientos.
              </p>
            </div>

            <form method="get" className="flex w-full max-w-xl flex-wrap items-end gap-3">
              {data.filter !== "all" ? <input type="hidden" name="filter" value={data.filter} /> : null}
              <div className="min-w-[220px] flex-1">
                <label className="text-xs text-neutral-400">Buscar por nombre, email o RUT</label>
                <input
                  name="q"
                  defaultValue={data.q}
                  placeholder="cliente@empresa.cl"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
                Buscar
              </button>
              <Link href="/admin/customers" className="k21-btn-secondary px-4 py-3 text-sm">
                Limpiar
              </Link>
            </form>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {adminCustomerFilters.map((option) => {
              const active = option.value === data.filter;
              return (
                <Link
                  key={option.value}
                  href={buildCustomersHref(option.value, data.q)}
                  className={
                    active
                      ? "rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
                      : "rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-white/20 hover:bg-white/[0.06]"
                  }
                >
                  {option.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente / empresa</th>
                  <th className="px-4 py-3 font-medium">Email principal</th>
                  <th className="px-4 py-3 font-medium">Tipo / estado</th>
                  <th className="px-4 py-3 font-medium">Suscripción</th>
                  <th className="px-4 py-3 font-medium">CLP</th>
                  <th className="px-4 py-3 font-medium">USD</th>
                  <th className="px-4 py-3 font-medium">BTC</th>
                  <th className="px-4 py-3 font-medium">Última actividad</th>
                  <th className="px-4 py-3 font-medium text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.rows.map((row) => (
                  <tr key={row.companyId} className="align-top text-neutral-200">
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{row.displayName}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {row.companyRut ? `RUT: ${row.companyRut}` : "Sin RUT registrado"}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        Contacto: {row.primaryContact.name ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-300">
                      {row.primaryContact.email ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2 py-1 text-[11px] ${badgeClasses("neutral")}`}>
                          {row.kind === "PERSONAL" ? "PERSONAL" : "BUSINESS"}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] ${
                            row.onboardingCompleted
                              ? badgeClasses("success")
                              : badgeClasses("warning")
                          }`}
                        >
                          {row.statusLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] ${
                          row.subscription.hasSubscriberMember
                            ? badgeClasses("success")
                            : badgeClasses("neutral")
                        }`}
                      >
                        {row.subscription.hasSubscriberMember
                          ? `Sí (${row.subscription.subscriberCount})`
                          : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-neutral-300">
                      {formatClp(row.balances.clp)}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-neutral-300">
                      {formatUsd(row.balances.usd)}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-neutral-300">
                      {formatBtc(row.balances.btc)}
                    </td>
                    <td className="px-4 py-4">
                      <div>{formatDateTime(row.lastActivityAt)}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {sourceLabel(row.lastActivitySource)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/customers/${row.companyId}`}
                        className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
                {!data.rows.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-neutral-500">
                      No encontré clientes para el filtro actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          <section className="k21-card p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Resumen</div>
            <div className="mt-2 text-3xl font-semibold text-white">{data.total}</div>
            <div className="mt-2 text-sm text-neutral-400">Empresas/clientes visibles con el filtro actual.</div>
          </section>

          <section className="k21-card p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Modelo de lectura</div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-200">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                Entidad central: <code>Company</code>.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                Contacto, onboarding y suscripción: derivados desde <code>CompanyUser + User</code>.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                Saldos: lectura directa desde <code>TreasuryAccount</code>.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
            El listado de clientes sigue priorizando lectura segura y no ejecuta acciones. La capa
            comercial oficial de suscripción y pricing ya vive en <code>/admin/subscriptions</code> y{" "}
            <code>/admin/pricing</code>; la señal legacy de <code>User.isSubscriber</code> se conserva
            solo como fallback visual donde todavía aplica.
          </section>
        </div>
      </div>
    </div>
  );
}
