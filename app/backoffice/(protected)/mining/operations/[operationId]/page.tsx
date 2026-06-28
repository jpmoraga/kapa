import Link from "next/link";
import { notFound } from "next/navigation";
import BackofficePageHeader from "../../../_components/BackofficePageHeader";
import MiningOperationForm from "../../_components/MiningOperationForm";
import {
  getMiningOperationById,
  MINING_COMMERCIAL_STATUS_OPTIONS,
  MINING_COMMISSION_STATUS_OPTIONS,
  MINING_MONEY_CURRENCY_OPTIONS,
  MINING_OPERATION_PRODUCT_OPTIONS,
  MINING_OPERATIONAL_STATUS_OPTIONS,
  MINING_PARTNER_LEVEL_OPTIONS,
} from "@/lib/backofficeMiningOperations";

type BackofficeMiningOperationPageProps = {
  params: Promise<{ operationId: string }>;
  searchParams?: Promise<{ created?: string; saved?: string; promoted?: string }>;
};

const COMMERCIAL_DATE_LABELS: Array<{ key: string; label: string }> = [
  { key: "contractPreparationAt", label: "Preparación contrato" },
  { key: "contractSentAt", label: "Contrato enviado" },
  { key: "contractSignedAt", label: "Contrato firmado" },
  { key: "paymentPendingAt", label: "Pago pendiente" },
  { key: "paymentReceivedAt", label: "Pago recibido" },
  { key: "paymentProofUploadedAt", label: "Comprobante cargado" },
  { key: "cancelledAt", label: "Cancelada" },
];

const OPERATIONAL_DATE_LABELS: Array<{ key: string; label: string }> = [
  { key: "sharedWithPartnerAt", label: "Lista para Andes" },
  { key: "receivedByAndesAt", label: "Recibida por Andes" },
  { key: "activationPendingAt", label: "Activación pendiente" },
  { key: "activatedAt", label: "Activa" },
  { key: "incidentAt", label: "Incidencia" },
  { key: "closedAt", label: "Cerrada" },
];

