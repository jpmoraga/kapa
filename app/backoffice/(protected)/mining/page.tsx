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
  const operationFlowNotice = readSearchValue(sp.operationFlow) === "prospects";
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
    <div className="mx-auto max-w-[1760px] px-5 py-5 lg:px-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Mining"
        title="Pipeline Mining"
        description="Base central privada de prospectos desde donde nacen las operaciones de Mining."
      />

      {operationFlowNotice ? (
        <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Para crear una operación, primero crea o selecciona un prospecto y luego usa
          {" "}
          <span className="font-semibold">Promover a operación</span>.
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-white/55">
          {data.rows.length} prospectos visibles con los filtros actuales.
        </div>
        <Link href="/backoffice/mining/new" className="k21-btn-primary">
          Nuevo prospecto
        </Link>
      </div>

      <section className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-amber-50">
              Las operaciones nacen desde Prospectos Mining.
            </div>
            <p className="mt-1 max-w-3xl text-sm text-amber-100/75">
              Mantén aquí la base centralizada de contactos, seguimiento y contexto comercial.
              Cuando el cliente pida contrato o esté listo para cierre, entra a su ficha y usa
              {" "}
              <span className="font-semibold">Promover a operación</span>.
            </p>
          </div>
          <Link href="/backoffice/mining/operations" className="k21-btn-secondary px-3 py-2 text-xs">
            Ver operaciones
          </Link>
        </div>
      </section>

      <section className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {metricCards.map((card) => (
          <article key={card.label} className="k21-card border-white/10 bg-white/[0.02] p-3.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              {card.label}
            </div>
            <div className="mt-1.5 text-2xl font-semibold text-white">{card.value}</div>
          </article>
        ))}
      </section>

      <section className="mt-4 k21-card border-white/10 bg-white/[0.02] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">Filtros</div>
          <Link href="/backoffice/mining" className="k21-btn-secondary px-3 py-2 text-xs">
            Limpiar
          </Link>
        </div>

        <form className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[repeat(5,minmax(0,1fr))_auto_auto]">
          <div>
            <label className="text-sm font-medium text-white/80">Origen</label>
            <select
              name="source"
              defaultValue={data.filters.source}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
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
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
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
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
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
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
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
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              {MINING_ACTION_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end 2xl:justify-end">
            <button type="submit" className="k21-btn-primary w-full px-3 py-2 text-xs 2xl:w-auto 2xl:min-w-28">
              Aplicar
            </button>
          </div>
        </form>
      </section>

      <section className="mt-4 k21-card overflow-hidden border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <div className="text-base font-semibold text-white">Prospectos</div>
            <p className="mt-1 text-sm text-white/55">
              Seguimiento privado de interesados reales en minería.
            </p>
          </div>
        </div>

        {data.rows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1440px] text-left text-sm">
              <thead className="bg-neutral-950/95 text-white/45 backdrop-blur">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Nombre</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Contacto principal</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Origen</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Modalidad</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Monto estimado</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Estado</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Próxima acción</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Última actividad</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Acción</th>
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
                      <td className="px-4 py-3.5">
                        <div className="min-w-[240px]">
                          <div className="font-semibold text-white">{row.name}</div>
                          <div className="mt-1 text-sm text-white/60">
                            {row.companyName || "Sin empresa"}
                          </div>
                          <div className="mt-1.5 text-xs text-white/45">País: {row.country}</div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="min-w-[260px]">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                            {row.primaryContactLabel}
                          </div>
                          <div className="mt-1.5 break-words font-medium text-white">
                            {row.primaryContactValue}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={compactTagClass("k21-pill-none")}>
                          {row.sourceLabel}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="min-w-[230px]">
                          <span className={compactTagClass("k21-pill-none")}>
                            {row.interestTypeLabel}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-white/70">
                        {formatUsd(row.estimatedAmountUsd)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="min-w-[190px]">
                          <span className={compactTagClass(statusTone(row.status))}>
                            {row.statusLabel}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="min-w-[330px]">
                          <div className="font-medium leading-relaxed text-white">
                            {row.effectiveNextAction}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={actionTone(isDueNow, isManual)}>
                              {isManual ? "Manual" : isDueNow ? "Vence hoy" : "Sugerida"}
                            </span>
                            <span className="text-white/55">{formatDate(effectiveActionAt)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-white/60">
                        <div>{formatDate(row.lastActivityAt)}</div>
                        <div className="mt-1.5 text-xs text-white/40">
                          Última actualización {formatDate(row.updatedAt)}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex min-w-[220px] flex-wrap gap-2">
                          {row.linkedOperationId ? (
                            <>
                              <Link
                                href={`/backoffice/mining/operations/${row.linkedOperationId}`}
                                className="k21-btn-secondary inline-flex px-3 py-2 text-xs"
                              >
                                Ver operación
                              </Link>
                              <Link
                                href={`/backoffice/mining/${row.id}`}
                                className="inline-flex items-center text-xs text-white/55 underline underline-offset-4"
                              >
                                Ver prospecto
                              </Link>
                            </>
                          ) : (
                            <Link
                              href={`/backoffice/mining/${row.id}`}
                              className="k21-btn-primary inline-flex px-3 py-2 text-xs"
                            >
                              Promover a operación
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-5">
            <div className="k21-empty mt-0">
              No hay prospectos para estos filtros. Puedes limpiar la vista o crear un prospecto
              nuevo para iniciar el flujo hacia operaciones.
            </div>
          </div>
        )}
      </section>

      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <section className="k21-card border-white/10 bg-white/[0.02] p-4">
          <div className="text-base font-semibold text-white">Pendientes</div>
          <p className="mt-1 text-sm text-white/55">
            Próximas acciones ordenadas para seguimiento privado.
          </p>

          <div className="mt-3 space-y-2.5">
            {data.pendingActions.length ? (
              data.pendingActions.map((item) => (
                <Link
                  key={item.id}
                  href={`/backoffice/mining/${item.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 transition hover:border-white/20 hover:bg-white/[0.05]"
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

                  <div className="mt-3 space-y-1.5 text-sm">
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
              <div className="k21-empty mt-0">Sin acciones pendientes con los filtros actuales.</div>
            )}
          </div>
        </section>

        <section className="k21-card border-white/10 bg-white/[0.02] p-4">
          <div className="text-base font-semibold text-white">Resumen privado</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 2xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                Con seguimiento activo
              </div>
              <div className="mt-1.5 text-2xl font-semibold text-white">
                {data.metrics.newInterest +
                  data.metrics.meetingsScheduled +
                  data.metrics.meetingsDone +
                  data.metrics.followUp +
                  data.metrics.readyForContract}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                Listos para contrato
              </div>
              <div className="mt-1.5 text-2xl font-semibold text-white">
                {data.metrics.readyForContract}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/40">Dormidos</div>
              <div className="mt-1.5 text-2xl font-semibold text-white">
                {data.metrics.dormant}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
