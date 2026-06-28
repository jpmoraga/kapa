"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FormOption = {
  value: string;
  label: string;
};

type MiningOperationFormValues = {
  clientName: string;
  clientCompanyName: string;
  country: string;
  whatsapp: string;
  email: string;
  instagramUrl: string;
  linkedinUrl: string;
  xUrl: string;
  productType: string;
  productDescription: string;
  asicModel: string;
  quantity: string;
  grossSaleAmount: string;
  grossSaleCurrency: string;
  paymentCurrency: string;
  grossSaleAmountClp: string;
  grossSaleAmountBtc: string;
  commercialStatus: string;
  docusignUrl: string;
  signedContractUrl: string;
  paymentProofUrl: string;
  operationalStatus: string;
  andesOperationalNotes: string;
  salesCommissionRate: string;
  salesCommissionAmount: string;
  salesCommissionCurrency: string;
  commissionStatus: string;
  commissionDueAt: string;
  commissionPaidAt: string;
  commissionReceivedAt: string;
  commissionPaymentProofUrl: string;
  monthlyHostingAmount: string;
  monthlyHostingCurrency: string;
  monthlyHostingCommissionRate: string;
  monthlyHostingCommissionAmount: string;
  hostingCommissionActive: boolean;
  commissionNotes: string;
  nextAction: string;
  nextActionAt: string;
  internalNotes: string;
};

type MiningOperationFormProps = {
  mode: "create" | "edit";
  operationId?: string;
  linkedProspect?: {
    id: string;
    name: string;
    sourceLabel: string;
  } | null;
  commercialDates?: {
    contractPreparationAt: string | null;
    contractSentAt: string | null;
    contractSignedAt: string | null;
    paymentPendingAt: string | null;
    paymentReceivedAt: string | null;
    paymentProofUploadedAt: string | null;
    cancelledAt?: string | null;
  };
  operationalDates?: {
    sharedWithPartnerAt: string | null;
    receivedByAndesAt: string | null;
    activationPendingAt: string | null;
    activatedAt: string | null;
    incidentAt: string | null;
    closedAt: string | null;
  };
  commissionPreviewSeed: {
    nextProbableSaleSequence: number;
    currentConfirmedSequence: number | null;
    agreementStartLabel: string;
    initialSuggestedDueAt: string | null;
  };
  initialValues: MiningOperationFormValues;
  productOptions: readonly FormOption[];
  currencyOptions: readonly FormOption[];
  commercialStatusOptions: readonly FormOption[];
  operationalStatusOptions: readonly FormOption[];
  commissionStatusOptions: readonly FormOption[];
};

type SaveIntent = "back" | "stay";

const FIELD_CLASS_NAME =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none placeholder:text-white/25 focus:border-white/20 focus:ring-2 focus:ring-white/15";

const LABEL_CLASS_NAME = "text-sm font-medium text-white/80";
const SECTION_CLASS_NAME = "rounded-2xl border border-white/10 bg-white/[0.03] p-5";
const PARTNER_LEVEL_LABELS = {
  BRONZE: "Bronce",
  SILVER: "Plata",
  GOLD: "Oro",
} as const;
const FRACTIONAL_SALES_RATES = {
  BRONZE: 0.05,
  SILVER: 0.05,
  GOLD: 0.07,
} as const;
const ASIC_HOSTING_SALES_RATES = {
  BRONZE: 0.07,
  SILVER: 0.08,
  GOLD: 0.09,
} as const;
const COMMERCIAL_MILESTONE_LABELS = [
  { key: "contractPreparationAt", label: "Preparación contrato" },
  { key: "contractSentAt", label: "Contrato enviado" },
  { key: "contractSignedAt", label: "Contrato firmado" },
  { key: "paymentPendingAt", label: "Pago pendiente" },
  { key: "paymentReceivedAt", label: "Pago recibido" },
  { key: "paymentProofUploadedAt", label: "Comprobante cargado" },
] as const;
const OPERATIONAL_MILESTONE_LABELS = [
  { key: "sharedWithPartnerAt", label: "Lista para Andes" },
  { key: "receivedByAndesAt", label: "Recibida por Andes" },
  { key: "activationPendingAt", label: "Activación pendiente" },
  { key: "activatedAt", label: "Activa" },
  { key: "incidentAt", label: "Incidencia" },
  { key: "closedAt", label: "Cerrada" },
] as const;
const MONTHLY_HOSTING_RATE = 0.01;
const CONFIRMED_SALE_STATUSES = new Set(["PAYMENT_RECEIVED", "PAYMENT_PROOF_UPLOADED"]);

