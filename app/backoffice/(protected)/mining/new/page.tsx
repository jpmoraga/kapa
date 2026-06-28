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
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Mining / Nuevo"
        title="Nuevo prospecto de Mining"
        description="Carga una ficha privada para interesados reales en minería antes de pasar a una operación compartida."
      />

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <MiningProspectForm
          mode="create"
          initialValues={initialValues}
          sourceOptions={MINING_SOURCE_OPTIONS}
          interestTypeOptions={MINING_INTEREST_TYPE_OPTIONS}
          statusOptions={MINING_STATUS_OPTIONS}
        />

        <aside className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Cuándo usar esta ficha</div>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Cuando alguien mostró interés real por minería.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Cuando ya hubo respuesta, consulta, reunión o pedido de información.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                No para prospección fría masiva sin señales de interés.
              </li>
            </ul>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Ayuda operativa</div>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                El país parte en Chile, pero puedes ajustarlo si corresponde.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                La modalidad parte en no definido hasta tener mejor calificación.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                El estado inicial registra automáticamente la primera toma de contacto.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
