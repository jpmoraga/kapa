"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FormOption = {
  value: string;
  label: string;
};

type ConsultingProspectFormValues = {
  businessLine: string;
  country: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  linkedinUrl: string;
  email: string;
  emailStatus: string;
  source: string;
  contactStatus: string;
  pipelineStage: string;
  nextAction: string;
  nextActionAt: string;
  notes: string;
};

type ConsultingProspectFormProps = {
  mode: "create" | "edit";
  prospectId?: string;
  initialValues: ConsultingProspectFormValues;
  businessLineOptions: readonly FormOption[];
  emailStatusOptions: readonly FormOption[];
  contactStatusOptions: readonly FormOption[];
  pipelineStageOptions: readonly FormOption[];
};

const FIELD_CLASS_NAME =
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/25 focus:border-white/20 focus:ring-2 focus:ring-white/15";

const LABEL_CLASS_NAME = "text-sm font-medium text-white/80";

export default function ConsultingProspectForm({
  mode,
  prospectId,
  initialValues,
  businessLineOptions,
  emailStatusOptions,
  contactStatusOptions,
  pipelineStageOptions,
}: ConsultingProspectFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateField<K extends keyof ConsultingProspectFormValues>(
    field: K,
    value: ConsultingProspectFormValues[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const endpoint =
      mode === "create"
        ? "/api/backoffice/consulting/prospects"
        : `/api/backoffice/consulting/prospects/${prospectId}`;
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

    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "No fue posible guardar el prospecto.");
      return;
    }

    if (mode === "create" && payload.id) {
      router.push(`/backoffice/consulting/${payload.id}`);
      router.refresh();
      return;
    }

    setSuccess("Cambios guardados.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="k21-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/45">
            {mode === "create" ? "Nuevo prospecto" : "Editar prospecto"}
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {mode === "create" ? "Alta de Consulting" : "Actualizar ficha"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Los cambios de estado comercial se guardan sólo dentro del namespace nuevo de{" "}
            <code className="rounded bg-white/5 px-1 py-0.5 text-white/75">/backoffice</code>.
          </p>
        </div>

        <Link href="/backoffice/consulting" className="k21-btn-secondary">
          Volver al pipeline
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section>
          <div className="text-sm font-semibold text-white">Datos base</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL_CLASS_NAME}>Línea de negocio</label>
              <select
                className={FIELD_CLASS_NAME}
                value={form.businessLine}
                onChange={(event) => updateField("businessLine", event.target.value)}
              >
                {businessLineOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-neutral-950">
                    {option.label}
                  </option>
                ))}
              </select>
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
              <label className={LABEL_CLASS_NAME}>Empresa</label>
              <input
                className={FIELD_CLASS_NAME}
                value={form.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                placeholder="Nombre empresa"
              />
            </div>

            <div>
              <label className={LABEL_CLASS_NAME}>Fuente</label>
              <input
                className={FIELD_CLASS_NAME}
                value={form.source}
                onChange={(event) => updateField("source", event.target.value)}
                placeholder="LinkedIn, referral, base propia"
              />
            </div>

            <div>
              <label className={LABEL_CLASS_NAME}>Contacto</label>
              <input
                className={FIELD_CLASS_NAME}
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                placeholder="Nombre y apellido"
              />
            </div>

            <div>
              <label className={LABEL_CLASS_NAME}>Cargo</label>
              <input
                className={FIELD_CLASS_NAME}
                value={form.contactRole}
                onChange={(event) => updateField("contactRole", event.target.value)}
                placeholder="CEO, CFO, Founder"
              />
            </div>

            <div>
              <label className={LABEL_CLASS_NAME}>LinkedIn URL</label>
              <input
                className={FIELD_CLASS_NAME}
                value={form.linkedinUrl}
                onChange={(event) => updateField("linkedinUrl", event.target.value)}
                placeholder="https://linkedin.com/in/..."
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>

            <div>
              <label className={LABEL_CLASS_NAME}>Email</label>
              <input
                className={FIELD_CLASS_NAME}
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="contacto@empresa.com"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="text-sm font-semibold text-white">Estado comercial</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL_CLASS_NAME}>Estado de email</label>
              <select
                className={FIELD_CLASS_NAME}
                value={form.emailStatus}
                onChange={(event) => updateField("emailStatus", event.target.value)}
              >
                {emailStatusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-neutral-950">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS_NAME}>Estado de contacto</label>
              <select
                className={FIELD_CLASS_NAME}
                value={form.contactStatus}
                onChange={(event) => updateField("contactStatus", event.target.value)}
              >
                {contactStatusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-neutral-950">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS_NAME}>Pipeline stage</label>
              <select
                className={FIELD_CLASS_NAME}
                value={form.pipelineStage}
                onChange={(event) => updateField("pipelineStage", event.target.value)}
              >
                {pipelineStageOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-neutral-950">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS_NAME}>Próxima acción manual</label>
              <input
                className={FIELD_CLASS_NAME}
                value={form.nextAction}
                onChange={(event) => updateField("nextAction", event.target.value)}
                placeholder="Llamar, enviar propuesta, revisar contacto"
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

            <div className="md:col-span-2">
              <label className={LABEL_CLASS_NAME}>Notas</label>
              <textarea
                className={`${FIELD_CLASS_NAME} min-h-36 resize-y`}
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Observaciones internas del equipo comercial"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
        Al cambiar el{" "}
        <code className="rounded bg-white/5 px-1 py-0.5 text-white/75">contactStatus</code>, el
        sistema completa automáticamente la primera fecha vacía asociada a ese hito. No
        sobreescribe timestamps ya existentes.
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="k21-btn-primary min-w-44 disabled:opacity-60"
        >
          {loading
            ? mode === "create"
              ? "Guardando…"
              : "Actualizando…"
            : mode === "create"
              ? "Crear prospecto"
              : "Guardar cambios"}
        </button>
        <Link href="/backoffice/consulting" className="k21-btn-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
