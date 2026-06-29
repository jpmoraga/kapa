import BackofficePageHeader from "../../_components/BackofficePageHeader";
import MiningProspectForm from "../_components/MiningProspectForm";
import {
  MINING_INTEREST_TYPE_OPTIONS,
  MINING_SOURCE_OPTIONS,
  MINING_STATUS_OPTIONS,
} from "@/lib/backofficeMining";

const initialValues = {
  name: "",
  companyName: "",
  country: "Chile",
  whatsapp: "",
  instagramUrl: "",
  linkedinUrl: "",
  xUrl: "",
  email: "",
  source: "OTHER",
  interestType: "UNDEFINED",
  estimatedAmountUsd: "",
  status: "NEW_INTEREST",
  nextAction: "",
  nextActionAt: "",
  notes: "",
};

export default function BackofficeMiningNewPage() {
  return (
    <div className="mx-auto max-w-[1760px] px-5 py-5 lg:px-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Mining / Nuevo"
        title="Nuevo prospecto de Mining"
        description="Carga una ficha privada para interesados reales en minería antes de pasar a una operación compartida."
      />

      <div className="mt-4 grid gap-5 2xl:grid-cols-[minmax(0,1.62fr)_minmax(300px,0.72fr)]">
        <MiningProspectForm
          mode="create"
          initialValues={initialValues}
          sourceOptions={MINING_SOURCE_OPTIONS}
          interestTypeOptions={MINING_INTEREST_TYPE_OPTIONS}
          statusOptions={MINING_STATUS_OPTIONS}
        />

        <aside className="space-y-4">
          <section className="k21-card border-white/10 bg-white/[0.02] p-5">
            <div className="text-base font-semibold text-white">Cuándo usar esta ficha</div>
            <ul className="mt-3 space-y-2.5 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                Cuando alguien mostró interés real por minería.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                Cuando ya hubo respuesta, consulta, reunión o pedido de información.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                No para prospección fría masiva sin señales de interés.
              </li>
            </ul>
          </section>

          <section className="k21-card border-white/10 bg-white/[0.02] p-5">
            <div className="text-base font-semibold text-white">Ayuda operativa</div>
            <ul className="mt-3 space-y-2.5 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                El país parte en Chile, pero puedes ajustarlo si corresponde.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                La modalidad parte en no definido hasta tener mejor calificación.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                El estado inicial registra automáticamente la primera toma de contacto.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
