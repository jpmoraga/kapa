import Link from "next/link";
import BackofficePageHeader from "../_components/BackofficePageHeader";
import {
  CONSULTING_ACTION_FILTER_OPTIONS,
  CONSULTING_BUSINESS_LINE_OPTIONS,
  CONSULTING_CONTACT_STATUS_OPTIONS,
  CONSULTING_PIPELINE_STAGE_OPTIONS,
  getConsultingPageData,
} from "@/lib/backofficeConsulting";

type BackofficeConsultingPageProps = {
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

function actionTone(isDueNow: boolean, isManual: boolean) {
  if (isDueNow) return "k21-pill-pending";
  if (isManual) return "k21-pill-approved";
  return "k21-pill-none";
}

function stageTone(value: string) {
  if (value === "DIAGNOSIS_WON") return "k21-pill-approved";
  if (value === "LOST" || value === "DISCARDED") return "k21-pill-rejected";
  if (value === "PROPOSAL_SENT" || value === "MEETING_SCHEDULED") {
    return "k21-pill-pending";
  }
  return "k21-pill-none";
}

function compactTagClass(tone: string) {
  return `${tone} whitespace-normal break-words px-2.5 py-1 leading-tight`;
}

export default async function BackofficeConsultingPage({
  searchParams,
}: BackofficeConsultingPageProps) {
  const sp = searchParams ? await searchParams : {};
  const data = await getConsultingPageData({
    businessLine: readSearchValue(sp.businessLine),
    country: readSearchValue(sp.country),
    contactStatus: readSearchValue(sp.contactStatus),
    pipelineStage: readSearchValue(sp.pipelineStage),
    actionFilter: readSearchValue(sp.actionFilter),
  });

  const metricCards = [
    { label: "Prospectos", value: data.metrics.totalProspects },
    { label: "Invitaciones", value: data.metrics.linkedinInvitesSent },
    { label: "Aceptados", value: data.metrics.linkedinAccepted },
    { label: "Mensajes", value: data.metrics.messagesSent },
    { label: "Respuestas", value: data.metrics.responses },
    { label: "Reuniones", value: data.metrics.meetingsScheduled },
    { label: "Propuestas", value: data.metrics.proposalsSent },
    { label: "Ganados", value: data.metrics.diagnosisWon },
  ];

  const visiblePendingCount = data.rows.filter(
    (row) => Boolean(row.nextActionManual) || row.suggestedAction.hasPendingAction
  ).length;
  const dueNowCount = data.rows.filter((row) =>
    row.nextActionAt ? row.isNextActionDueNow : row.suggestedAction.isDueNow
  ).length;
  const manualCount = data.rows.filter((row) => Boolean(row.nextActionManual)).length;

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Consulting"
        title="Pipeline de Consulting"
        description="Vista diaria de prospectos, estados comerciales y próximas acciones del equipo."
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-white/55">
          {data.rows.length} prospectos visibles con los filtros actuales.
        </div>
        <Link href="/backoffice/consulting/new" className="k21-btn-primary">
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
          <Link href="/backoffice/consulting" className="k21-btn-secondary">
            Limpiar
          </Link>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <label className="text-sm font-medium text-white/80">Línea comercial</label>
            <select
              name="businessLine"
              defaultValue={data.filters.businessLine}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todas
              </option>
              {CONSULTING_BUSINESS_LINE_OPTIONS.map((option) => (
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
            <label className="text-sm font-medium text-white/80">Estado de contacto</label>
            <select
              name="contactStatus"
              defaultValue={data.filters.contactStatus}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todos
              </option>
              {CONSULTING_CONTACT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Etapa comercial</label>
            <select
              name="pipelineStage"
              defaultValue={data.filters.pipelineStage}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todas
              </option>
              {CONSULTING_PIPELINE_STAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
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
              {CONSULTING_ACTION_FILTER_OPTIONS.map((option) => (
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
                Seguimiento activo de la cartera comercial visible.
              </p>
            </div>
          </div>

          {data.rows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1120px] text-left text-sm">
                <thead className="bg-white/[0.03] text-white/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Empresa</th>
                    <th className="px-4 py-3 font-medium">Contacto</th>
                    <th className="px-4 py-3 font-medium">Estado comercial</th>
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
                            <div className="font-semibold text-white">{row.companyName}</div>
                            <div className="mt-2 text-sm text-white/60">País: {row.country}</div>
                            <div className="mt-1 text-sm text-white/50">
                              Fuente: {row.source || "Sin fuente"}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[220px]">
                            <div className="font-medium text-white">{row.contactName}</div>
                            <div className="mt-1 text-white/60">{row.contactRole}</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {row.email ? (
                                <a
                                  href={`mailto:${row.email}`}
                                  className="k21-badge text-xs text-white/75 hover:text-white"
                                >
                                  {row.email}
                                </a>
                              ) : null}
                              {row.linkedinUrl ? (
                                <a
                                  href={row.linkedinUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="k21-badge text-xs text-white/75 hover:text-white"
                                >
                                  LinkedIn
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[260px] space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <span className={compactTagClass("k21-pill-none")}>
                                {row.businessLineLabel}
                              </span>
                              <span className={compactTagClass(stageTone(row.contactStatus))}>
                                {row.contactStatusLabel}
                              </span>
                              <span className={compactTagClass(stageTone(row.pipelineStage))}>
                                {row.pipelineStageLabel}
                              </span>
                            </div>
                            <div className="text-xs text-white/45">
                              Estado de email: {row.emailStatusLabel}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[250px]">
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
                            href={`/backoffice/consulting/${row.id}`}
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
              Próximas acciones ordenadas para operar el día.
            </p>

            <div className="mt-4 space-y-3">
              {data.pendingActions.length ? (
                data.pendingActions.map((item) => (
                  <Link
                    key={item.id}
                    href={`/backoffice/consulting/${item.id}`}
                    className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{item.companyName}</div>
                        <div className="mt-1 text-sm text-white/60">{item.contactName}</div>
                      </div>
                      <span className={actionTone(item.isDueNow, item.isManual)}>
                        {item.isDueNow ? "Urgente" : item.isManual ? "Manual" : "Pendiente"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="text-white/75">
                        <span className="text-white/40">Línea:</span> {item.businessLineLabel}
                      </div>
                      <div className="text-white/80">
                        <span className="text-white/40">Próxima acción:</span> {item.actionText}
                      </div>
                      <div className="text-white/75">
                        <span className="text-white/40">Fecha:</span> {formatDate(item.actionAt)}
                      </div>
                      <div className="text-white/75">
                        <span className="text-white/40">Estado actual:</span>{" "}
                        {item.contactStatusLabel} · {item.pipelineStageLabel}
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
            <div className="text-lg font-semibold text-white">Resumen de seguimiento</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/40">
                  Pendientes visibles
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {visiblePendingCount}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/40">Urgentes</div>
                <div className="mt-2 text-2xl font-semibold text-white">{dueNowCount}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/40">
                  Próximas acciones manuales
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">{manualCount}</div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
