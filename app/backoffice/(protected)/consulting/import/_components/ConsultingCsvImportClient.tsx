"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ImportMode = "create_only" | "create_and_update";

type PreviewColumn = {
  key: string;
  label: string;
  detectedHeader: string | null;
  required: boolean;
};

type PreviewRow = {
  rowNumber: number;
  status: "new" | "would_update" | "possible_duplicate" | "error";
  matchBasis: "linkedin" | "email" | "composite" | "secondary" | null;
  existingProspectId: string | null;
  companyName: string | null;
  contactName: string | null;
  contactRole: string | null;
  country: string | null;
  businessLineLabel: string | null;
  contactStatusLabel: string | null;
  pipelineStageLabel: string | null;
  nextAction: string | null;
  warnings: string[];
  errors: string[];
};

type PreviewPayload = {
  delimiter: "," | ";" | "\t";
  totalRows: number;
  validRows: number;
  errorRows: number;
  possibleDuplicateRows: number;
  newRows: number;
  updateRows: number;
  warningsCount: number;
  previewRows: PreviewRow[];
  columns: PreviewColumn[];
};

type CommitRowError = {
  rowNumber: number;
  companyName: string | null;
  contactName: string | null;
  field: string | null;
  reason: string;
  message: string;
  disposition: "skipped" | "failed";
};

type CommitPayload = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  rowErrors: CommitRowError[];
  omitted: number;
  errors: Array<{ rowNumber: number; message: string }>;
  error?: string;
};

function statusTone(status: PreviewRow["status"]) {
  if (status === "new") return "k21-pill-approved";
  if (status === "would_update") return "k21-pill-pending";
  if (status === "possible_duplicate") return "k21-pill-none";
  return "k21-pill-rejected";
}

function statusLabel(status: PreviewRow["status"]) {
  if (status === "new") return "Nueva";
  if (status === "would_update") return "Actualizaría";
  if (status === "possible_duplicate") return "Duplicado posible";
  return "Error";
}

function matchBasisLabel(value: PreviewRow["matchBasis"]) {
  if (value === "linkedin") return "LinkedIn";
  if (value === "email") return "Email";
  if (value === "composite") return "Empresa + contacto + país";
  if (value === "secondary") return "Coincidencia secundaria";
  return "Sin match";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("es-CL").format(value);
}

function isCommitPayload(value: unknown): value is CommitPayload {
  if (!value || typeof value !== "object") return false;

  return (
    "created" in value &&
    "updated" in value &&
    "skipped" in value &&
    "failed" in value &&
    "rowErrors" in value
  );
}

function commitResultTone(result: CommitPayload) {
  if (result.failed > 0) {
    return {
      container: "border-red-500/30 bg-red-500/10",
      eyebrow: "text-red-100/70",
      title: "text-red-50",
      card: "border-red-500/20 bg-black/10",
      table: "border-red-500/20 bg-black/10",
      body: "text-white/80",
    };
  }

  if (result.rowErrors.length > 0) {
    return {
      container: "border-amber-500/30 bg-amber-500/10",
      eyebrow: "text-amber-100/70",
      title: "text-amber-50",
      card: "border-amber-500/20 bg-black/10",
      table: "border-amber-500/20 bg-black/10",
      body: "text-white/80",
    };
  }

  return {
    container: "border-emerald-500/30 bg-emerald-500/10",
    eyebrow: "text-emerald-100/70",
    title: "text-emerald-50",
    card: "border-emerald-500/20 bg-black/10",
    table: "border-emerald-500/20 bg-black/10",
    body: "text-white/80",
  };
}

function commitResultTitle(result: CommitPayload) {
  if (result.failed > 0) return "Importación finalizada con errores";
  if (result.rowErrors.length > 0) return "Importación finalizada con observaciones";
  return "Importación finalizada";
}

