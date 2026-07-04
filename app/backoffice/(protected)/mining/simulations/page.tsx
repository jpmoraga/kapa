import Link from "next/link";

import BackofficePageHeader from "../../_components/BackofficePageHeader";
import {
  getMiningSimulationReportData,
  MINING_SIMULATION_EVENT_FILTER_OPTIONS,
  MINING_SIMULATION_RANGE_OPTIONS,
  MINING_SIMULATION_TYPE_OPTIONS,
} from "@/lib/backofficeMiningSimulations";

type BackofficeMiningSimulationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("es-CL").format(value);
}

function compactTagClass(tone: string) {
  return `${tone} whitespace-normal break-words px-2.5 py-1 leading-tight`;
}

function eventTone(label: string) {
  return label === "CTA" ? "k21-pill-approved" : "k21-pill-none";
}

function simulatorTone(label: string) {
  return label === "ASIC" ? "k21-pill-approved" : "k21-pill-none";
}

function metricLeaderSubtext(
  leader: {
    label: string;
    count: number;
  } | null,
) {
  if (!leader) {
    return "Sin datos";
  }

  return `${formatCount(leader.count)} eventos`;
}

export default async function BackofficeMiningSimulationsPage({
  searchParams,
}: BackofficeMiningSimulationsPageProps) {
  const sp = searchParams ? await searchParams : {};
  const data = await getMiningSimulationReportData({
    range: readSearchValue(sp.range),
    type: readSearchValue(sp.type),
    event: readSearchValue(sp.event),
  });

  const metricCards = [
    {
      label: "Eventos totales",
      value: formatCount(data.metrics.totalEvents),
      helper: "Según filtros seleccionados",
    },
    {
      label: "Sesiones únicas",
      value: formatCount(data.metrics.uniqueSessions),
      helper: "SessionId anónimo único",
    },
    {
      label: "Clicks CTA",
      value: formatCount(data.metrics.ctaClicks),
      helper: "Eventos CTA_CLICKED",
    },
    {
      label: "Interacciones",
      value: formatCount(data.metrics.interactions),
      helper: "Eventos SIMULATION_INTERACTION",
    },
    {
      label: "Plan fraccionado más usado",
      value: data.metrics.topFractionalPlan?.label ?? "Sin datos",
      helper: metricLeaderSubtext(data.metrics.topFractionalPlan),
    },
    {
      label: "ASIC más cotizado",
      value: data.metrics.topAsic?.label ?? "Sin datos",
      helper: metricLeaderSubtext(data.metrics.topAsic),
    },
  ];

  const resultsSummary = data.metrics.totalEvents
    ? `Mostrando los últimos ${formatCount(Math.min(data.rows.length, data.rowLimit))} de ${formatCount(
        data.metrics.totalEvents,
      )} eventos filtrados.`
    : "No hay eventos para la combinación actual.";

  return (
    <div className="mx-auto max-w-[1760px] px-5 py-5 lg:px-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Mining / Simulaciones"
        title="Simulaciones Mining"
        description="Eventos anónimos generados por los simuladores públicos de minería."
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-white/55">{resultsSummary}</div>
        <Link href="/backoffice/mining" className="k21-btn-secondary">
          Volver a Prospectos Mining
        </Link>
      </div>

      <section className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {metricCards.map((card) => (
          <article key={card.label} className="k21-card border-white/10 bg-white/[0.02] p-3.5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              {card.label}
            </div>
            <div className="mt-1.5 text-xl font-semibold text-white 2xl:text-2xl">
              {card.value}
            </div>
            <div className="mt-1.5 text-xs text-white/45">{card.helper}</div>
          </article>
        ))}
      </section>

      <section className="mt-4 k21-card border-white/10 bg-white/[0.02] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">Filtros</div>
          <Link href="/backoffice/mining/simulations" className="k21-btn-secondary px-3 py-2 text-xs">
            Limpiar
          </Link>
        </div>

        <form className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-white/80">Rango</label>
            <select
              name="range"
              defaultValue={data.filters.range}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              {MINING_SIMULATION_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Tipo</label>
            <select
              name="type"
              defaultValue={data.filters.type}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              {MINING_SIMULATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-white/80">Evento</label>
            <select
              name="event"
              defaultValue={data.filters.event}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
            >
              {MINING_SIMULATION_EVENT_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-neutral-950">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" className="k21-btn-primary w-full px-3 py-2 text-xs">
              Aplicar
            </button>
          </div>
        </form>
      </section>

      <section className="mt-4 k21-card overflow-hidden border-white/10 bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <div className="text-base font-semibold text-white">Últimos eventos</div>
            <p className="mt-1 text-sm text-white/55">
              Tabla de sólo lectura con los eventos anónimos más recientes de simulación.
            </p>
          </div>
          <div className="text-right text-xs text-white/45">
            Límite visible {formatCount(data.rowLimit)} eventos
          </div>
        </div>

        {data.rows.length ? (
          <div className="max-h-[72vh] overflow-auto">
            <table className="min-w-[1180px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-neutral-950/95 text-white/45 backdrop-blur">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Fecha</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Sesión</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Evento</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Tipo</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Plan / ASIC</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Monto principal</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">TH/s</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Hosting mensual</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Total / Inicial</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 align-top hover:bg-white/[0.02]">
                    <td className="px-4 py-3.5 text-white/70">
                      <div className="min-w-[145px]">{row.createdAtLabel}</div>
                    </td>
                    <td className="px-4 py-3.5 text-white/70">
                      <div className="min-w-[115px] font-mono text-xs text-white/65">
                        {row.sessionIdShort}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={compactTagClass(eventTone(row.eventTypeLabel))}>
                        {row.eventTypeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={compactTagClass(simulatorTone(row.simulatorTypeLabel))}>
                        {row.simulatorTypeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white">
                      <div className="min-w-[220px]">{row.planOrAsicLabel}</div>
                    </td>
                    <td className="px-4 py-3.5 text-white/70">
                      <div className="min-w-[140px]">{row.primaryAmountLabel}</div>
                    </td>
                    <td className="px-4 py-3.5 text-white/70">
                      <div className="min-w-[120px]">{row.thsLabel}</div>
                    </td>
                    <td className="px-4 py-3.5 text-white/70">
                      <div className="min-w-[140px]">{row.hostingMonthlyLabel}</div>
                    </td>
                    <td className="px-4 py-3.5 text-white/70">
                      <div className="min-w-[140px]">{row.totalOrInitialLabel}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-5">
            <div className="k21-empty mt-0">
              Todavía no hay simulaciones para los filtros seleccionados.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
