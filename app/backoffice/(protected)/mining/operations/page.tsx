import Link from "next/link";
import BackofficePageHeader from "../../_components/BackofficePageHeader";
import {
  getMiningOperationsPageData,
  MINING_COMMERCIAL_STATUS_OPTIONS,
  MINING_COMMISSION_STATUS_OPTIONS,
  MINING_MONEY_CURRENCY_OPTIONS,
  MINING_OPERATION_ACTION_FILTER_OPTIONS,
  MINING_OPERATION_PRODUCT_OPTIONS,
  MINING_OPERATIONAL_STATUS_OPTIONS,
} from "@/lib/backofficeMiningOperations";

type BackofficeMiningOperationsPageProps = {
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

function formatMoney(value: string | null, currency: string) {
  if (!value) return "No definido";

  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${currency} ${value}`;

  if (currency === "CLP") {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (currency === "BTC") {
    return `BTC ${amount.toFixed(8)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function actionTone(isDueNow: boolean, isManual: boolean) {
  if (isDueNow) return "k21-pill-pending";
  if (isManual) return "k21-pill-approved";
  return "k21-pill-none";
}

function commercialTone(value: string) {
  if (value === "PAYMENT_RECEIVED" || value === "PAYMENT_PROOF_UPLOADED") {
    return "k21-pill-approved";
  }
  if (value === "CANCELLED") return "k21-pill-rejected";
  if (value === "CONTRACT_SENT" || value === "PAYMENT_PENDING") {
    return "k21-pill-pending";
  }
  return "k21-pill-none";
}

function operationalTone(value: string) {
  if (value === "ACTIVE") return "k21-pill-approved";
  if (value === "INCIDENT") return "k21-pill-pending";
  if (value === "CLOSED") return "k21-pill-rejected";
  if (value === "READY_FOR_ANDES" || value === "ACTIVATION_PENDING") {
    return "k21-pill-pending";
  }
  return "k21-pill-none";
}

function commissionTone(value: string) {
  if (value === "RECEIVED") return "k21-pill-approved";
  if (value === "DISPUTED") return "k21-pill-pending";
  if (value === "NOT_APPLICABLE") return "k21-pill-none";
  if (value === "PAID" || value === "INVOICED" || value === "CALCULATED") {
    return "k21-pill-approved";
  }
  return "k21-pill-pending";
}

function compactTagClass(tone: string) {
  return `${tone} whitespace-normal break-words px-2.5 py-1 leading-tight`;
}

export default async function BackofficeMiningOperationsPage({
  searchParams,
}: BackofficeMiningOperationsPageProps) {
  const sp = searchParams ? await searchParams : {};
  const data = await getMiningOperationsPageData({
    productType: readSearchValue(sp.productType),
    commercialStatus: readSearchValue(sp.commercialStatus),
    operationalStatus: readSearchValue(sp.operationalStatus),
    commissionStatus: readSearchValue(sp.commissionStatus),
    currency: readSearchValue(sp.currency),
    country: readSearchValue(sp.country),
    actionFilter: readSearchValue(sp.actionFilter),
  });

  const metricCards = [
    { label: "Operaciones", value: data.metrics.totalOperations },
    { label: "Contratos enviados", value: data.metrics.contractsSent },
    { label: "Contratos firmados", value: data.metrics.contractsSigned },
    { label: "Pagos recibidos", value: data.metrics.paymentsReceived },
    { label: "Comprobantes cargados", value: data.metrics.paymentProofsUploaded },
    { label: "Listas para Andes", value: data.metrics.readyForAndes },
    { label: "Activas", value: data.metrics.active },
    { label: "Comisiones pendientes", value: data.metrics.commissionsPending },
    { label: "Comisiones pagadas/recibidas", value: data.metrics.commissionsPaidOrReceived },
  ];

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Mining / Operaciones"
        title="Operaciones Mining"
        description="Ventas reales o en cierre creadas desde Prospectos Mining siempre que exista origen asociado."
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-white/55">
          {data.rows.length} operaciones visibles con los filtros actuales.
        </div>
        <Link href="/backoffice/mining" className="k21-btn-secondary">
          Ir a Prospectos Mining
        </Link>
      </div>

      <section className="mt-4 rounded-3xl border border-amber-500/25 bg-amber-500/10 px-5 py-4">
        <div className="text-sm font-semibold text-amber-50">
          Para crear una operación, primero crea o selecciona un prospecto y luego usa{" "}
          <span className="font-semibold">Promover a operación</span>.
        </div>
        <p className="mt-1 max-w-3xl text-sm text-amber-100/75">
          Las operaciones nacen desde Prospectos Mining para mantener una base centralizada de
          contactos y seguimiento. Las operaciones sin prospecto asociado corresponden a registros
          previos a esta centralización.
        </p>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          <Link href="/backoffice/mining/operations" className="k21-btn-secondary">
            Limpiar
          </Link>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <div>
            <label className="text-sm font-medium text-white/80">Producto</label>
            <select
              name="productType"
              defaultValue={data.filters.productType}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todos
              </option>
              {MINING_OPERATION_PRODUCT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Estado comercial</label>
            <select
              name="commercialStatus"
              defaultValue={data.filters.commercialStatus}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todos
              </option>
              {MINING_COMMERCIAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Estado operativo</label>
            <select
              name="operationalStatus"
              defaultValue={data.filters.operationalStatus}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todos
              </option>
              {MINING_OPERATIONAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Estado comisión</label>
            <select
              name="commissionStatus"
              defaultValue={data.filters.commissionStatus}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todos
              </option>
              {MINING_COMMISSION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Moneda</label>
            <select
              name="currency"
              defaultValue={data.filters.currency}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              <option value="" className="bg-neutral-950">
                Todas
              </option>
              {MINING_MONEY_CURRENCY_OPTIONS.map((option) => (
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
              {MINING_OPERATION_ACTION_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="xl:col-span-7 flex justify-end">
            <button type="submit" className="k21-btn-primary min-w-44">
              Aplicar
            </button>
          </div>
        </form>
      </section>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.45fr)]">
        <section className="k21-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <div className="text-lg font-semibold text-white">Operaciones</div>
              <p className="mt-1 text-sm text-white/55">
                Capa interna para contratos, pagos, activación y comisión.
              </p>
            </div>
          </div>

          {data.rows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1320px] text-left text-sm">
                <thead className="bg-white/[0.03] text-white/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Origen</th>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Monto</th>
                    <th className="px-4 py-3 font-medium">Estado comercial</th>
                    <th className="px-4 py-3 font-medium">Estado operativo</th>
                    <th className="px-4 py-3 font-medium">Comisión sugerida / final</th>
                    <th className="px-4 py-3 font-medium">Próxima acción</th>
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
                            <div className="font-semibold text-white">{row.clientName}</div>
                            <div className="mt-1 text-sm text-white/60">
                              {row.clientCompanyName || "Sin empresa"}
                            </div>
                            <div className="mt-2 text-xs text-white/45">País: {row.country}</div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[230px]">
                            {row.prospect ? (
                              <>
                                <div className="font-medium text-white">Desde prospecto</div>
                                <Link
                                  href={`/backoffice/mining/${row.prospect.id}`}
                                  className="mt-2 inline-flex text-sm text-amber-100 underline underline-offset-4"
                                >
                                  Ver prospecto original
                                </Link>
                              </>
                            ) : (
                              <>
                                <div className="font-medium text-white/70">Sin prospecto</div>
                                <div className="mt-2 text-xs text-white/45">
                                  Operación creada antes de centralizar el flujo.
                                </div>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[210px]">
                            <span className={compactTagClass("k21-pill-none")}>
                              {row.productTypeLabel}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-white/70">
                          {formatMoney(row.grossSaleAmount, row.grossSaleCurrency)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[180px]">
                            <span className={compactTagClass(commercialTone(row.commercialStatus))}>
                              {row.commercialStatusLabel}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-[190px]">
                            <span className={compactTagClass(operationalTone(row.operationalStatus))}>
                              {row.operationalStatusLabel}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-white/75">
                          <div className="min-w-[260px]">{row.commission.summary}</div>
                          <div className="mt-2 text-xs text-white/45">
                            Nivel Kapa21: {row.commission.partnerLevelLabel} · Venta #
                            {row.commission.saleSequence}
                            {row.commission.isEstimated ? " estimada" : ""}
                          </div>
                          <div className="mt-2">
                            <span className={compactTagClass(commissionTone(row.commissionStatus))}>
                              {row.commissionStatusLabel}
                            </span>
                          </div>
                          {row.commission.dueAt ? (
                            <div className="mt-2 text-xs text-white/45">
                              Vence {formatDate(row.commission.dueAt)}
                            </div>
                          ) : null}
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

                        <td className="px-4 py-4">
                          <div className="flex min-w-[180px] flex-wrap gap-2">
                            <Link
                              href={`/backoffice/mining/operations/${row.id}`}
                              className="k21-btn-secondary inline-flex"
                            >
                              Ver operación
                            </Link>
                            {row.prospect ? (
                              <Link
                                href={`/backoffice/mining/${row.prospect.id}`}
                                className="inline-flex items-center text-xs text-white/55 underline underline-offset-4"
                              >
                                Ver prospecto
                              </Link>
                            ) : null}
                          </div>
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
                No hay operaciones para estos filtros. Puedes limpiar la vista o promover un
                prospecto desde el pipeline privado.
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="k21-card p-5">
            <div className="text-lg font-semibold text-white">Pendientes</div>
            <p className="mt-1 text-sm text-white/55">
              Acciones internas ordenadas para cierre, cobro y activación.
            </p>

            <div className="mt-4 space-y-3">
              {data.pendingActions.length ? (
                data.pendingActions.map((item) => (
                  <Link
                    key={item.id}
                    href={`/backoffice/mining/operations/${item.id}`}
                    className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{item.clientName}</div>
                        <div className="mt-1 text-sm text-white/60">
                          {item.commercialStatusLabel} · {item.operationalStatusLabel}
                        </div>
                      </div>
                      <span className={actionTone(item.isDueNow, item.isManual)}>
                        {item.isDueNow ? "Urgente" : item.isManual ? "Manual" : "Pendiente"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="text-white/80">
                        <span className="text-white/40">Próxima acción:</span> {item.actionText}
                      </div>
                      <div className="text-white/75">
                        <span className="text-white/40">Fecha:</span> {formatDate(item.actionAt)}
                      </div>
                      <div className="text-white/75">
                        <span className="text-white/40">Comisión:</span> {item.commissionSummary}
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
            <div className="text-lg font-semibold text-white">Nota operativa</div>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                No prometer rentabilidades.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                No hablar de ROI garantizado.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                No presentar el producto como inversión sin riesgo.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Usar lenguaje educativo y factual.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
