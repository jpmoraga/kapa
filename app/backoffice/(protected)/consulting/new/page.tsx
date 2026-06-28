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
    <div className="mx-auto max-w-7xl px-6 py-8">
      <BackofficePageHeader
        eyebrow="Backoffice / Consulting / Nuevo"
        title="Nuevo prospecto"
        description="Alta controlada dentro del módulo Consulting, sin reutilizar rutas ni controladores del admin antiguo."
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <ConsultingProspectForm
          mode="create"
          initialValues={initialValues}
          businessLineOptions={CONSULTING_BUSINESS_LINE_OPTIONS}
          emailStatusOptions={CONSULTING_EMAIL_STATUS_OPTIONS}
          contactStatusOptions={CONSULTING_CONTACT_STATUS_OPTIONS}
          pipelineStageOptions={CONSULTING_PIPELINE_STAGE_OPTIONS}
        />

        <aside className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Qué se guarda</div>
            <p className="mt-2 text-sm text-white/60">
              La ficha inicial registra empresa, contacto, línea de negocio y estado comercial.
              Desde aquí el equipo puede iterar sin tocar{" "}
              <code className="rounded bg-white/5 px-1 py-0.5 text-white/75">/admin</code> ni{" "}
              <code className="rounded bg-white/5 px-1 py-0.5 text-white/75">
                /api/admin
              </code>
              .
            </p>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Automatismos MVP</div>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <code className="rounded bg-white/5 px-1 py-0.5 text-white/75">
                  contactStatus
                </code>{" "}
                dispara el primer timestamp vacío del hito asociado.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <code className="rounded bg-white/5 px-1 py-0.5 text-white/75">
                  pipelineStage
                </code>{" "}
                permite separar prospecting, reuniones, propuesta y diagnóstico.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <code className="rounded bg-white/5 px-1 py-0.5 text-white/75">nextAction</code>{" "}
                y{" "}
                <code className="rounded bg-white/5 px-1 py-0.5 text-white/75">
                  nextActionAt
                </code>{" "}
                pisan la sugerencia automática sólo para ese caso.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
