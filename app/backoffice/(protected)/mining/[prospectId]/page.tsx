import Link from "next/link";
import { notFound } from "next/navigation";
import BackofficePageHeader from "../../_components/BackofficePageHeader";
import PromoteMiningProspectButton from "../_components/PromoteMiningProspectButton";
import MiningProspectForm from "../_components/MiningProspectForm";
import {
  getMiningProspectById,
  MINING_INTEREST_TYPE_OPTIONS,
  MINING_SOURCE_OPTIONS,
  MINING_STATUS_OPTIONS,
} from "@/lib/backofficeMining";
import { getMiningOperationByProspectId } from "@/lib/backofficeMiningOperations";

type BackofficeMiningProspectPageProps = {
  params: Promise<{ prospectId: string }>;
  searchParams?: Promise<{ created?: string; saved?: string }>;
};

const AUTOMATIC_DATE_LABELS: Array<{ key: string; label: string }> = [
  { key: "firstContactAt", label: "Primer contacto" },
  { key: "meetingScheduledAt", label: "Reunión agendada" },
  { key: "meetingDoneAt", label: "Reunión realizada" },
  { key: "followUpAt", label: "Seguimiento" },
  { key: "readyForContractAt", label: "Listo para contrato" },
  { key: "dormantAt", label: "Dormido" },
  { key: "discardedAt", label: "Descartado" },
];

function formatDate(value: string | null) {
  if (!value) return "Pendiente";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatUsd(value: string) {
  if (!value) return "No definido";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export default async function BackofficeMiningProspectPage({
  params,
  searchParams,
}: BackofficeMiningProspectPageProps) {
  const { prospectId } = await params;
  const sp = searchParams ? await searchParams : {};
  const prospect = await getMiningProspectById(prospectId);
  const linkedOperation = await getMiningOperationByProspectId(prospectId);

  if (!prospect) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Mining / Prospecto"
        title={prospect.name}
        description={`${prospect.companyName || "Sin empresa"} · ${prospect.country}`}
      />

      {sp.created || sp.saved ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {sp.created ? "Prospecto creado correctamente." : "Cambios guardados correctamente."}
        </div>
      ) : null}

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <MiningProspectForm
          key={`${prospect.id}:${prospect.updatedAt}`}
          mode="edit"
          prospectId={prospect.id}
          initialValues={{
            name: prospect.name,
            companyName: prospect.companyName,
            country: prospect.country,
            whatsapp: prospect.whatsapp,
            instagramUrl: prospect.instagramUrl,
            linkedinUrl: prospect.linkedinUrl,
            xUrl: prospect.xUrl,
            email: prospect.email,
            source: prospect.source,
            interestType: prospect.interestType,
            estimatedAmountUsd: prospect.estimatedAmountUsd,
            status: prospect.status,
            nextAction: prospect.nextAction,
            nextActionAt: prospect.nextActionAt,
            notes: prospect.notes,
          }}
          sourceOptions={MINING_SOURCE_OPTIONS}
          interestTypeOptions={MINING_INTEREST_TYPE_OPTIONS}
          statusOptions={MINING_STATUS_OPTIONS}
        />

        <aside className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Capa de operaciones</div>
            <p className="mt-2 text-sm text-white/60">
              Usa esta transición sólo cuando el prospecto ya pasó de interés privado a una venta
              real o casi real.
            </p>

            <div className="mt-4">
              {linkedOperation ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-white">Operación asociada</div>
                  <p className="mt-2 text-sm text-white/60">
                    Este prospecto ya tiene una operación creada y separada del pipeline privado.
                  </p>
                  <Link
                    href={`/backoffice/mining/operations/${linkedOperation.id}`}
                    className="k21-btn-secondary mt-4 inline-flex"
                  >
                    Ver operación
                  </Link>
                </div>
              ) : (
                <PromoteMiningProspectButton prospectId={prospect.id} />
              )}
            </div>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Siguiente paso sugerido</div>
            <div className="mt-3 text-xl font-semibold text-white">
              {prospect.suggestedAction.text}
            </div>
            <p className="mt-2 text-sm text-white/60">
              {prospect.suggestedAction.at
                ? `Fecha sugerida: ${formatDate(prospect.suggestedAction.at)}`
                : "Sin fecha automática sugerida para este estado."}
            </p>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Hitos automáticos</div>
            <div className="mt-4 space-y-3">
              {AUTOMATIC_DATE_LABELS.map((item) => {
                const value = prospect.automaticDates[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="text-sm text-white/80">{item.label}</div>
                    <div className={value ? "text-sm text-white" : "text-sm text-white/35"}>
                      {formatDate(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Resumen de ficha</div>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Contacto principal: {prospect.primaryContactLabel} · {prospect.primaryContactValue}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Monto estimado: {formatUsd(prospect.estimatedAmountUsd)}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Creado: {formatDate(prospect.createdAt)}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Última actualización: {formatDate(prospect.updatedAt)}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