function readSaveIntent(event: React.FormEvent<HTMLFormElement>): SaveIntent {
  const nativeEvent = event.nativeEvent as SubmitEvent;
  const submitter = nativeEvent.submitter as HTMLButtonElement | null;
  return submitter?.value === "stay" ? "stay" : "back";
}

function parseNumber(value: string) {
  const normalized = value.replace(/\$/g, "").replace(/\s+/g, "").replace(/,/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatInputNumber(value: number | null, maximumFractionDigits = 8) {
  if (value === null || !Number.isFinite(value)) return "";
  return value.toFixed(maximumFractionDigits).replace(/\.?0+$/, "");
}

function matchesSuggestedNumber(value: string, suggestion: number | null) {
  const parsed = parseNumber(value);
  if (parsed === null && suggestion === null) return true;
  if (parsed === null || suggestion === null) return false;
  return Math.abs(parsed - suggestion) < 0.00000001;
}

function formatCurrencyPreview(value: number | null, currency: string) {
  if (value === null || !Number.isFinite(value)) return "Pendiente";

  if (currency === "CLP") {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (currency === "BTC") {
    return `BTC ${value.toFixed(8)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRatePreview(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Pendiente";
  return `${(value * 100).toFixed(2)}%`;
}

function formatDatePreview(value: string | null) {
  if (!value) return "Se sugerirá al confirmar el pago.";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatRecordedDate(value: string | null | undefined) {
  if (!value) return "Pendiente";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function levelForSaleSequence(sequence: number) {
  if (sequence >= 16) return "GOLD" as const;
  if (sequence >= 6) return "SILVER" as const;
  return "BRONZE" as const;
}

function salesRateForPreview(productType: string, level: keyof typeof PARTNER_LEVEL_LABELS) {
  if (productType === "FRACTIONAL_MINING" || productType === "TOKENIZED_MINING") {
    return FRACTIONAL_SALES_RATES[level];
  }

  if (productType === "ASIC_HOSTING") {
    return ASIC_HOSTING_SALES_RATES[level];
  }

  return null;
}

function deriveCommissionPreview(
  form: MiningOperationFormValues,
  seed: MiningOperationFormProps["commissionPreviewSeed"]
) {
  const isConfirmed = CONFIRMED_SALE_STATUSES.has(form.commercialStatus);
  const saleSequence = isConfirmed
    ? seed.currentConfirmedSequence ?? seed.nextProbableSaleSequence
    : seed.nextProbableSaleSequence;
  const partnerLevel = levelForSaleSequence(saleSequence);
  const salesRate = salesRateForPreview(form.productType, partnerLevel);
  const grossSaleAmount = parseNumber(form.grossSaleAmount);
  const suggestedSalesAmount =
    salesRate !== null && grossSaleAmount !== null ? grossSaleAmount * salesRate : null;
  const monthlyHostingAmount = parseNumber(form.monthlyHostingAmount);
  const suggestedHostingAmount =
    form.hostingCommissionActive && monthlyHostingAmount !== null
      ? monthlyHostingAmount * MONTHLY_HOSTING_RATE
      : null;
  const hasSingleSaleCommission =
    form.productType === "FRACTIONAL_MINING" ||
    form.productType === "TOKENIZED_MINING" ||
    form.productType === "ASIC_HOSTING";
  const suggestedSalesRateLabel = hasSingleSaleCommission
    ? formatRatePreview(salesRate)
    : form.productType === "HOSTING_ONLY"
      ? "No aplica"
      : "Pendiente";
  const suggestedSalesAmountLabel = hasSingleSaleCommission
    ? formatCurrencyPreview(suggestedSalesAmount, form.grossSaleCurrency)
    : form.productType === "HOSTING_ONLY"
      ? "No aplica"
      : "Pendiente";

  return {
    saleSequence,
    partnerLevel,
    partnerLevelLabel: PARTNER_LEVEL_LABELS[partnerLevel],
    isEstimated: !isConfirmed,
    hasSuggestedSalesCommission: hasSingleSaleCommission,
    salesRate,
    suggestedSalesAmount,
    suggestedSalesRateInputValue: formatInputNumber(salesRate, 4),
    suggestedSalesAmountInputValue: formatInputNumber(suggestedSalesAmount, 8),
    suggestedSalesAmountLabel,
    suggestedSalesRateLabel,
    suggestedHostingRateLabel:
      form.hostingCommissionActive && monthlyHostingAmount !== null
        ? formatRatePreview(MONTHLY_HOSTING_RATE)
        : "No aplica",
    suggestedHostingAmountLabel:
      form.hostingCommissionActive && monthlyHostingAmount !== null
        ? formatCurrencyPreview(suggestedHostingAmount, form.monthlyHostingCurrency)
        : "No aplica",
    dueAtLabel: isConfirmed
      ? formatDatePreview(seed.initialSuggestedDueAt)
      : "Se calculará 30 días después de confirmar el pago.",
  };
}

function pickPrimaryContactFromForm(form: MiningOperationFormValues) {
  if (form.whatsapp.trim()) {
    return { label: "WhatsApp", value: form.whatsapp.trim() };
  }
  if (form.email.trim()) {
    return { label: "Email", value: form.email.trim() };
  }
  if (form.instagramUrl.trim()) {
    return { label: "Instagram", value: form.instagramUrl.trim() };
  }
  if (form.linkedinUrl.trim()) {
    return { label: "LinkedIn", value: form.linkedinUrl.trim() };
  }
  if (form.xUrl.trim()) {
    return { label: "X / Twitter", value: form.xUrl.trim() };
  }
  return { label: "Contacto", value: "Sin canal definido" };
}

export default function MiningOperationForm({
  mode,
  operationId,
  linkedProspect,
  commercialDates,
  operationalDates,
  commissionPreviewSeed,
  initialValues,
  productOptions,
  currencyOptions,
  commercialStatusOptions,
  operationalStatusOptions,
  commissionStatusOptions,
}: MiningOperationFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialValues);
  const [salesRateTouched, setSalesRateTouched] = useState(false);
  const [salesAmountTouched, setSalesAmountTouched] = useState(false);
  const [loading, setLoading] = useState<SaveIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const commissionPreview = deriveCommissionPreview(form, commissionPreviewSeed);
  const salesFieldsTouched = salesRateTouched || salesAmountTouched;
  const hasStoredSalesValues = Boolean(
    form.salesCommissionRate.trim() || form.salesCommissionAmount.trim()
  );
  const storedSalesDiffersFromSuggestion =
    hasStoredSalesValues &&
    (!matchesSuggestedNumber(form.salesCommissionRate, commissionPreview.salesRate) ||
      !matchesSuggestedNumber(
        form.salesCommissionAmount,
        commissionPreview.suggestedSalesAmount
      ));
  const shouldMaskStoredSalesValues =
    !salesFieldsTouched &&
    form.commissionStatus === "PENDING_CALCULATION" &&
    commissionPreview.hasSuggestedSalesCommission &&
    hasStoredSalesValues;
  const recordedSalesRateValue = parseNumber(form.salesCommissionRate);
  const recordedSalesAmountValue = parseNumber(form.salesCommissionAmount);
  const recordedSalesParts = [
    recordedSalesRateValue !== null ? formatRatePreview(recordedSalesRateValue) : null,
    recordedSalesAmountValue !== null
      ? formatCurrencyPreview(recordedSalesAmountValue, form.salesCommissionCurrency)
      : null,
  ].filter(Boolean);
  const currentPrimaryContact = pickPrimaryContactFromForm(form);

  function updateField<K extends keyof MiningOperationFormValues>(
    field: K,
    value: MiningOperationFormValues[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateSalesCommissionRate(value: string) {
    setSalesRateTouched(true);
    updateField("salesCommissionRate", value);
  }

  function updateSalesCommissionAmount(value: string) {
    setSalesAmountTouched(true);
    updateField("salesCommissionAmount", value);
  }

  function useSuggestedSalesCommission() {
    setSalesRateTouched(true);
    setSalesAmountTouched(true);
    setForm((current) => ({
      ...current,
      salesCommissionRate: "",
      salesCommissionAmount: "",
      salesCommissionCurrency: current.grossSaleCurrency,
    }));
  }

  function renderContactInputs(title: string, description: string) {
    return (
      <div className={SECTION_CLASS_NAME}>
        <div>
          <div className="text-base font-semibold text-white">{title}</div>
          <p className="mt-1 text-sm text-white/55">{description}</p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <label className={LABEL_CLASS_NAME}>Cliente</label>
            <input
              className={FIELD_CLASS_NAME}
              value={form.clientName}
              onChange={(event) => updateField("clientName", event.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>

          <div>
            <label className={LABEL_CLASS_NAME}>Empresa</label>
            <input
              className={FIELD_CLASS_NAME}
              value={form.clientCompanyName}
              onChange={(event) => updateField("clientCompanyName", event.target.value)}
              placeholder="Empresa u organización"
            />
          </div>

          <div>
            <label className={LABEL_CLASS_NAME}>País</label>
            <input
              className={FIELD_CLASS_NAME}
              value={form.country}
              onChange={(event) => updateField("country", event.target.value)}
              placeholder="Chile"
            />
          </div>

          <div>
            <label className={LABEL_CLASS_NAME}>WhatsApp</label>
            <input
              className={FIELD_CLASS_NAME}
              value={form.whatsapp}
              onChange={(event) => updateField("whatsapp", event.target.value)}
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div>
            <label className={LABEL_CLASS_NAME}>Email</label>
            <input
              className={FIELD_CLASS_NAME}
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="persona@empresa.com"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="lg:col-span-2">
            <label className={LABEL_CLASS_NAME}>Instagram</label>
            <input
              className={FIELD_CLASS_NAME}
              value={form.instagramUrl}
              onChange={(event) => updateField("instagramUrl", event.target.value)}
              placeholder="https://instagram.com/..."
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="lg:col-span-2">
            <label className={LABEL_CLASS_NAME}>LinkedIn</label>
            <input
              className={FIELD_CLASS_NAME}
              value={form.linkedinUrl}
              onChange={(event) => updateField("linkedinUrl", event.target.value)}
              placeholder="https://linkedin.com/in/..."
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="lg:col-span-2">
            <label className={LABEL_CLASS_NAME}>X / Twitter</label>
            <input
              className={FIELD_CLASS_NAME}
              value={form.xUrl}
              onChange={(event) => updateField("xUrl", event.target.value)}
              placeholder="https://x.com/..."
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saveIntent = readSaveIntent(event);

    setLoading(saveIntent);
    setError(null);

    const endpoint =
      mode === "create"
        ? "/api/backoffice/mining/operations"
        : `/api/backoffice/mining/operations/${operationId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      id?: string;
    };

    setLoading(null);

    if (!response.ok) {
      setError(payload.error ?? "No fue posible guardar la operación.");
      return;
    }

    if (mode === "create") {
      if (saveIntent === "stay" && payload.id) {
        router.replace(`/backoffice/mining/operations/${payload.id}?created=1`);
        return;
      }

      router.push("/backoffice/mining/operations");
      router.refresh();
      return;
    }

    if (saveIntent === "stay" && operationId) {
      router.replace(`/backoffice/mining/operations/${operationId}?saved=${Date.now()}`);
      return;
    }

    router.push("/backoffice/mining/operations");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="k21-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">
              {mode === "create" ? "Nueva operación" : "Edición de operación"}
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {mode === "create" ? "Cargar operación de Mining" : "Actualizar operación"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              Registra ventas reales o en cierre sin mezclar el pipeline privado con la capa
              operativa compartible.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {linkedProspect ? (
              <Link href={`/backoffice/mining/${linkedProspect.id}`} className="k21-btn-secondary">
                Ver prospecto privado
              </Link>
            ) : null}
            <Link href="/backoffice/mining/operations" className="k21-btn-secondary">
              Volver a operaciones
            </Link>
          </div>
        </div>
      </section>

      <section className="k21-card p-6">
        <div className="grid gap-5">
          {linkedProspect ? (
            <div className={SECTION_CLASS_NAME}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-white">
                    Datos heredados del prospecto
                  </div>
                  <p className="mt-1 max-w-3xl text-sm text-white/55">
                    Esta operación nace desde
                    {" "}
                    <span className="font-medium text-white">{linkedProspect.name}</span>. Los
                    datos de contacto se muestran como contexto y el foco operativo queda en
                    producto, contrato, pago, comisión y activación.
                  </p>
                </div>

                <Link
                  href={`/backoffice/mining/${linkedProspect.id}`}
                  className="k21-btn-secondary"
                >
                  Ver prospecto privado
                </Link>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Cliente", value: form.clientName || linkedProspect.name },
                  { label: "Empresa", value: form.clientCompanyName || "Sin empresa" },
                  { label: "País", value: form.country || "Chile" },
                  {
                    label: "Contacto principal",
                    value: `${currentPrimaryContact.label} · ${currentPrimaryContact.value}`,
                  },
                  { label: "WhatsApp", value: form.whatsapp || "No definido" },
                  { label: "Email", value: form.email || "No definido" },
                  { label: "Instagram", value: form.instagramUrl || "No definido" },
                  { label: "LinkedIn", value: form.linkedinUrl || "No definido" },
                  { label: "X / Twitter", value: form.xUrl || "No definido" },
                  { label: "Origen del prospecto", value: linkedProspect.sourceLabel },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="text-xs uppercase tracking-wide text-white/40">
                      {item.label}
                    </div>
                    <div className="mt-2 break-all text-sm font-medium text-white">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            renderContactInputs(
              "Operación sin prospecto asociado",
              "Fue creada antes de centralizar el flujo. En este caso los datos de cliente siguen siendo editables porque no existe un prospecto base desde donde heredarlos."
            )
          )}

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Producto y venta</div>
              <p className="mt-1 text-sm text-white/55">
                Modalidad comercial, monto bruto y referencias útiles para el cierre.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className={LABEL_CLASS_NAME}>Producto</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.productType}
                  onChange={(event) => updateField("productType", event.target.value)}
                >
                  {productOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Modelo ASIC</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.asicModel}
                  onChange={(event) => updateField("asicModel", event.target.value)}
                  placeholder="S21, M60, etc."
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Cantidad</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.quantity}
                  onChange={(event) => updateField("quantity", event.target.value)}
                  placeholder="10"
                  inputMode="numeric"
                />
              </div>

              <div className="xl:col-span-3">
                <label className={LABEL_CLASS_NAME}>Descripción del producto</label>
                <textarea
                  className={`${FIELD_CLASS_NAME} min-h-28 resize-y`}
                  value={form.productDescription}
                  onChange={(event) => updateField("productDescription", event.target.value)}
                  placeholder="Contexto comercial, alcance y modalidad acordada."
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Monto venta bruta</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.grossSaleAmount}
                  onChange={(event) => updateField("grossSaleAmount", event.target.value)}
                  placeholder="25000"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Moneda venta</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.grossSaleCurrency}
                  onChange={(event) => updateField("grossSaleCurrency", event.target.value)}
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Moneda pago</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.paymentCurrency}
                  onChange={(event) => updateField("paymentCurrency", event.target.value)}
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Monto equivalente CLP</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.grossSaleAmountClp}
                  onChange={(event) => updateField("grossSaleAmountClp", event.target.value)}
                  placeholder="24000000"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Monto equivalente BTC</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.grossSaleAmountBtc}
                  onChange={(event) => updateField("grossSaleAmountBtc", event.target.value)}
                  placeholder="0.25000000"
                  inputMode="decimal"
                />
              </div>
            </div>
          </div>

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Contrato y pago</div>
              <p className="mt-1 text-sm text-white/55">
                Estado comercial, URLs de cierre y hitos automáticos visibles del proceso.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <label className={LABEL_CLASS_NAME}>Estado comercial</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.commercialStatus}
                  onChange={(event) => updateField("commercialStatus", event.target.value)}
                >
                  {commercialStatusOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>DocuSign</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.docusignUrl}
                  onChange={(event) => updateField("docusignUrl", event.target.value)}
                  placeholder="https://..."
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Contrato firmado</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.signedContractUrl}
                  onChange={(event) => updateField("signedContractUrl", event.target.value)}
                  placeholder="https://..."
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Comprobante de pago</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.paymentProofUrl}
                  onChange={(event) => updateField("paymentProofUrl", event.target.value)}
                  placeholder="https://..."
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>

              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-medium text-white/85">
                    Hitos automáticos del cierre comercial
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {COMMERCIAL_MILESTONE_LABELS.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-xl border border-white/10 bg-black/10 px-4 py-3"
                      >
                        <div className="text-xs uppercase tracking-wide text-white/40">
                          {item.label}
                        </div>
                        <div className="mt-2 text-sm font-medium text-white">
                          {formatRecordedDate(commercialDates?.[item.key] ?? null)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Comisión Kapa21</div>
              <p className="mt-1 text-sm text-white/55">
                El nivel se calcula según las ventas acumuladas de Kapa21 con Andes SolarHash
                desde el {commissionPreviewSeed.agreementStartLabel}.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-amber-100/70">
                  Venta acumulada sugerida
                </div>
                <div className="mt-2 text-2xl font-semibold text-amber-50">
                  #{commissionPreview.saleSequence}
                </div>
                <div className="mt-2 text-xs text-amber-100/70">
                  {commissionPreview.isEstimated ? "Estimado mientras no exista pago confirmado." : "Venta confirmada dentro del programa partner."}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/45">Nivel Kapa21 sugerido</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {commissionPreview.partnerLevelLabel}
                </div>
                <div className="mt-2 text-xs text-white/50">
                  Se asigna por secuencia acumulada del partner, no del cliente.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/45">Tasa sugerida venta</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {commissionPreview.suggestedSalesRateLabel}
                </div>
                <div className="mt-2 text-xs text-white/50">
                  Según producto y nivel Kapa21 al momento de esta venta.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/45">Comisión sugerida venta</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {commissionPreview.suggestedSalesAmountLabel}
                </div>
                <div className="mt-2 text-xs text-white/50">
                  Base: venta bruta pagada antes de impuestos y costos de procesamiento.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/45">Hosting recurrente sugerido</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {commissionPreview.suggestedHostingRateLabel}
                </div>
                <div className="mt-2 text-sm text-white/60">
                  {commissionPreview.suggestedHostingAmountLabel}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-white/45">Vencimiento sugerido</div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {commissionPreview.dueAtLabel}
                </div>
                <div className="mt-2 text-xs text-white/50">
                  Pago dentro de 30 días posteriores a la confirmación del pago del cliente.
                </div>
              </div>

              <div className="lg:col-span-2 xl:col-span-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-white/85">Ajuste manual opcional</div>
                    <div className="mt-1 text-xs text-white/50">
                      Deja estos campos vacíos para usar la sugerencia actual. Úsalos sólo para
                      registrar un valor final distinto.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={useSuggestedSalesCommission}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-white/25 hover:text-white"
                  >
                    Usar sugerencia
                  </button>
                </div>
              </div>

              {shouldMaskStoredSalesValues && storedSalesDiffersFromSuggestion ? (
                <div className="lg:col-span-2 xl:col-span-3 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100/85">
                  Existe un valor final registrado distinto a la sugerencia actual:
                  {recordedSalesParts.length ? ` ${recordedSalesParts.join(" · ")}.` : ""}
                  Mientras el estado siga en pendiente de cálculo, arriba se prioriza la
                  sugerencia recalculada.
                </div>
              ) : null}

              <div>
                <label className={LABEL_CLASS_NAME}>Tasa final registrada</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={shouldMaskStoredSalesValues ? "" : form.salesCommissionRate}
                  onChange={(event) => updateSalesCommissionRate(event.target.value)}
                  placeholder={
                    commissionPreview.suggestedSalesRateInputValue
                      ? `Usar sugerencia: ${commissionPreview.suggestedSalesRateInputValue}`
                      : "Sin sugerencia automática"
                  }
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Monto final registrado</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={shouldMaskStoredSalesValues ? "" : form.salesCommissionAmount}
                  onChange={(event) => updateSalesCommissionAmount(event.target.value)}
                  placeholder={
                    commissionPreview.suggestedSalesAmountInputValue
                      ? `Usar sugerencia: ${commissionPreview.suggestedSalesAmountInputValue}`
                      : "Sin sugerencia automática"
                  }
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Moneda final registrada</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.salesCommissionCurrency}
                  onChange={(event) => updateField("salesCommissionCurrency", event.target.value)}
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Estado comisión</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.commissionStatus}
                  onChange={(event) => updateField("commissionStatus", event.target.value)}
                >
                  {commissionStatusOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={form.hostingCommissionActive}
                    onChange={(event) =>
                      updateField("hostingCommissionActive", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  Activar comisión recurrente de hosting
                </label>
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Vencimiento comisión</label>
                <input
                  className={FIELD_CLASS_NAME}
                  type="date"
                  value={form.commissionDueAt}
                  onChange={(event) => updateField("commissionDueAt", event.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Comisión pagada</label>
                <input
                  className={FIELD_CLASS_NAME}
                  type="date"
                  value={form.commissionPaidAt}
                  onChange={(event) => updateField("commissionPaidAt", event.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Comisión recibida</label>
                <input
                  className={FIELD_CLASS_NAME}
                  type="date"
                  value={form.commissionReceivedAt}
                  onChange={(event) => updateField("commissionReceivedAt", event.target.value)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Monto mensual hosting</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.monthlyHostingAmount}
                  onChange={(event) => updateField("monthlyHostingAmount", event.target.value)}
                  placeholder="500"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Moneda hosting</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.monthlyHostingCurrency}
                  onChange={(event) => updateField("monthlyHostingCurrency", event.target.value)}
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Tasa comisión hosting</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.monthlyHostingCommissionRate}
                  onChange={(event) =>
                    updateField("monthlyHostingCommissionRate", event.target.value)
                  }
                  placeholder="0.01"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Monto comisión hosting</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.monthlyHostingCommissionAmount}
                  onChange={(event) =>
                    updateField("monthlyHostingCommissionAmount", event.target.value)
                  }
                  placeholder="5"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Comprobante comisión</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.commissionPaymentProofUrl}
                  onChange={(event) =>
                    updateField("commissionPaymentProofUrl", event.target.value)
                  }
                  placeholder="https://..."
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>
          </div>

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">
                Estado operativo / activación
              </div>
              <p className="mt-1 text-sm text-white/55">
                Seguimiento operativo interno pensado para la futura coordinación con Andes.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <label className={LABEL_CLASS_NAME}>Estado operativo</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.operationalStatus}
                  onChange={(event) => updateField("operationalStatus", event.target.value)}
                >
                  {operationalStatusOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className={LABEL_CLASS_NAME}>Notas operativas Andes</label>
                <textarea
                  className={`${FIELD_CLASS_NAME} min-h-28 resize-y`}
                  value={form.andesOperationalNotes}
                  onChange={(event) => updateField("andesOperationalNotes", event.target.value)}
                  placeholder="Recepción, activación, incidentes o contexto operativo compartible."
                />
              </div>

              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-medium text-white/85">
                    Hitos automáticos de activación
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {OPERATIONAL_MILESTONE_LABELS.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-xl border border-white/10 bg-black/10 px-4 py-3"
                      >
                        <div className="text-xs uppercase tracking-wide text-white/40">
                          {item.label}
                        </div>
                        <div className="mt-2 text-sm font-medium text-white">
                          {formatRecordedDate(operationalDates?.[item.key] ?? null)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Notas y seguimiento</div>
              <p className="mt-1 text-sm text-white/55">
                Separa el seguimiento manual, el contexto privado de cierre y las notas de
                comisión sin mezclarlo con la capa comercial del prospecto.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label className={LABEL_CLASS_NAME}>Próxima acción manual</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.nextAction}
                  onChange={(event) => updateField("nextAction", event.target.value)}
                  placeholder="Enviar contrato, pedir comprobante, confirmar recepción"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Fecha próxima acción</label>
                <input
                  className={FIELD_CLASS_NAME}
                  type="date"
                  value={form.nextActionAt}
                  onChange={(event) => updateField("nextActionAt", event.target.value)}
                />
              </div>

              <div className="lg:col-span-2">
                <label className={LABEL_CLASS_NAME}>Notas internas de cierre</label>
                <textarea
                  className={`${FIELD_CLASS_NAME} min-h-32 resize-y`}
                  value={form.internalNotes}
                  onChange={(event) => updateField("internalNotes", event.target.value)}
                  placeholder="Contexto comercial privado, objeciones, acuerdos y detalles internos."
                />
              </div>

              <div className="lg:col-span-2">
                <label className={LABEL_CLASS_NAME}>Notas de comisión</label>
                <textarea
                  className={`${FIELD_CLASS_NAME} min-h-28 resize-y`}
                  value={form.commissionNotes}
                  onChange={(event) => updateField("commissionNotes", event.target.value)}
                  placeholder="Criterio manual, diferencias con la sugerencia o seguimiento de cobro."
                />
              </div>
            </div>
          </div>

          {linkedProspect ? (
            <details className={SECTION_CLASS_NAME}>
              <summary className="cursor-pointer list-none text-base font-semibold text-white">
                Ajuste excepcional de datos de cliente
              </summary>
              <p className="mt-2 text-sm text-white/55">
                Úsalo sólo cuando necesites registrar una diferencia real respecto del prospecto
                original. El flujo normal sigue siendo operar con los datos heredados.
              </p>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS_NAME}>Cliente</label>
                  <input
                    className={FIELD_CLASS_NAME}
                    value={form.clientName}
                    onChange={(event) => updateField("clientName", event.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS_NAME}>Empresa</label>
                  <input
                    className={FIELD_CLASS_NAME}
                    value={form.clientCompanyName}
                    onChange={(event) => updateField("clientCompanyName", event.target.value)}
                    placeholder="Empresa u organización"
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS_NAME}>País</label>
                  <input
                    className={FIELD_CLASS_NAME}
                    value={form.country}
                    onChange={(event) => updateField("country", event.target.value)}
                    placeholder="Chile"
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS_NAME}>WhatsApp</label>
                  <input
                    className={FIELD_CLASS_NAME}
                    value={form.whatsapp}
                    onChange={(event) => updateField("whatsapp", event.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS_NAME}>Email</label>
                  <input
                    className={FIELD_CLASS_NAME}
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="persona@empresa.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className={LABEL_CLASS_NAME}>Instagram</label>
                  <input
                    className={FIELD_CLASS_NAME}
                    value={form.instagramUrl}
                    onChange={(event) => updateField("instagramUrl", event.target.value)}
                    placeholder="https://instagram.com/..."
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className={LABEL_CLASS_NAME}>LinkedIn</label>
                  <input
                    className={FIELD_CLASS_NAME}
                    value={form.linkedinUrl}
                    onChange={(event) => updateField("linkedinUrl", event.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className={LABEL_CLASS_NAME}>X / Twitter</label>
                  <input
                    className={FIELD_CLASS_NAME}
                    value={form.xUrl}
                    onChange={(event) => updateField("xUrl", event.target.value)}
                    placeholder="https://x.com/..."
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
              </div>
            </details>
          ) : null}
        </div>
      </section>

      <section className="k21-card p-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
          Al cambiar estados comerciales u operativos, el sistema completa automáticamente el
          primer hito faltante correspondiente sin sobrescribir fechas ya registradas.
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="submit"
            value="back"
            disabled={Boolean(loading)}
            className="k21-btn-primary min-w-56 disabled:opacity-60"
          >
            {loading === "back" ? "Guardando…" : "Guardar y volver a operaciones"}
          </button>

          <button
            type="submit"
            value="stay"
            disabled={Boolean(loading)}
            className="k21-btn-secondary min-w-56 disabled:opacity-60"
          >
            {loading === "stay" ? "Guardando…" : "Guardar y seguir editando"}
          </button>

          <Link href="/backoffice/mining/operations" className="k21-btn-secondary">
            Volver a operaciones
          </Link>
        </div>
      </section>
    </form>
  );
}