export default function ConsultingCsvImportClient() {
  const router = useRouter();
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [mode, setMode] = useState<ImportMode>("create_only");
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [result, setResult] = useState<CommitPayload | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commitEligibleRows = useMemo(() => {
    if (!preview) return 0;
    return mode === "create_and_update"
      ? preview.newRows + preview.updateRows
      : preview.newRows;
  }, [mode, preview]);

  const commitIssuesPreview = useMemo(() => {
    if (!result) return [];
    return result.rowErrors.slice(0, 12);
  }, [result]);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvText(text);
    setFileName(file.name);
    setPreview(null);
    setResult(null);
    setError(null);
  }

  async function requestPreview() {
    setLoadingPreview(true);
    setError(null);
    setResult(null);

    const response = await fetch("/api/backoffice/consulting/import/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csvText }),
    });

    const payload = (await response.json().catch(() => ({}))) as PreviewPayload & {
      error?: string;
    };

    setLoadingPreview(false);

    if (!response.ok) {
      setPreview(null);
      setError(payload.error ?? "No fue posible generar la preview.");
      return;
    }

    setPreview(payload);
  }

  async function confirmImport() {
    setLoadingCommit(true);
    setError(null);
    setResult(null);

    const response = await fetch("/api/backoffice/consulting/import/commit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csvText, mode }),
    });

    const payload = await response.json().catch(() => ({}));

    setLoadingCommit(false);

    if (isCommitPayload(payload)) {
      setResult(payload);
    }

    if (!response.ok) {
      setError(
        payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "No fue posible confirmar la importación."
      );
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.7fr)]">
      <div className="space-y-4">
        <section className="k21-card border-white/10 bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                Importador seguro
              </div>
              <h2 className="mt-2 text-xl font-semibold text-white">Importar CSV de Consulting</h2>
              <p className="mt-2 max-w-3xl text-sm text-white/60">
                Sube el CSV exportado desde Google Sheets o pega su contenido. Primero se genera
                una preview; no se crea ni actualiza nada hasta confirmar explícitamente.
              </p>
            </div>

            <Link href="/backoffice/consulting" className="k21-btn-secondary">
              Volver al pipeline
            </Link>
          </div>

          <div className="mt-4 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <label className="text-sm font-medium text-white/80">Archivo CSV</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={onFileChange}
                className="mt-2 block w-full text-sm text-white/70 file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/15"
              />
              <div className="mt-2 text-xs text-white/45">
                {fileName ? `Archivo cargado: ${fileName}` : "Aún no hay archivo cargado."}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <label className="text-sm font-medium text-white/80">Contenido CSV</label>
              <textarea
                value={csvText}
                onChange={(event) => {
                  setCsvText(event.target.value);
                  setPreview(null);
                  setResult(null);
                  setError(null);
                }}
                rows={14}
                placeholder="Pega aquí el CSV exportado desde Google Sheets."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20 focus:ring-2 focus:ring-white/15"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={requestPreview}
              disabled={loadingPreview || !csvText.trim()}
              className="k21-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingPreview ? "Generando preview..." : "Generar preview"}
            </button>

            <div className="text-xs text-white/45">
              Soporta CSV exportado desde Google Sheets. El commit se recalcula server-side.
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
        </section>

        {preview ? (
          <>
            <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {[
                { label: "Filas detectadas", value: preview.totalRows },
                { label: "Válidas", value: preview.validRows },
                { label: "Errores", value: preview.errorRows },
                { label: "Duplicados posibles", value: preview.possibleDuplicateRows },
                { label: "Nuevas", value: preview.newRows },
                { label: "Actualizarían", value: preview.updateRows },
              ].map((card) => (
                <article key={card.label} className="k21-card border-white/10 bg-white/[0.02] p-3.5">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                    {card.label}
                  </div>
                  <div className="mt-1.5 text-2xl font-semibold text-white">
                    {formatCount(card.value)}
                  </div>
                </article>
              ))}
            </section>

            <section className="k21-card border-white/10 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-white">Confirmación</div>
                  <p className="mt-1 text-sm text-white/55">
                    Default seguro: crear sólo nuevos. Las filas con error o duplicado posible se
                    omiten.
                  </p>
                </div>

                <div className="text-sm text-white/55">
                  Delimitador detectado: <span className="text-white">{preview.delimiter}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <label className="text-sm font-medium text-white/80">Modo de importación</label>
                  <select
                    value={mode}
                    onChange={(event) => setMode(event.target.value as ImportMode)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15"
                  >
                    <option value="create_only" className="bg-neutral-950">
                      Crear sólo nuevos
                    </option>
                    <option value="create_and_update" className="bg-neutral-950">
                      Crear nuevos y actualizar existentes
                    </option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={confirmImport}
                    disabled={loadingCommit || commitEligibleRows === 0}
                    className="k21-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingCommit
                      ? "Importando..."
                      : `Confirmar importación (${formatCount(commitEligibleRows)})`}
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-white/45">
                En este modo quedarían listas {formatCount(commitEligibleRows)} filas para crear o
                actualizar.
              </div>
            </section>

            <section className="k21-card border-white/10 bg-white/[0.02] p-5">
              <div className="text-base font-semibold text-white">Columnas detectadas</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {preview.columns.map((column) => (
                  <div
                    key={column.key}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="text-sm font-medium text-white">{column.label}</div>
                    <div className="mt-1 text-xs text-white/50">
                      {column.detectedHeader || "No detectada"}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/35">
                      {column.required ? "Obligatoria" : "Opcional"}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="k21-card overflow-hidden border-white/10 bg-white/[0.02]">
              <div className="border-b border-white/10 px-4 py-3">
                <div className="text-base font-semibold text-white">Preview de primeras 20 filas</div>
                <p className="mt-1 text-sm text-white/55">
                  Vista previa del parseo, clasificación y mapeo detectado antes del commit.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1260px] text-left text-sm">
                  <thead className="bg-neutral-950/95 text-white/45 backdrop-blur">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Fila</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Estado</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Empresa</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Contacto</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">País</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Mapeo</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Acción</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Alertas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.previewRows.map((row) => (
                      <tr key={row.rowNumber} className="border-t border-white/10 align-top">
                        <td className="px-4 py-3.5 text-white/60">#{row.rowNumber}</td>
                        <td className="px-4 py-3.5">
                          <div className="min-w-[170px] space-y-2">
                            <span className={statusTone(row.status)}>{statusLabel(row.status)}</span>
                            <div className="text-xs text-white/45">
                              Match: {matchBasisLabel(row.matchBasis)}
                            </div>
                            {row.existingProspectId ? (
                              <Link
                                href={`/backoffice/consulting/${row.existingProspectId}`}
                                className="inline-flex text-xs text-amber-100 underline underline-offset-4"
                              >
                                Ver ficha relacionada
                              </Link>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="min-w-[220px]">
                            <div className="font-medium text-white">
                              {row.companyName || "Sin empresa"}
                            </div>
                            <div className="mt-1 text-white/55">
                              {row.businessLineLabel || "Sin línea comercial"}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="min-w-[220px]">
                            <div className="font-medium text-white">
                              {row.contactName || "Sin contacto"}
                            </div>
                            <div className="mt-1 text-white/55">
                              {row.contactRole || "Sin cargo"}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-white/65">{row.country || "Sin país"}</td>
                        <td className="px-4 py-3.5">
                          <div className="min-w-[260px] space-y-1.5 text-sm text-white/70">
                            <div>Línea: {row.businessLineLabel || "Sin mapear"}</div>
                            <div>Contacto: {row.contactStatusLabel || "Sin mapear"}</div>
                            <div>Pipeline: {row.pipelineStageLabel || "Sin mapear"}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="min-w-[260px] text-sm text-white/75">
                            {row.nextAction || "Sin próxima acción"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="min-w-[280px] space-y-1.5 text-xs text-white/60">
                            {row.warnings.map((warning) => (
                              <div key={warning} className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-amber-100/90">
                                {warning}
                              </div>
                            ))}
                            {row.errors.map((message) => (
                              <div key={message} className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-red-100">
                                {message}
                              </div>
                            ))}
                            {!row.warnings.length && !row.errors.length ? (
                              <div className="text-white/35">Sin alertas.</div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>

      <aside className="space-y-4">
        <section className="k21-card border-white/10 bg-white/[0.02] p-5">
          <div className="text-base font-semibold text-white">Reglas de seguridad</div>
          <ul className="mt-3 space-y-2.5 text-sm text-white/70">
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
              No se muta ningún prospecto durante la preview.
            </li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
              `LinkedIn`, luego `email`, luego `empresa + contacto + país` se usan para detectar
              coincidencias.
            </li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
              Los vacíos del CSV nunca borran datos existentes.
            </li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
              Las filas con error o duplicado posible quedan omitidas en el commit.
            </li>
          </ul>
        </section>

        <section className="k21-card border-white/10 bg-white/[0.02] p-5">
          <div className="text-base font-semibold text-white">Mapeo principal</div>
          <div className="mt-3 space-y-2.5 text-sm text-white/70">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              `Consiltoria / Consultoria / Consultoría` → línea comercial.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              `Empresa`, `País`, `Nombre`, `Cargo`, `LinkedIn`, `Mail` → datos base.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              `Estado contacto`, `Estado`, `Etapa pipeline`, fechas e hitos → estado comercial.
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              Contexto no mapeado directo se agrega al final de `notes`.
            </div>
          </div>
        </section>

        {result ? (
          <section className={`k21-card p-5 ${commitResultTone(result).container}`}>
            <div className={`text-[11px] uppercase tracking-[0.16em] ${commitResultTone(result).eyebrow}`}>
              Commit CSV
            </div>
            <div className={`mt-2 text-base font-semibold ${commitResultTone(result).title}`}>
              {commitResultTitle(result)}
            </div>
            <p className={`mt-2 text-sm ${commitResultTone(result).body}`}>
              En `create_only`, las coincidencias existentes se cuentan como omitidas y quedan
              listas para reintentar sin duplicar registros.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
              <div className={`rounded-2xl border px-4 py-3 ${commitResultTone(result).card}`}>
                <div className={`text-[11px] uppercase tracking-[0.16em] ${commitResultTone(result).eyebrow}`}>
                  Creados
                </div>
                <div className="mt-1.5 text-2xl font-semibold text-white">
                  {formatCount(result.created)}
                </div>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${commitResultTone(result).card}`}>
                <div className={`text-[11px] uppercase tracking-[0.16em] ${commitResultTone(result).eyebrow}`}>
                  Actualizados
                </div>
                <div className="mt-1.5 text-2xl font-semibold text-white">
                  {formatCount(result.updated)}
                </div>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${commitResultTone(result).card}`}>
                <div className={`text-[11px] uppercase tracking-[0.16em] ${commitResultTone(result).eyebrow}`}>
                  Omitidos
                </div>
                <div className="mt-1.5 text-2xl font-semibold text-white">
                  {formatCount(result.skipped)}
                </div>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${commitResultTone(result).card}`}>
                <div className={`text-[11px] uppercase tracking-[0.16em] ${commitResultTone(result).eyebrow}`}>
                  Fallidos
                </div>
                <div className="mt-1.5 text-2xl font-semibold text-white">
                  {formatCount(result.failed)}
                </div>
              </div>
            </div>

            {commitIssuesPreview.length ? (
              <div className="mt-4 space-y-2">
                <div className={`text-sm font-medium ${commitResultTone(result).title}`}>
                  Primeras filas con observaciones
                </div>
                <div className={`overflow-hidden rounded-2xl border ${commitResultTone(result).table}`}>
                  <div className="overflow-x-auto">
                    <table className="min-w-[720px] text-left text-sm">
                      <thead className="border-b border-white/10 bg-black/10 text-white/55">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 font-medium">Fila</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium">Tipo</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium">Empresa</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium">Contacto</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium">Campo</th>
                          <th className="whitespace-nowrap px-4 py-3 font-medium">Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commitIssuesPreview.map((item) => (
                          <tr
                            key={`${item.rowNumber}:${item.reason}:${item.disposition}`}
                            className="border-t border-white/10 align-top text-white/80"
                          >
                            <td className="whitespace-nowrap px-4 py-3">#{item.rowNumber}</td>
                            <td className="whitespace-nowrap px-4 py-3">
                              {item.disposition === "failed" ? "Fallida" : "Omitida"}
                            </td>
                            <td className="px-4 py-3">{item.companyName || "Sin empresa"}</td>
                            <td className="px-4 py-3">{item.contactName || "Sin contacto"}</td>
                            <td className="px-4 py-3">{item.field || "General"}</td>
                            <td className="px-4 py-3">{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {result.rowErrors.length > commitIssuesPreview.length ? (
                  <div className={`text-xs ${commitResultTone(result).body}`}>
                    Se muestran {formatCount(commitIssuesPreview.length)} de{" "}
                    {formatCount(result.rowErrors.length)} filas con observaciones.
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </aside>
    </div>
  );
}
