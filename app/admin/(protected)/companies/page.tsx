import Link from "next/link";
import AdminPageHeader from "../_components/AdminPageHeader";
import {
  adminCompanyFilters,
  listAdminCompanies,
  type AdminCompanyFilter,
} from "@/lib/companyLifecycle";

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildCompaniesHref(filter: AdminCompanyFilter, q: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/admin/companies?${query}` : "/admin/companies";
}

function flashMessage(kind: string | undefined) {
  if (kind === "created") {
    return {
      tone: "success" as const,
      text: "Empresa creada desde admin. El lifecycle quedó registrado sin tocar balances.",
    };
  }
  if (kind === "reviewed") {
    return {
      tone: "success" as const,
      text: "Estado de revisión actualizado.",
    };
  }
  return null;
}

function errorMessage(code: string | undefined) {
  switch (code) {
    case "company_name_too_short":
      return "El nombre de la empresa debe tener al menos 3 caracteres.";
    case "company_name_reserved":
      return "Ese nombre está reservado.";
    case "company_rut_exists":
      return "Ya existe una empresa business con ese RUT.";
    case "invalid_initial_status":
      return "Estado inicial inválido.";
    case "invalid_document_type":
      return "El documento debe ser PDF, JPG, PNG o WEBP.";
    case "document_too_large":
      return "El documento supera el máximo de 10 MB.";
    default:
      return code ? "No se pudo procesar la acción sobre empresas." : null;
  }
}

function statusBadge(statusLabel: string) {
  if (statusLabel === "Aprobada") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }
  if (statusLabel === "Pendiente" || statusLabel === "Sin revisión") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  }
  if (statusLabel === "Observada") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  }
  if (statusLabel === "Rechazada") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }
  return "border-white/10 bg-white/[0.03] text-neutral-300";
}

function sourceBadge(sourceLabel: string) {
  if (sourceLabel === "Admin") {
    return "border-white/10 bg-white/[0.03] text-neutral-300";
  }
  if (sourceLabel === "Cliente") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-100";
  }
  return "border-white/10 bg-white/[0.03] text-neutral-400";
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL");
}

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = firstString(sp.q) ?? "";
  const filter = firstString(sp.filter) ?? "all";
  const flash = flashMessage(firstString(sp.flash));
  const error = errorMessage(firstString(sp.error));
  const createdCompanyId = firstString(sp.companyId);
  const data = await listAdminCompanies({ filter, q });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AdminPageHeader
        eyebrow="Admin / Empresas"
        title="Lifecycle de empresas pyme"
        description="Cola administrativa para alta manual, revisión y aprobación de empresas `BUSINESS`. Todo queda separado de treasury y de las operaciones patrimoniales."
        actions={
          <Link href="/admin" className="k21-btn-secondary px-3 py-2 text-sm">
            Volver al dashboard
          </Link>
        }
      />

      {flash ? (
        <div
          className={`mt-6 rounded-2xl border p-4 text-sm ${
            flash.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              : "border-white/10 bg-white/[0.03] text-neutral-200"
          }`}
        >
          {flash.text}
          {createdCompanyId ? (
            <span className="block pt-2 text-xs text-emerald-200">
              Company ID: <code>{createdCompanyId}</code>
            </span>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Business totales</div>
          <div className="mt-2 text-3xl font-semibold text-white">{data.counts.total}</div>
        </div>
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Pendientes</div>
          <div className="mt-2 text-3xl font-semibold text-white">{data.counts.pending}</div>
        </div>
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Aprobadas</div>
          <div className="mt-2 text-3xl font-semibold text-white">{data.counts.approved}</div>
        </div>
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Observadas / rechazadas</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {data.counts.observed + data.counts.rejected}
          </div>
        </div>
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Sin revisión</div>
          <div className="mt-2 text-3xl font-semibold text-white">{data.counts.unreviewed}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <section className="k21-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Cola de revisión</div>
              <h2 className="mt-2 text-lg font-semibold text-white">Empresas business</h2>
              <p className="mt-2 text-sm text-neutral-400">
                Este listado usa el nuevo modelo de lifecycle. Las empresas personales siguen fuera
                del approval flow.
              </p>
            </div>

            <form method="get" className="flex w-full max-w-xl flex-wrap items-end gap-3">
              {data.filter !== "all" ? <input type="hidden" name="filter" value={data.filter} /> : null}
              <div className="min-w-[220px] flex-1">
                <label className="text-xs text-neutral-400">Buscar por empresa, RUT o contacto</label>
                <input
                  name="q"
                  defaultValue={data.q}
                  placeholder="empresa, rut o email"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
                Buscar
              </button>
              <Link href="/admin/companies" className="k21-btn-secondary px-4 py-3 text-sm">
                Limpiar
              </Link>
            </form>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {adminCompanyFilters.map((option) => {
              const active = option.value === data.filter;
              return (
                <Link
                  key={option.value}
                  href={buildCompaniesHref(option.value, data.q)}
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
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Docs</th>
                  <th className="px-4 py-3 font-medium">Actualizado</th>
                  <th className="px-4 py-3 font-medium text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.rows.length ? (
                  data.rows.map((row) => (
                    <tr key={row.companyId} className="align-top text-neutral-200">
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{row.name}</div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {row.companyRut ?? "Sin RUT"} · miembros {row.membersCount}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>{row.contactName ?? "—"}</div>
                        <div className="mt-1 text-xs text-neutral-500">{row.contactEmail ?? "—"}</div>
                        <div className="mt-1 text-xs text-neutral-500">
                          Vinculado: {row.linkedUserEmail ?? "Pendiente"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] ${statusBadge(row.reviewStatusLabel)}`}
                        >
                          {row.reviewStatusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] ${sourceBadge(row.reviewSourceLabel)}`}
                        >
                          {row.reviewSourceLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-300">{row.documentsCount}</td>
                      <td className="px-4 py-4">
                        <div>{formatDateTime(row.reviewUpdatedAt ?? row.reviewCreatedAt)}</div>
                        <div className="mt-1 text-xs text-neutral-500">
                          Revisado: {formatDateTime(row.reviewedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/admin/companies/${row.companyId}`}
                          className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
                        >
                          Revisar
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500">
                      No hay empresas para los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="k21-card p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Alta manual</div>
          <h2 className="mt-2 text-lg font-semibold text-white">Crear empresa desde admin</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Si el correo del contacto ya existe como usuario, se vincula automáticamente como owner.
            Si no existe, la empresa queda lista para vinculación posterior.
          </p>

          <form
            action="/api/admin/companies"
            method="post"
            encType="multipart/form-data"
            className="mt-5 space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-white/80">Nombre empresa</label>
              <input
                name="companyName"
                required
                minLength={3}
                placeholder="Servicios Pyme SpA"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">RUT o identificador</label>
              <input
                name="companyRut"
                placeholder="76.123.456-7"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-white/80">Nombre contacto</label>
                <input
                  name="contactName"
                  placeholder="María Pérez"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Email contacto</label>
                <input
                  name="contactEmail"
                  type="email"
                  placeholder="cliente@empresa.cl"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">Estado inicial</label>
              <select
                name="initialStatus"
                defaultValue="PENDING"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              >
                <option value="PENDING">Pendiente</option>
                <option value="APPROVED">Aprobada</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">Nota de creación</label>
              <textarea
                name="submissionNote"
                rows={4}
                placeholder="Ej: documentos recibidos por correo y revisión básica completada."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">Documento opcional</label>
              <input
                name="documentFile"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="mt-2 block w-full text-sm text-neutral-300 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white/80">Nota del documento</label>
              <input
                name="documentNote"
                placeholder="Ej: carpeta enviada por email, escritura adjunta."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
              Crear empresa manual
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
