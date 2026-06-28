import Link from "next/link";
import BackofficePageHeader from "../_components/BackofficePageHeader";
import {
  getMiningPageData,
  MINING_ACTION_FILTER_OPTIONS,
  MINING_INTEREST_TYPE_OPTIONS,
  MINING_SOURCE_OPTIONS,
  MINING_STATUS_OPTIONS,
} from "@/lib/backofficeMining";

type BackofficeMiningPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatUsd(value: string | null) {
  if (!value) return "No definido";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function actionTone(isDueNow: boolean, isManual: boolean) {
  if (isDueNow) return "k21-pill-pending";
  if (isManual) return "k21-pill-approved";
  return "k21-pill-none";
}

function statusTone(value: string) {
  if (value === "READY_FOR_CONTRACT") return "k21-pill-approved";
  if (value === "DISCARDED") return "k21-pill-rejected";
  if (value === "MEETING_SCHEDULED" || value === "FOLLOW_UP") {
    return "k21-pill-pending";
  }
  return "k21-pill-none";
}

function compactTagClass(tone: string) {
  return `${tone} whitespace-normal break-words px-2.5 py-1 leading-tight`;
}

export default async function BackofficeMiningPage({
  searchParams,
}: BackofficeMiningPageProps) {
  const sp = searchParams ? await searchParams : {};
  const data = await getMiningPageData({
    source: readSearchValue(sp.source),
    interestType: readSearchValue(sp.interestType),
    status: readSearchValue(sp.status),
    country: readSearchValue(sp.country),
    actionFilter: readSearchValue(sp.actionFilter),
  });

  const metricCards = [
    { label: "Prospectos", value: data.metrics.totalProspects },
    { label: "Nuevos interesados", value: data.metrics.newInterest },
    { label: "Reuniones agendadas", value: data.metrics.meetingsScheduled },
    { label: "Reuniones realizadas", value: data.metrics.meetingsDone },
    { label: "Seguimiento", value: data.metrics.followUp },
    { label: "Listos para contrato", value: data.metrics.readyForContract },
    { label: "Dormidos", value: data.metrics.dormant },
    { label: "Descartados", value: data.metrics.discarded },
  ];

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Mining"
        title="Pipeline Mining"
        description="Prospectos privados de minería antes de pasar a operación compartida."
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-white/55">
          {data.rows.length} prospectos visibles con los filtros actuales.
        </div>
        <Link href="/backoffice/mining/new" className="k21-btn-primary">
          Nuevo prospecto
        </Link>
      </div>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <article key={card.label} className="k21-card p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              {card.label}
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">{card.value}</div>
          </article>
        ))}
      </section>

      <section className="mt-4 k21-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">Filtros</div>
          <Link href="/backoffice/mining" className="k21-btn-secondary">
            Limpiar
          </Link>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <label className="text-sm font-medium text-white/80">Origen</label>
            <select
              name="source"
              defaultValue={data.filters.source}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todos
              </option>
              {MINING_SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Modalidad</label>
            <select
              name="interestType"
              defaultValue={data.filters.interestType}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todas
              </option>
              {MINING_INTEREST_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Estado</label>
            <select
              name="status"
              defaultValue={data.filters.status}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todos
              </option>
              {MINING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">País</label>
            <select
              name="country"
              defaultValue={data.filters.country}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todos
              </option>
              {data.countryOptions.map((country) => (
                <option key={country} value={country} className="bg-neutral-950">
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Próxima acción</label>
            <select
              name="actionFilter"
              defaultValue={data.filters.actionFilter}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              {MINING_ACTION_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" className="k21-btn-primary w-full">
              Aplicar
            </button>
          </div>
        </form>
      </section>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.45fr)]">
        <section className="k21-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-lg font-semibold text-white">Prospectos</div>
              <p className="mt-1 text-sm text-white/55">
                Seguimiento privado de interesados reales en minería.
              </p>
            </div>
          </div>

          {data.rows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1240px] text-left text-sm">
                <thead className="bg-white/[0.03] text-white/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Contacto principal</th>
                    <th className="px-4 py-3 font-medium">Origen</th>
                    <th className="px-4 py-3 font-medium">Modalidad</th>
                    <th className="px-4 py-3 font-medium">Monto estimado</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Próxima acción</th>
                    <th className="px-4 py-3 font-medium">Última actividad</th>
                    <th className="px-4 py-3 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => {
                    const effectiveActionAt = row.nextActionAt ?? row.suggestedAction.at;
                    const isManual = Boolean(row.nextActionManual);
                    const isDueNow = row.nextActionAt
                      ? row.isNextActionDueNow
                      : row.suggestedAction.isDueNow;

                    return (
                      <tr key={row.id} className="border-t border-white/10 align-top">
                        <td className="px-4 py-4">
                          <div className="min-w-[220px]">
                            <div className="font-semibold text-white">{row.name}</div>
                            <div className="mt-1 text-sm text-white/60">
                              {row.companyName || "Sin empresa"}
                            </div>
                            <div className="mt-2 text-xs text-white/45">País: {row.country}</div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[220px]">
                            <div className="text-xs uppercase tracking-wide text-white/40">
                              {row.primaryContactLabel}
                            </div>
                            <div className="mt-2 font-medium text-white">
                              {row.primaryContactValue}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className={compactTagClass("k21-pill-none")}>
                            {row.sourceLabel}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[220px]">
                            <span className={compactTagClass("k21-pill-none")}>
                              {row.interestTypeLabel}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-white/70">
                          {formatUsd(row.estimatedAmountUsd)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[180px]">
                            <span className={compactTagClass(statusTone(row.status))}>
                              {row.statusLabel}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[260px]">
                            <div className="font-medium text-white">{row.effectiveNextAction}</div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className={actionTone(isDueNow, isManual)}>
                                {isManual ? "Manual" : isDueNow ? "Vence hoy" : "Sugerida"}
                              </span>
                              <span className="text-white/55">
                                {formatDate(effectiveActionAt)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-white/60">
                          <div>{formatDate(row.lastActivityAt)}</div>
                          <div className="mt-2 text-xs text-white/40">
                            Última actualización {formatDate(row.updatedAt)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <Link
                            href={`/backoffice/mining/${row.id}`}
                            className="k21-btn-secondary inline-flex"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-6">
              <div className="k21-empty">
                No hay prospectos para estos filtros. Puedes limpiar la vista o crear un prospecto
                nuevo.
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="k21-card p-5">
            <div className="text-lg font-semibold text-white">Pendientes</div>
            <p className="mt-1 text-sm text-white/55">
              Próximas acciones ordenadas para seguimiento privado.
            </p>

            <div className="mt-4 space-y-3">
              {data.pendingActions.length ? (
                data.pendingActions.map((item) => (
                  <Link
                    key={item.id}
                    href={`/backoffice/mining/${item.id}`}
                    className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="mt-1 text-sm text-white/60">
                          {item.primaryContactLabel} · {item.primaryContactValue}
                        </div>
                      </div>
                      <span className={actionTone(item.isDueNow, item.isManual)}>
                        {item.isDueNow ? "Urgente" : item.isManual ? "Manual" : "Pendiente"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="text-white/75">
                        <span className="text-white/40">Canal:</span> {item.sourceLabel}
                      </div>
                      <div className="text-white/75">
                        <span className="text-white/40">Modalidad:</span> {item.interestTypeLabel}
                      </div>
                      <div className="text-white/80">
                        <span className="text-white/40">Próxima acción:</span> {item.actionText}
                      </div>
                      <div className="text-white/75">
                        <span className="text-white/40">Fecha:</span> {formatDate(item.actionAt)}
                      </div>
                      <div className="text-white/75">
                        <span className="text-white/40">Estado:</span> {item.statusLabel}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="k21-empty mt-0">
                  Sin acciones pendientes con los filtros actuales.
                </div>
              )}
            </div>
          </section>

          <section className="k21-card p-5">
            <div className="text-lg font-semibold text-white">Resumen privado</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/40">
                  Con seguimiento activo
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {data.metrics.newInterest +
                    data.metrics.meetingsScheduled +
                    data.metrics.meetingsDone +
                    data.metrics.followUp +
                    data.metrics.readyForContract}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/40">
                  Listos para contrato
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {data.metrics.readyForContract}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/40">Dormidos</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {data.metrics.dormant}
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
