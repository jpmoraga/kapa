"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FormOption = {
  value: string;
  label: string;
};

type MiningProspectFormValues = {
  name: string;
  companyName: string;
  country: string;
  whatsapp: string;
  instagramUrl: string;
  linkedinUrl: string;
  xUrl: string;
  email: string;
  source: string;
  interestType: string;
  estimatedAmountUsd: string;
  status: string;
  nextAction: string;
  nextActionAt: string;
  notes: string;
};

type MiningProspectFormProps = {
  mode: "create" | "edit";
  prospectId?: string;
  initialValues: MiningProspectFormValues;
  sourceOptions: readonly FormOption[];
  interestTypeOptions: readonly FormOption[];
  statusOptions: readonly FormOption[];
};

type SaveIntent = "back" | "stay";

const FIELD_CLASS_NAME =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20 focus:ring-2 focus:ring-white/15";

const LABEL_CLASS_NAME = "text-sm font-medium text-white/80";
const SECTION_CLASS_NAME = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";

function readSaveIntent(event: React.FormEvent<HTMLFormElement>): SaveIntent {
  const nativeEvent = event.nativeEvent as SubmitEvent;
  const submitter = nativeEvent.submitter as HTMLButtonElement | null;
  return submitter?.value === "stay" ? "stay" : "back";
}

export default function MiningProspectForm({
  mode,
  prospectId,
  initialValues,
  sourceOptions,
  interestTypeOptions,
  statusOptions,
}: MiningProspectFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialValues);
  const [loading, setLoading] = useState<SaveIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof MiningProspectFormValues>(
    field: K,
    value: MiningProspectFormValues[K]
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
        ? "/api/backoffice/mining/prospects"
        : `/api/backoffice/mining/prospects/${prospectId}`;
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
        router.replace(`/backoffice/mining/${payload.id}?created=1`);
        return;
      }

      router.push("/backoffice/mining");
      router.refresh();
      return;
    }

    if (saveIntent === "stay" && prospectId) {
      router.replace(`/backoffice/mining/${prospectId}?saved=${Date.now()}`);
      return;
    }

    router.push("/backoffice/mining");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="k21-card border-white/10 bg-white/[0.02] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">
              {mode === "create" ? "Nuevo prospecto" : "Edición de prospecto"}
            </div>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {mode === "create" ? "Cargar prospecto de Mining" : "Actualizar seguimiento"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              Registra sólo interesados reales en minería y deja el siguiente paso listo para
              seguimiento interno.
            </p>
          </div>

          <Link href="/backoffice/mining" className="k21-btn-secondary">
            Volver al pipeline
          </Link>
        </div>
      </section>

      <section className="k21-card border-white/10 bg-white/[0.02] p-5">
        <div className="grid gap-4">
          <div className={SECTION_CLASS_NAME}>
            <div>
              <div className="text-base font-semibold text-white">Datos base</div>
              <p className="mt-1 text-sm text-white/55">
                Identidad del prospecto y origen del interés.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <label className={LABEL_CLASS_NAME}>Nombre</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Nombre y apellido"
                />
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Empresa</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.companyName}
                  onChange={(event) => updateField("companyName", event.target.value)}
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
                <label className={LABEL_CLASS_NAME}>Origen</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.source}
                  onChange={(event) => updateField("source", event.target.value)}
                >
                  {sourceOptions.map((option) => (
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
              <div className="text-base font-semibold text-white">Canales de contacto</div>
              <p className="mt-1 text-sm text-white/55">
                Puede existir sólo un canal, o varios si ya están disponibles.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
              <div className="text-base font-semibold text-white">Interés comercial</div>
              <p className="mt-1 text-sm text-white/55">
                Modalidad estimada, monto aproximado y estado del prospecto.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className={LABEL_CLASS_NAME}>Modalidad de interés</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.interestType}
                  onChange={(event) => updateField("interestType", event.target.value)}
                >
                  {interestTypeOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-neutral-950">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLASS_NAME}>Monto estimado USD</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.estimatedAmountUsd}
                  onChange={(event) => updateField("estimatedAmountUsd", event.target.value)}
                  placeholder="25000"
                  inputMode="decimal"
                />
              </div>

              <div className="lg:col-span-2 xl:col-span-1">
                <label className={LABEL_CLASS_NAME}>Estado</label>
                <select
                  className={FIELD_CLASS_NAME}
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                >
                  {statusOptions.map((option) => (
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
                Define una próxima acción manual sólo si quieres priorizar algo distinto de la
                sugerencia automática.
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label className={LABEL_CLASS_NAME}>Próxima acción manual</label>
                <input
                  className={FIELD_CLASS_NAME}
                  value={form.nextAction}
                  onChange={(event) => updateField("nextAction", event.target.value)}
                  placeholder="Responder, agendar reunión, enviar información"
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
                Contexto comercial, dudas del prospecto o acuerdos de reunión.
              </p>
            </div>

            <div className="mt-4">
              <label className={LABEL_CLASS_NAME}>Notas de seguimiento</label>
              <textarea
                className={`${FIELD_CLASS_NAME} min-h-32 resize-y`}
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Resumen de interés, modalidad probable, objeciones, próximo paso"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="k21-card border-white/10 bg-white/[0.02] p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
          Al cambiar el estado, el sistema completa automáticamente la primera fecha faltante del
          hito correspondiente sin sobrescribir fechas anteriores.
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
            className="k21-btn-primary min-w-48 px-4 py-2.5 text-sm disabled:opacity-60"
          >
            {loading === "back" ? "Guardando…" : "Guardar y volver al pipeline"}
          </button>

          <button
            type="submit"
            value="stay"
            disabled={Boolean(loading)}
            className="k21-btn-secondary min-w-48 px-4 py-2.5 text-sm disabled:opacity-60"
          >
            {loading === "stay" ? "Guardando…" : "Guardar y seguir editando"}
          </button>

          <Link href="/backoffice/mining" className="k21-btn-secondary px-4 py-2.5 text-sm">
            Volver al pipeline
          </Link>
        </div>
      </section>
    </form>
  );
}
