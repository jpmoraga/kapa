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
  const [loading, setLoading] = useState<SaveIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ConsultingProspectFormValues>(
    field: K,
    value: ConsultingProspectFormValues[K]
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

    setLoading(null);

    if (!response.ok) {
      setError(payload.error ?? "No fue posible guardar el prospecto.");
      return;
    }

    if (mode === "create") {
      if (saveIntent === "stay" && payload.id) {
        router.replace(`/backoffice/consulting/${payload.id}?created=1`);
        return;
      }

      router.push("/backoffice/consulting");
      router.refresh();
      return;
    }

    if (saveIntent === "stay" && prospectId) {
      router.replace(`/backoffice/consulting/${prospectId}?saved=${Date.now()}`);
      return;
    }

    router.push("/backoffice/consulting");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="k21-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">
              {mode === "create" ? "Nuevo prospecto" : "Edición de prospecto"}
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {mode === "create" ? "Cargar prospecto" : "Actualizar seguimiento"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              Completa la ficha comercial con datos base, contacto, estado y próximo paso para que
              el seguimiento diario sea consistente.
            </p>
          </div>

          <Link href="/backoffice/consulting" className="k21-btn-secondary">
            Volver al pipeline
          </Link>
        </div>
      </section>

      <section className="k21-card p-6">
        <div className="grid gap-5">
          <div className={SECTION_CLASS_NAME}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-white">Datos base</div>
                <p className="mt-1 text-sm text-white/55">
                  Empresa, línea comercial y referencia de origen.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <label className={LABEL_CLASS_NAME}>Línea comercial</label>
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

              <div className="lg:col-span-2">
                <label className={LABEL_CLASS_NAME}>Empresa</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.companyName}
                  onChange={(event) => updateField("companyName", event.target.value)}
                  placeholder="Nombre empresa"
                />
              </div>

              <div className="lg:col-span-2">
                <label className={LABEL_CLASS_NAME}>Fuente</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.source}
                  onChange={(event) => updateField("source", event.target.value)}
                  placeholder="LinkedIn, referido, networking, base propia"
                />
              </div>
            </div>
          </div>

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Contacto</div>
              <p className="mt-1 text-sm text-white/55">
                Persona objetivo y canales de contacto disponibles.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <label className={LABEL_CLASS_NAME}>Nombre contacto</label>
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
                  placeholder="CEO, CFO, gerente general"
                />
              </div>

              <div className="lg:col-span-2">
                <label className={LABEL_CLASS_NAME}>Perfil de LinkedIn</label>
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
          </div>

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Estado comercial</div>
              <p className="mt-1 text-sm text-white/55">
                Estado actual del contacto y avance del proceso comercial.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
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

              <div className="lg:col-span-2 xl:col-span-1">
                <label className={LABEL_CLASS_NAME}>Etapa comercial</label>
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
            </div>
          </div>

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Seguimiento</div>
              <p className="mt-1 text-sm text-white/55">
                Define el próximo paso manual si necesitas salirte de la sugerencia automática.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label className={LABEL_CLASS_NAME}>Próxima acción manual</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.nextAction}
                  onChange={(event) => updateField("nextAction", event.target.value)}
                  placeholder="Llamar, enviar propuesta, coordinar reunión"
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
            </div>
          </div>

          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Notas</div>
              <p className="mt-1 text-sm text-white/55">
                Observaciones internas relevantes para el equipo comercial.
              </p>
            </div>

            <div className="mt-4">
              <label className={LABEL_CLASS_NAME}>Notas de seguimiento</label>
              <textarea
                className={`${FIELD_CLASS_NAME} min-h-40 resize-y`}
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Resumen de conversación, contexto, objeciones, próximos pasos"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="k21-card p-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
          Al cambiar el estado de contacto, el sistema completa automáticamente la primera fecha
          faltante del hito correspondiente, sin sobrescribir fechas anteriores.
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
            {loading === "back"
              ? "Guardando…"
              : "Guardar y volver al pipeline"}
          </button>

          <button
            type="submit"
            value="stay"
            disabled={Boolean(loading)}
            className="k21-btn-secondary min-w-56 disabled:opacity-60"
          >
            {loading === "stay"
              ? "Guardando…"
              : "Guardar y seguir editando"}
          </button>

          <Link href="/backoffice/consulting" className="k21-btn-secondary">
            Cancelar
          </Link>
        </div>
      </section>
    </form>
  );
}