function formatDate(value: string | null) {
  if (!value) return "Pendiente";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatMoney(value: string, currency: string) {
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

export default async function BackofficeMiningOperationPage({
  params,
  searchParams,
}: BackofficeMiningOperationPageProps) {
  const { operationId } = await params;
  const sp = searchParams ? await searchParams : {};
  const operation = await getMiningOperationById(operationId);

  if (!operation) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <BackofficePageHeader
        eyebrow="Backoffice / Mining / Operaciones"
        title={operation.clientName}
        description={`${operation.clientCompanyName || "Sin empresa"} · ${operation.country}`}
      />

      {sp.created || sp.saved || sp.promoted ? (
        <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {sp.promoted === "1"
            ? "Operación creada desde el prospecto privado."
            : sp.promoted === "existing"
              ? "El prospecto ya tenía una operación asociada."
              : sp.created
                ? "Operación creada correctamente."
                : "Cambios guardados correctamente."}
        </div>
      ) : null}

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <MiningOperationForm
          key={`${operation.id}:${operation.updatedAt}`}
          mode="edit"
          operationId={operation.id}
          linkedProspect={
            operation.prospect
              ? { id: operation.prospect.id, name: operation.prospect.name }
              : null
          }
          initialValues={{
            clientName: operation.clientName,
            clientCompanyName: operation.clientCompanyName,
            country: operation.country,
            whatsapp: operation.whatsapp,
            email: operation.email,
            instagramUrl: operation.instagramUrl,
            linkedinUrl: operation.linkedinUrl,
            xUrl: operation.xUrl,
            productType: operation.productType,
            productDescription: operation.productDescription,
            asicModel: operation.asicModel,
            quantity: operation.quantity,
            grossSaleAmount: operation.grossSaleAmount,
            grossSaleCurrency: operation.grossSaleCurrency,
            paymentCurrency: operation.paymentCurrency,
            grossSaleAmountClp: operation.grossSaleAmountClp,
            grossSaleAmountBtc: operation.grossSaleAmountBtc,
            commercialStatus: operation.commercialStatus,
            docusignUrl: operation.docusignUrl,
            signedContractUrl: operation.signedContractUrl,
            paymentProofUrl: operation.paymentProofUrl,
            operationalStatus: operation.operationalStatus,
            andesOperationalNotes: operation.andesOperationalNotes,
            partnerLevel: operation.partnerLevel,
            salesCommissionRate: operation.salesCommissionRate,
            salesCommissionAmount: operation.salesCommissionAmount,
            salesCommissionCurrency: operation.salesCommissionCurrency,
            commissionStatus: operation.commissionStatus,
            commissionDueAt: operation.commissionDueAt,
            commissionPaidAt: operation.commissionPaidAt,
            commissionReceivedAt: operation.commissionReceivedAt,
            commissionPaymentProofUrl: operation.commissionPaymentProofUrl,
            monthlyHostingAmount: operation.monthlyHostingAmount,
            monthlyHostingCurrency: operation.monthlyHostingCurrency,
            monthlyHostingCommissionRate: operation.monthlyHostingCommissionRate,
            monthlyHostingCommissionAmount: operation.monthlyHostingCommissionAmount,
            hostingCommissionActive: operation.hostingCommissionActive,
            commissionNotes: operation.commissionNotes,
            nextAction: operation.nextAction,
            nextActionAt: operation.nextActionAt,
            internalNotes: operation.internalNotes,
          }}
          productOptions={MINING_OPERATION_PRODUCT_OPTIONS}
          currencyOptions={MINING_MONEY_CURRENCY_OPTIONS}
          commercialStatusOptions={MINING_COMMERCIAL_STATUS_OPTIONS}
          operationalStatusOptions={MINING_OPERATIONAL_STATUS_OPTIONS}
          partnerLevelOptions={MINING_PARTNER_LEVEL_OPTIONS}
          commissionStatusOptions={MINING_COMMISSION_STATUS_OPTIONS}
        />

        <aside className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Siguiente paso sugerido</div>
            <div className="mt-3 text-xl font-semibold text-white">
              {operation.suggestedAction.text}
            </div>
            <p className="mt-2 text-sm text-white/60">
              {operation.suggestedAction.at
                ? `Fecha sugerida: ${formatDate(operation.suggestedAction.at)}`
                : "Sin fecha automática sugerida para este estado."}
            </p>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Comisión sugerida</div>
            <div className="mt-3 text-white">{operation.commissionSuggestion.summary}</div>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <div>
                Vencimiento sugerido: {formatDate(operation.commissionSuggestion.dueAt)}
              </div>
              <div>Acuerdo partner activo desde 1 de julio de 2026.</div>
            </div>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Hitos comerciales</div>
            <div className="mt-4 space-y-3">
              {COMMERCIAL_DATE_LABELS.map((item) => {
                const value = operation.commercialDates[item.key];
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
            <div className="text-lg font-semibold text-white">Hitos operativos</div>
            <div className="mt-4 space-y-3">
              {OPERATIONAL_DATE_LABELS.map((item) => {
                const value = operation.operationalDates[item.key];
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
                Contacto principal: {operation.primaryContactLabel} · {operation.primaryContactValue}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Venta bruta:{" "}
                {formatMoney(operation.grossSaleAmount, operation.grossSaleCurrency)}
              </div>
              {operation.prospect ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  Prospecto privado vinculado:{" "}
                  <Link
                    href={`/backoffice/mining/${operation.prospect.id}`}
                    className="text-amber-100 underline underline-offset-4"
                  >
                    {operation.prospect.name}
                  </Link>
                </div>
              ) : null}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Creado: {formatDate(operation.createdAt)}
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                Última actualización: {formatDate(operation.updatedAt)}
              </div>
            </div>
          </section>

          <section className="k21-card p-6">
            <div className="text-lg font-semibold text-white">Nota operativa</div>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                No prometer rentabilidades.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                No hablar de ROI garantizado.
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                No presentar el producto como inversión sin riesgo.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
