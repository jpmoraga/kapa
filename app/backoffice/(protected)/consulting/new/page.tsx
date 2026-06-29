import BackofficePageHeader from "../../_components/BackofficePageHeader";
import ConsultingProspectForm from "../_components/ConsultingProspectForm";
import {
  CONSULTING_BUSINESS_LINE_OPTIONS,
  CONSULTING_CONTACT_STATUS_OPTIONS,
  CONSULTING_EMAIL_STATUS_OPTIONS,
  CONSULTING_PIPELINE_STAGE_OPTIONS,
} from "@/lib/backofficeConsulting";

const initialValues = {
  businessLine: "FLEXIBLE_FUNDING",
  country: "",
  companyName: "",
  contactName: "",
  contactRole: "",
  linkedinUrl: "",
  email: "",
  emailStatus: "UNKNOWN",
  source: "",
  contactStatus: "LINKEDIN_INVITE_SENT",
  pipelineStage: "PROSPECTING",
  nextAction: "",
  nextActionAt: "",
  notes: "",
};

export default function BackofficeConsultingNewPage() {
  return (
    <div className="mx-auto max-w-[1760px] px-5 py-5 lg:px-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Consulting / Nuevo"
        title="Nuevo prospecto"
        description="Crea una ficha comercial nueva con la información mínima necesaria para arrancar el seguimiento."
      />

      <div className="mt-4 grid gap-5 2xl:grid-cols-[minmax(0,1.62fr)_minmax(300px,0.72fr)]">
        <ConsultingProspectForm
          mode="create"
          initialValues={initialValues}
          businessLineOptions={CONSULTING_BUSINESS_LINE_OPTIONS}
          emailStatusOptions={CONSULTING_EMAIL_STATUS_OPTIONS}
          contactStatusOptions={CONSULTING_CONTACT_STATUS_OPTIONS}
          pipelineStageOptions={CONSULTING_PIPELINE_STAGE_OPTIONS}
        />

        <aside className="space-y-4">
          <section className="k21-card border-white/10 bg-white/[0.02] p-5">
            <div className="text-base font-semibold text-white">Checklist de carga</div>
            <p className="mt-2 text-sm text-white/60">
              Antes de guardar, conviene dejar clara la empresa, el contacto objetivo, la línea
              comercial y el estado inicial del acercamiento.
            </p>

            <ul className="mt-3 space-y-2.5 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                Completa empresa, país y línea comercial.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                Agrega LinkedIn o email si ya están disponibles.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                Define una próxima acción sólo si necesitas salirte del flujo sugerido.
              </li>
            </ul>
          </section>

          <section className="k21-card border-white/10 bg-white/[0.02] p-5">
            <div className="text-base font-semibold text-white">Ayuda operativa</div>
            <ul className="mt-3 space-y-2.5 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                Si cambias el estado de contacto, se registra automáticamente la primera fecha
                faltante de ese hito.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                La etapa comercial ayuda a separar prospección, reuniones, propuesta y cierre.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                La próxima acción manual sólo se usa cuando necesitas fijar una acción distinta a
                la sugerida por el sistema.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
