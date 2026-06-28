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
  partnerLevel: string;
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
  } | null;
  initialValues: MiningOperationFormValues;
  productOptions: readonly FormOption[];
  currencyOptions: readonly FormOption[];
  commercialStatusOptions: readonly FormOption[];
  operationalStatusOptions: readonly FormOption[];
  partnerLevelOptions: readonly FormOption[];
  commissionStatusOptions: readonly FormOption[];
};

type SaveIntent = "back" | "stay";

const FIELD_CLASS_NAME =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none placeholder:text-white/25 focus:border-white/20 focus:ring-2 focus:ring-white/15";

const LABEL_CLASS_NAME = "text-sm font-medium text-white/80";
const SECTION_CLASS_NAME = "rounded-2xl border border-white/10 bg-white/[0.03] p-5";

function readSaveIntent(event: React.FormEvent<HTMLFormElement>): SaveIntent {
  const nativeEvent = event.nativeEvent as SubmitEvent;
  const submitter = nativeEvent.submitter as HTMLButtonElement | null;
  return submitter?.value === "stay" ? "stay" : "back";
}

export default function MiningOperationForm({
  mode,
  operationId,
  linkedProspect,
  initialValues,
  productOptions,
  currencyOptions,
  commercialStatusOptions,
  operationalStatusOptions,
  partnerLevelOptions,
  commissionStatusOptions,
}: MiningOperationFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialValues);
  const [loading, setLoading] = useState<SaveIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof MiningOperationFormValues>(
    field: K,
    value: MiningOperationFormValues[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
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
          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Cliente y canales</div>
              <p className="mt-1 text-sm text-white/55">
                Identidad del cliente y vías de contacto que ya están disponibles.
              </p>
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
              <div className="text-base font-semibold text-white">Estado comercial y links</div>
              <p className="mt-1 text-sm text-white/55">
                Contrato, comprobante de pago y etapa real del cierre comercial.
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
            </div>
          </div>

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Estado operativo</div>
              <p className="mt-1 text-sm text-white/55">
                Capa interna pensada para preparar el futuro acceso limitado de Andes SolarHash.
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
                <label className={LABEL_CLASS_NAME}>Notas operativas internas</label>
                <textarea
                  className={`${FIELD_CLASS_NAME} min-h-28 resize-y`}
                  value={form.andesOperationalNotes}
                  onChange={(event) => updateField("andesOperationalNotes", event.target.value)}
                  placeholder="Recepción, activación, incidentes o contexto operativo compartible."
                />
              </div>
            </div>
          </div>

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Comisión Kapa21</div>
              <p className="mt-1 text-sm text-white/55">
                Si dejas tasa o monto vacíos, el sistema sugerirá valores al guardar según producto,
                nivel partner y pago recibido.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className={LABEL_CLASS_NAME}>Nivel partner</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.partnerLevel}
                  onChange={(event) => updateField("partnerLevel", event.target.value)}
                >
                  {partnerLevelOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Tasa comisión venta</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.salesCommissionRate}
                  onChange={(event) => updateField("salesCommissionRate", event.target.value)}
                  placeholder="0.05"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Monto comisión venta</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.salesCommissionAmount}
                  onChange={(event) => updateField("salesCommissionAmount", event.target.value)}
                  placeholder="1250"
                  inputMode="decimal"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Moneda comisión venta</label>
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

              <div className="xl:col-span-3">
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

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Seguimiento interno</div>
              <p className="mt-1 text-sm text-white/55">
                Próximo paso manual y notas que no deben exponerse a partners externos.
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
                <label className={LABEL_CLASS_NAME}>Notas internas</label>
                <textarea
                  className={`${FIELD_CLASS_NAME} min-h-32 resize-y`}
                  value={form.internalNotes}
                  onChange={(event) => updateField("internalNotes", event.target.value)}
                  placeholder="Contexto comercial privado, objeciones, acuerdos y detalles internos."
                />
              </div>
            </div>
          </div>
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
            Cancelar
          </Link>
        </div>
      </section>
    </form>
  );
}
