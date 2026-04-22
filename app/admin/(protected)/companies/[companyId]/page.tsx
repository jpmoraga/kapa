import Link from "next/link";
import { notFound } from "next/navigation";
import AdminPageHeader from "../../_components/AdminPageHeader";
import { getAdminCompanyDetail } from "@/lib/companyLifecycle";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL");
}

function badgeClasses(kind: "neutral" | "success" | "warning" | "danger" | "info") {
  if (kind === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (kind === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  if (kind === "danger") return "border-red-500/30 bg-red-500/10 text-red-200";
  if (kind === "info") return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  return "border-white/10 bg-white/[0.04] text-neutral-300";
}

function statusTone(label: string) {
  if (label === "Aprobada") return "success" as const;
  if (label === "Pendiente" || label === "Sin revisión") return "warning" as const;
  if (label === "Observada") return "info" as const;
  if (label === "Rechazada") return "danger" as const;
  return "neutral" as const;
}

export default async function AdminCompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { companyId } = await params;
  const sp = searchParams ? await searchParams : {};
  const flash = Array.isArray(sp.flash) ? sp.flash[0] : sp.flash;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const company = await getAdminCompanyDetail(companyId);

  if (!company) notFound();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AdminPageHeader
        eyebrow="Admin / Empresas / Detalle"
        title={company.name}
        description="Vista de lifecycle/compliance y revisión manual. No es la pantalla operativa para saldos o acciones admin; eso vive en la ficha operativa del cliente."
        actions={
          <>
            <Link href="/admin/companies" className="k21-btn-secondary px-3 py-2 text-sm">
              Volver a Empresas
            </Link>
            <Link href={company.customerDetailHref} className="k21-btn-secondary px-3 py-2 text-sm">
              Ir a ficha operativa
            </Link>
          </>
        }
      />

      <div className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-100">
        Esta vista se usa para revisión documental y lifecycle. Para operar saldos, cobrar
        suscripción o usar acciones admin, entra a{" "}
        <Link href={company.customerDetailHref} className="font-medium text-white underline underline-offset-4">
          la ficha operativa del cliente
        </Link>
        .
      </div>

      {flash === "reviewed" ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          Estado de revisión actualizado.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          No se pudo actualizar la revisión: {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Estado</div>
          <div className="mt-3">
            <span
              className={`rounded-full border px-2 py-1 text-[11px] ${badgeClasses(
                statusTone(company.review.statusLabel)
              )}`}
            >
              {company.review.statusLabel}
            </span>
          </div>
          <div className="mt-3 text-sm text-neutral-400">{company.review.sourceLabel}</div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Contacto</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {company.review.submittedByName ?? "—"}
          </div>
          <div className="mt-2 text-sm text-neutral-400">{company.review.submittedByEmail ?? "—"}</div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">RUT</div>
          <div className="mt-2 text-lg font-semibold text-white">{company.companyRut ?? "—"}</div>
          <div className="mt-2 text-sm text-neutral-400">{company.kind}</div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Última revisión</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {formatDateTime(company.review.reviewedAt)}
          </div>
          <div className="mt-2 text-sm text-neutral-400">
            {company.review.reviewedByAdminEmail ?? "Sin admin reviewer"}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Submission</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Contexto de la empresa</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs text-neutral-500">Estado review row</div>
                <div className="mt-2 text-sm text-white">
                  {company.review.isLegacyWithoutReview
                    ? "Empresa business legacy sin fila de revisión todavía."
                    : `Creado ${formatDateTime(company.review.createdAt)}`}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Actualizado: {formatDateTime(company.review.updatedAt)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs text-neutral-500">Flags company-level</div>
                <div className="mt-2 text-sm text-white">
                  Onboarding company: {company.flags.onboardingCompleted ? "Sí" : "No"}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Funds: {formatDateTime(company.flags.fundsDeclAcceptedAt)}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">Nota de envío</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-200">
                {company.review.submissionNote ?? "—"}
              </div>
            </div>
          </section>

          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Documentos</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Evidencia para revisión</h2>
            <div className="mt-4 space-y-3">
              {company.documents.length ? (
                company.documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">
                          {document.fileName ?? "Registro sin archivo adjunto"}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {document.fileMime ?? "sin mime"} · {document.fileSizeBytes ?? "—"} bytes
                        </div>
                        <div className="mt-1 text-xs text-neutral-500">
                          Subido: {formatDateTime(document.createdAt)} · {document.uploadedByLabel ?? "—"}
                        </div>
                      </div>
                      {document.hasFile ? (
                        <Link
                          href={`/api/admin/companies/${company.companyId}/documents/${document.id}/download`}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
                        >
                          Ver documento
                        </Link>
                      ) : null}
                    </div>
                    <div className="mt-3 text-sm text-neutral-300">{document.note ?? "Sin nota."}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-500">
                  No hay documentos ni evidencia registrada para esta empresa.
                </div>
              )}
            </div>
          </section>

          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Miembros vinculados</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Usuarios relacionados</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3 font-medium">Onboarding</th>
                    <th className="px-4 py-3 font-medium">Banco</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {company.members.length ? (
                    company.members.map((member) => (
                      <tr key={member.userId} className="align-top text-neutral-200">
                        <td className="px-4 py-4">
                          <div className="font-medium text-white">{member.name ?? member.email}</div>
                          <div className="mt-1 text-xs text-neutral-500">{member.email}</div>
                        </td>
                        <td className="px-4 py-4">{member.role}</td>
                        <td className="px-4 py-4">{member.onboardingComplete ? "Completo" : "Pendiente"}</td>
                        <td className="px-4 py-4">{member.hasBankAccount ? "Sí" : "No"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-500">
                        No hay usuarios vinculados todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Revisión admin</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Actualizar estado</h2>
            {company.review.canReview ? (
              <form
                action={`/api/admin/companies/${company.companyId}/review`}
                method="post"
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-white/80">Nota de revisión</label>
                  <textarea
                    name="note"
                    rows={5}
                    defaultValue={company.review.reviewNote ?? ""}
                    placeholder="Ej: documentos validados, falta observación legal, etc."
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <button
                    type="submit"
                    name="status"
                    value="APPROVED"
                    className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
                  >
                    Aprobar empresa
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="PENDING"
                    className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
                  >
                    Volver a pendiente
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="OBSERVED"
                    className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100"
                  >
                    Marcar observada
                  </button>
                  <button
                    type="submit"
                    name="status"
                    value="REJECTED"
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                  >
                    Rechazar
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-400">
                Esta compañía no participa del workflow de review porque no es `BUSINESS`.
              </div>
            )}
          </section>

          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Estado actual</div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-200">
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                Fuente: {company.review.sourceLabel}
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                Revisado: {formatDateTime(company.review.reviewedAt)}
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                Admin reviewer: {company.review.reviewedByAdminEmail ?? "—"}
              </li>
              <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                Nota actual: {company.review.reviewNote ?? "—"}
              </li>
            </ul>
          </section>
        </section>
      </div>
    </div>
  );
}
