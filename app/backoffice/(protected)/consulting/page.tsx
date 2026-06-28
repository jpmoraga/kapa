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
    {
      label: "Prospectos",
      value: data.metrics.totalProspects,
      description: "Base total cargada en Consulting.",
    },
    {
      label: "Invitaciones",
      value: data.metrics.linkedinInvitesSent,
      description: "Contactos con outreach iniciado.",
    },
    {
      label: "Aceptados",
      value: data.metrics.linkedinAccepted,
      description: "LinkedIn aceptado por el prospecto.",
    },
    {
      label: "Mensajes",
      value: data.metrics.messagesSent,
      description: "Primer contacto o email enviado.",
    },
    {
      label: "Respuestas",
      value: data.metrics.responses,
      description: "Prospectos que ya contestaron.",
    },
    {
      label: "Reuniones",
      value: data.metrics.meetingsScheduled,
      description: "Meetings agendadas actualmente.",
    },
    {
      label: "Propuestas",
      value: data.metrics.proposalsSent,
      description: "Propuestas ya enviadas.",
    },
    {
      label: "Ganados",
      value: data.metrics.diagnosisWon,
      description: "Diagnósticos ganados o contratados.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <BackofficePageHeader
        eyebrow="Backoffice / Consulting"
        title="Consulting Pipeline"
        description="Pipeline comercial privado para Fondeo Flexible y Tesorería Operativa, aislado del admin legado y del módulo Mining."
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-white/55">
          {data.rows.length} resultados visibles con los filtros actuales.
        </div>
        <Link href="/backoffice/consulting/new" className="k21-btn-primary">
          Nuevo prospecto
        </Link>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <article key={card.label} className="k21-card p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              {card.label}
            </div>
            <div className="mt-3 text-3xl font-semibold text-white">{card.value}</div>
            <p className="mt-2 text-sm text-white/60">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 k21-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">Filtros operativos</div>
            <p className="mt-1 text-sm text-white/60">
              El dashboard mantiene métricas globales y filtra la grilla de seguimiento.
            </p>
          </div>
          <Link href="/backoffice/consulting" className="k21-btn-secondary">
            Limpiar filtros
          </Link>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="text-sm font-medium text-white/80">Línea</label>
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
            <label className="text-sm font-medium text-white/80">Estado contacto</label>
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
            <label className="text-sm font-medium text-white/80">Pipeline</label>
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

          <div className="md:col-span-2 xl:col-span-5">
            <button type="submit" className="k21-btn-primary">
              Aplicar filtros
            </button>
          </div>
        </form>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <section className="k21-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
            <div>
              <div className="text-lg font-semibold text-white">Prospectos</div>
              <p className="mt-1 text-sm text-white/60">
                Tabla editable del pipeline comercial de Consulting.
              </p>
            </div>
          </div>

          {data.rows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-white/50">
                  <tr>
                    <th className="px-6 py-3 font-medium">Empresa</th>
                    <th className="px-6 py-3 font-medium">Contacto</th>
                    <th className="px-6 py-3 font-medium">Pipeline</th>
                    <th className="px-6 py-3 font-medium">Próxima acción</th>
                    <th className="px-6 py-3 font-medium">Actividad</th>
                    <th className="px-6 py-3 font-medium">Acción</th>
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
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{row.companyName}</div>
                          <div className="mt-1 text-white/60">{row.country}</div>
                          {row.source ? (
                            <div className="mt-2 text-xs uppercase tracking-wide text-white/40">
                              {row.source}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-6 py-4">
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
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="k21-badge">{row.businessLineLabel}</span>
                            <span className={stageTone(row.contactStatus)}>
                              {row.contactStatusLabel}
                            </span>
                            <span className={stageTone(row.pipelineStage)}>
                              {row.pipelineStageLabel}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-white/45">
                            Email: {row.emailStatusLabel}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{row.effectiveNextAction}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={actionTone(isDueNow, isManual)}>
                              {isManual ? "Manual" : isDueNow ? "Vence hoy" : "Sugerida"}
                            </span>
                            <span className="text-white/55">
                              {formatDate(effectiveActionAt)}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-white/60">
                          <div>{formatDate(row.lastActivityAt)}</div>
                          <div className="mt-2 text-xs text-white/40">
                            Actualizado {formatDate(row.updatedAt)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
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
            <div className="px-6 py-8">
              <div className="k21-empty">
                No hay prospectos para estos filtros. Puedes limpiar la vista o crear un prospecto
                nuevo.
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Pendientes</div>
            <p className="mt-1 text-sm text-white/60">
              Cola de próximas acciones priorizada por vencimiento.
            </p>

            <div className="mt-4 space-y-3">
              {data.pendingActions.length ? (
                data.pendingActions.map((item) => (
                  <Link
                    key={item.id}
                    href={`/backoffice/consulting/${item.id}`}
                    className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={actionTone(item.isDueNow, item.isManual)}>
                        {item.isDueNow ? "Urgente" : item.isManual ? "Manual" : "Pendiente"}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-white/40">
                        {item.businessLineLabel}
                      </span>
                    </div>
                    <div className="mt-3 font-semibold text-white">{item.companyName}</div>
                    <div className="mt-1 text-sm text-white/60">{item.contactName}</div>
                    <div className="mt-3 text-sm text-white/80">{item.actionText}</div>
                    <div className="mt-2 text-xs text-white/45">
                      {item.pipelineStageLabel}
                      {" · "}
                      {formatDate(item.actionAt)}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="k21-empty mt-0">
                  No hay acciones pendientes para la selección actual.
                </div>
              )}
            </div>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Cobertura MVP</div>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Alta y edición separadas del admin viejo.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Métricas básicas para outreach, reuniones y diagnóstico.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Próxima acción manual o sugerida con fechas automáticas.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
