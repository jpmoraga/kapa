import { notFound } from "next/navigation";
import BackofficePageHeader from "../../_components/BackofficePageHeader";
import ConsultingProspectForm from "../_components/ConsultingProspectForm";
import {
  CONSULTING_BUSINESS_LINE_OPTIONS,
  CONSULTING_CONTACT_STATUS_OPTIONS,
  CONSULTING_EMAIL_STATUS_OPTIONS,
  CONSULTING_PIPELINE_STAGE_OPTIONS,
  getConsultingProspectById,
} from "@/lib/backofficeConsulting";

type BackofficeConsultingProspectPageProps = {
  params: Promise<{ prospectId: string }>;
  searchParams?: Promise<{ created?: string; saved?: string }>;
};

const AUTOMATIC_DATE_LABELS: Array<{ key: string; label: string }> = [
  { key: "linkedinInviteSentAt", label: "Invitación LinkedIn" },
  { key: "linkedinAcceptedAt", label: "LinkedIn aceptado" },
  { key: "linkedinMessageSentAt", label: "Mensaje LinkedIn" },
  { key: "emailSentAt", label: "Email enviado" },
  { key: "respondedAt", label: "Respondió" },
  { key: "meetingScheduledAt", label: "Reunión agendada" },
  { key: "meetingDoneAt", label: "Reunión realizada" },
  { key: "followUp1SentAt", label: "Seguimiento 1" },
  { key: "followUp2SentAt", label: "Seguimiento 2" },
];

function formatDate(value: string | null) {
  if (!value) return "Pendiente";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function BackofficeConsultingProspectPage({
  params,
  searchParams,
}: BackofficeConsultingProspectPageProps) {
  const { prospectId } = await params;
  const sp = searchParams ? await searchParams : {};
  const prospect = await getConsultingProspectById(prospectId);

  if (!prospect) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Consulting / Prospecto"
        title={prospect.companyName}
        description={`${prospect.contactName} · ${prospect.contactRole} · ${prospect.country}`}
      />

      {sp.created || sp.saved ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {sp.created ? "Prospecto creado correctamente." : "Cambios guardados correctamente."}
        </div>
      ) : null}

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <ConsultingProspectForm
          key={`${prospect.id}:${prospect.updatedAt}`}
          mode="edit"
          prospectId={prospect.id}
          initialValues={{
            businessLine: prospect.businessLine,
            country: prospect.country,
            companyName: prospect.companyName,
            contactName: prospect.contactName,
            contactRole: prospect.contactRole,
            linkedinUrl: prospect.linkedinUrl,
            email: prospect.email,
            emailStatus: prospect.emailStatus,
            source: prospect.source,
            contactStatus: prospect.contactStatus,
            pipelineStage: prospect.pipelineStage,
            nextAction: prospect.nextAction,
            nextActionAt: prospect.nextActionAt,
            notes: prospect.notes,
          }}
          businessLineOptions={CONSULTING_BUSINESS_LINE_OPTIONS}
          emailStatusOptions={CONSULTING_EMAIL_STATUS_OPTIONS}
          contactStatusOptions={CONSULTING_CONTACT_STATUS_OPTIONS}
          pipelineStageOptions={CONSULTING_PIPELINE_STAGE_OPTIONS}
        />

        <aside className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Siguiente paso sugerido</div>
            <div className="mt-3 text-xl font-semibold text-white">
              {prospect.suggestedAction.text}
            </div>
            <p className="mt-2 text-sm text-white/60">
              {prospect.suggestedAction.at
                ? `Fecha sugerida: ${formatDate(prospect.suggestedAction.at)}`
                : "Sin fecha automática sugerida para este caso."}
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
                Creado: {formatDate(prospect.createdAt)}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Última actualización: {formatDate(prospect.updatedAt)}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Próxima acción manual: {prospect.nextAction || "No definida"}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
