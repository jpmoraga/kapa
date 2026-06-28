import BackofficePageHeader from "../../../_components/BackofficePageHeader";
import MiningOperationForm from "../../_components/MiningOperationForm";
import {
  MINING_COMMERCIAL_STATUS_OPTIONS,
  MINING_COMMISSION_STATUS_OPTIONS,
  MINING_MONEY_CURRENCY_OPTIONS,
  MINING_OPERATION_PRODUCT_OPTIONS,
  MINING_OPERATIONAL_STATUS_OPTIONS,
  MINING_PARTNER_LEVEL_OPTIONS,
} from "@/lib/backofficeMiningOperations";

const initialValues = {
  clientName: "",
  clientCompanyName: "",
  country: "Chile",
  whatsapp: "",
  email: "",
  instagramUrl: "",
  linkedinUrl: "",
  xUrl: "",
  productType: "OTHER",
  productDescription: "",
  asicModel: "",
  quantity: "",
  grossSaleAmount: "",
  grossSaleCurrency: "USD",
  paymentCurrency: "USD",
  grossSaleAmountClp: "",
  grossSaleAmountBtc: "",
  commercialStatus: "CONTRACT_PREPARATION",
  docusignUrl: "",
  signedContractUrl: "",
  paymentProofUrl: "",
  operationalStatus: "NOT_SHARED",
  andesOperationalNotes: "",
  partnerLevel: "BRONZE",
  salesCommissionRate: "",
  salesCommissionAmount: "",
  salesCommissionCurrency: "USD",
  commissionStatus: "PENDING_CALCULATION",
  commissionDueAt: "",
  commissionPaidAt: "",
  commissionReceivedAt: "",
  commissionPaymentProofUrl: "",
  monthlyHostingAmount: "",
  monthlyHostingCurrency: "USD",
  monthlyHostingCommissionRate: "",
  monthlyHostingCommissionAmount: "",
  hostingCommissionActive: false,
  commissionNotes: "",
  nextAction: "",
  nextActionAt: "",
  internalNotes: "",
};

export default function BackofficeMiningOperationNewPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Mining / Operaciones / Nueva"
        title="Nueva operación Mining"
        description="Carga una operación real o en cierre sin mezclarla con el pipeline privado de prospectos."
      />

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <MiningOperationForm
          mode="create"
          initialValues={initialValues}
          productOptions={MINING_OPERATION_PRODUCT_OPTIONS}
          currencyOptions={MINING_MONEY_CURRENCY_OPTIONS}
          commercialStatusOptions={MINING_COMMERCIAL_STATUS_OPTIONS}
          operationalStatusOptions={MINING_OPERATIONAL_STATUS_OPTIONS}
          partnerLevelOptions={MINING_PARTNER_LEVEL_OPTIONS}
          commissionStatusOptions={MINING_COMMISSION_STATUS_OPTIONS}
        />

        <aside className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Cuándo usar esta ficha</div>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Cuando ya hay intención real de avanzar o contrato en preparación.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Cuando el cliente pidió datos de pago, contrato o coordinación operativa.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                No para conversaciones tempranas que aún pertenecen al pipeline privado.
              </li>
            </ul>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Ayuda operativa</div>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                El estado comercial inicial parte en preparación de contrato.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                La operación parte como no compartida hasta decidir cuándo entra Andes.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Los links son por URL; todavía no existe carga real de archivos.
              </li>
            </ul>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Nota operativa</div>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                No prometer rentabilidades ni ROI garantizado.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                No presentar el producto como inversión sin riesgo.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Usar lenguaje educativo, factual y prudente.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
