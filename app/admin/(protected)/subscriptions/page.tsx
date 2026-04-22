import Link from "next/link";
import AdminPageHeader from "../_components/AdminPageHeader";
import {
  adminSubscriptionFilters,
  commercialStatusOptions,
  getCompanyCommercialSnapshot,
  listAdminSubscriptions,
  subscriptionPlanOptions,
  subscriptionStatusOptions,
  type AdminSubscriptionFilter,
} from "@/lib/adminCommercial";

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildSubscriptionsHref(params: {
  filter: AdminSubscriptionFilter;
  q: string;
  companyId?: string | null;
}) {
  const query = new URLSearchParams();
  if (params.filter !== "all") query.set("filter", params.filter);
  if (params.q) query.set("q", params.q);
  if (params.companyId) query.set("companyId", params.companyId);
  const value = query.toString();
  return value ? `/admin/subscriptions?${value}` : "/admin/subscriptions";
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL");
}

function formatDateInput(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function toneClass(kind: "neutral" | "success" | "warning" | "danger" | "info") {
  if (kind === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (kind === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  if (kind === "danger") return "border-red-500/30 bg-red-500/10 text-red-200";
  if (kind === "info") return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  return "border-white/10 bg-white/[0.04] text-neutral-300";
}

function commercialTone(label: string) {
  if (label === "Activo") return "success" as const;
  if (label === "Pausado") return "warning" as const;
  if (label === "Restringido") return "danger" as const;
  if (label === "Inactivo") return "neutral" as const;
  return "info" as const;
}

function subscriptionTone(label: string, isSubscribedEffective: boolean, legacySignalActive: boolean) {
  if (legacySignalActive) return "info" as const;
  if (isSubscribedEffective) return "success" as const;
  if (label === "Sin definir") return "neutral" as const;
  return "warning" as const;
}

function flashMessage(code: string | undefined) {
  switch (code) {
    case "subscription-updated":
      return {
        tone: "success" as const,
        text: "Suscripción comercial actualizada. No se generó ningún cobro ni movimiento patrimonial.",
      };
    case "commercial-updated":
      return {
        tone: "success" as const,
        text: "Estado comercial actualizado.",
      };
    default:
      return null;
  }
}

function errorMessage(code: string | undefined) {
  switch (code) {
    case "company_not_found":
      return "La empresa indicada no existe o no está disponible para admin.";
    case "invalid_subscription_status":
      return "El estado de suscripción es inválido.";
    case "invalid_subscription_plan":
      return "El plan de suscripción es inválido.";
    case "custom_amount_required":
      return "Debes indicar un monto USD cuando el plan es custom fixed.";
    case "custom_amount_not_allowed":
      return "El monto USD solo aplica al plan custom fixed.";
    case "base_amount_required":
      return "Debes indicar un monto USD para el plan base.";
    case "base_amount_not_allowed":
      return "El monto base USD solo aplica al plan base.";
    case "subscription_dates_invalid":
      return "La fecha de fin no puede ser anterior a la de inicio.";
    case "invalid_decimal":
      return "Uno de los montos o tasas no tiene un formato decimal válido.";
    case "invalid_commercial_status":
      return "El estado comercial es inválido.";
    default:
      return code ? "No se pudo guardar la configuración comercial." : null;
  }
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const filter = (firstString(sp.filter) ?? "all") as AdminSubscriptionFilter;
  const q = firstString(sp.q) ?? "";
  const requestedCompanyId = firstString(sp.companyId) ?? null;
  const flash = flashMessage(firstString(sp.flash));
  const error = errorMessage(firstString(sp.error));
  const data = await listAdminSubscriptions({ filter, q });
  const selectedCompanyId = requestedCompanyId ?? data.rows[0]?.companyId ?? null;
  const selectedCompany = selectedCompanyId
    ? await getCompanyCommercialSnapshot(selectedCompanyId)
    : null;
  const returnTo = buildSubscriptionsHref({
    filter: data.filter,
    q: data.q,
    companyId: selectedCompany?.companyId ?? selectedCompanyId,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AdminPageHeader
        eyebrow="Admin / Suscripciones"
        title="Suscripciones comerciales"
        description="Capa comercial oficial por empresa. En esta fase solo se modela, visualiza y administra el estado; no se cobra desde saldo ni se mueve patrimonio."
        actions={
          <Link href="/admin" className="k21-btn-secondary px-3 py-2 text-sm">
            Volver al dashboard
          </Link>
        }
      />

      {flash ? (
        <div
          className={`mt-6 rounded-2xl border p-4 text-sm ${
            flash.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              : "border-white/10 bg-white/[0.03] text-neutral-200"
          }`}
        >
          {flash.text}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Filas visibles</div>
          <div className="mt-2 text-3xl font-semibold text-white">{data.total}</div>
        </div>
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Suscripción activa</div>
          <div className="mt-2 text-3xl font-semibold text-white">{data.counts.active}</div>
        </div>
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Legacy signal</div>
          <div className="mt-2 text-3xl font-semibold text-white">{data.counts.legacySignal}</div>
        </div>
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Comercial active</div>
          <div className="mt-2 text-3xl font-semibold text-white">{data.counts.commercialActive}</div>
        </div>
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Plan custom / especial</div>
          <div className="mt-2 text-3xl font-semibold text-white">{data.counts.customPlan}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <section className="k21-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Listado</div>
              <h2 className="mt-2 text-lg font-semibold text-white">Empresas y estado de suscripción</h2>
              <p className="mt-2 text-sm text-neutral-400">
                La suscripción oficial vive en <code>CompanySubscription</code>. Si no existe, se
                muestra la señal legacy heredada desde <code>User.isSubscriber</code> solo como
                fallback visual.
              </p>
            </div>

            <form method="get" className="flex w-full max-w-xl flex-wrap items-end gap-3">
              {data.filter !== "all" ? <input type="hidden" name="filter" value={data.filter} /> : null}
              {selectedCompanyId ? <input type="hidden" name="companyId" value={selectedCompanyId} /> : null}
              <div className="min-w-[220px] flex-1">
                <label className="text-xs text-neutral-400">Buscar por empresa, RUT o contacto</label>
                <input
                  name="q"
                  defaultValue={data.q}
                  placeholder="empresa, rut o email"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
                Buscar
              </button>
              <Link href="/admin/subscriptions" className="k21-btn-secondary px-4 py-3 text-sm">
                Limpiar
              </Link>
            </form>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {adminSubscriptionFilters.map((option) => {
              const href = buildSubscriptionsHref({
                filter: option.value,
                q: data.q,
                companyId: selectedCompanyId,
              });
              const active = option.value === data.filter;
              return (
                <Link
                  key={option.value}
                  href={href}
                  className={
                    active
                      ? "rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
                      : "rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-white/20 hover:bg-white/[0.06]"
                  }
                >
                  {option.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Estado comercial</th>
                  <th className="px-4 py-3 font-medium">Suscripción</th>
                  <th className="px-4 py-3 font-medium">Pricing</th>
                  <th className="px-4 py-3 font-medium">Actualizado</th>
                  <th className="px-4 py-3 font-medium text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.rows.length ? (
                  data.rows.map((row) => {
                    const selected = row.companyId === selectedCompanyId;
                    return (
                      <tr
                        key={row.companyId}
                        className={`align-top text-neutral-200 ${
                          selected ? "bg-white/[0.03]" : ""
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-white">{row.companyName}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {row.companyRut ?? "Sin RUT"} · {row.kind}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>{row.contactName ?? "—"}</div>
                          <div className="mt-1 text-xs text-neutral-500">{row.contactEmail ?? "—"}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(
                              commercialTone(row.commercialStatusLabel)
                            )}`}
                          >
                            {row.commercialStatusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(
                                subscriptionTone(
                                  row.subscriptionStatusLabel,
                                  row.isSubscribedEffective,
                                  row.legacySignalActive
                                )
                              )}`}
                            >
                              {row.subscriptionStatusLabel}
                            </span>
                            <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass("neutral")}`}>
                              {row.subscriptionPlanLabel}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-neutral-500">
                            {row.customAmountUsd
                              ? `Custom USD ${row.customAmountUsd}`
                              : row.baseAmountUsd
                              ? `Base USD ${row.baseAmountUsd}`
                              : "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-neutral-200">{row.pricingPlanName ?? "Plan base"}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            Override: {row.hasCompanyPricingOverride ? "Sí" : "No"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-neutral-300">
                          {formatDateTime(row.updatedAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={buildSubscriptionsHref({
                                filter: data.filter,
                                q: data.q,
                                companyId: row.companyId,
                              })}
                              className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
                            >
                              Seleccionar
                            </Link>
                            <Link
                              href={`/admin/customers/${row.companyId}`}
                              className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
                            >
                              Cliente
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-neutral-500">
                      No encontré empresas para el filtro actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          {selectedCompany ? (
            <>
              <section className="k21-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-neutral-500">Seleccionada</div>
                    <h2 className="mt-2 text-xl font-semibold text-white">{selectedCompany.companyName}</h2>
                    <div className="mt-2 text-sm text-neutral-400">
                      {selectedCompany.companyRut ?? "Sin RUT"} · {selectedCompany.kind}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/customers/${selectedCompany.companyId}`}
                      className="k21-btn-secondary px-3 py-2 text-sm"
                    >
                      Ver cliente
                    </Link>
                    <Link
                      href={`/admin/pricing?companyId=${selectedCompany.companyId}`}
                      className="k21-btn-secondary px-3 py-2 text-sm"
                    >
                      Ver pricing
                    </Link>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs text-neutral-500">Estado comercial</div>
                    <div className="mt-2">
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(
                          commercialTone(selectedCompany.commercial.statusLabel)
                        )}`}
                      >
                        {selectedCompany.commercial.statusLabel}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">
                      Actualizado: {formatDateTime(selectedCompany.commercial.updatedAt)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs text-neutral-500">Suscripción efectiva</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(
                          subscriptionTone(
                            selectedCompany.subscription.statusLabel,
                            selectedCompany.subscription.isSubscribedEffective,
                            selectedCompany.subscription.legacySignalActive
                          )
                        )}`}
                      >
                        {selectedCompany.subscription.statusLabel}
                      </span>
                      <span className={`rounded-full border px-2 py-1 text-[11px] ${toneClass("neutral")}`}>
                        {selectedCompany.subscription.planLabel}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">
                      {selectedCompany.subscription.customAmountUsd
                        ? `Monto custom: USD ${selectedCompany.subscription.customAmountUsd}`
                        : selectedCompany.subscription.baseAmountUsd
                        ? `Monto base: USD ${selectedCompany.subscription.baseAmountUsd}`
                        : "Sin monto configurado"}
                    </div>
                  </div>
                </div>

                {selectedCompany.subscription.legacySignalActive ? (
                  <div className="mt-4 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-100">
                    No existe una suscripción oficial configurada. Se está mostrando la señal legacy
                    desde <code>User.isSubscriber</code> como fallback visual para esta empresa.
                  </div>
                ) : null}
              </section>

              <section className="k21-card p-6">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Suscripción oficial</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Configurar CompanySubscription</h2>
                <form
                  action={`/api/admin/subscriptions/${selectedCompany.companyId}`}
                  method="post"
                  className="mt-4 space-y-4"
                >
                  <input type="hidden" name="returnTo" value={returnTo} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-white/80">Estado</label>
                      <select
                        name="status"
                        defaultValue={selectedCompany.subscription.status ?? "INACTIVE"}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#101216] px-4 py-3 text-sm text-white outline-none"
                      >
                        {subscriptionStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80">Plan</label>
                      <select
                        name="plan"
                        defaultValue={selectedCompany.subscription.plan ?? "BASE"}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#101216] px-4 py-3 text-sm text-white outline-none"
                      >
                        {subscriptionPlanOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium text-white/80">Monto base USD</label>
                      <input
                        name="baseAmountUsd"
                        defaultValue={selectedCompany.subscription.baseAmountUsd ?? ""}
                        placeholder="49"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80">Monto custom USD</label>
                      <input
                        name="customAmountUsd"
                        defaultValue={selectedCompany.subscription.customAmountUsd ?? ""}
                        placeholder="150"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80">Inicio</label>
                      <input
                        type="date"
                        name="startedAt"
                        defaultValue={formatDateInput(selectedCompany.subscription.startedAt)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80">Fin</label>
                      <input
                        type="date"
                        name="endsAt"
                        defaultValue={formatDateInput(selectedCompany.subscription.endsAt)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80">Nota comercial</label>
                    <textarea
                      name="note"
                      rows={4}
                      defaultValue={selectedCompany.subscription.note ?? ""}
                      placeholder="Ej: free temporal por onboarding guiado, trato especial pactado, etc."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-neutral-500">
                      Última actualización: {formatDateTime(selectedCompany.subscription.updatedAt)} ·{" "}
                      {selectedCompany.subscription.updatedByAdminEmail ?? "sin admin"}
                    </div>
                    <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
                      Guardar suscripción
                    </button>
                  </div>
                </form>
              </section>

              <section className="k21-card p-6">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Estado comercial</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Configurar CompanyCommercialProfile</h2>
                <form
                  action={`/api/admin/commercial/${selectedCompany.companyId}`}
                  method="post"
                  className="mt-4 space-y-4"
                >
                  <input type="hidden" name="returnTo" value={returnTo} />

                  <div>
                    <label className="text-sm font-medium text-white/80">Estado comercial</label>
                    <select
                      name="status"
                      defaultValue={selectedCompany.commercial.status}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#101216] px-4 py-3 text-sm text-white outline-none"
                    >
                      {commercialStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80">Notas comerciales</label>
                    <textarea
                      name="notes"
                      rows={4}
                      defaultValue={selectedCompany.commercial.notes ?? ""}
                      placeholder="Ej: cliente pyme activo con onboarding asistido."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80">Condición especial</label>
                    <textarea
                      name="specialTermsNote"
                      rows={3}
                      defaultValue={selectedCompany.commercial.specialTermsNote ?? ""}
                      placeholder="Ej: condiciones pactadas para pricing o soporte."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-neutral-500">
                      Última actualización: {formatDateTime(selectedCompany.commercial.updatedAt)} ·{" "}
                      {selectedCompany.commercial.updatedByAdminEmail ?? "sin admin"}
                    </div>
                    <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
                      Guardar estado comercial
                    </button>
                  </div>
                </form>
              </section>

              <section className="k21-card p-6">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Trazabilidad mínima</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Audit log comercial</h2>
                <div className="mt-4 space-y-3">
                  {selectedCompany.auditLog.length ? (
                    selectedCompany.auditLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-white">{entry.typeLabel}</div>
                            <div className="mt-1 text-xs text-neutral-500">
                              {formatDateTime(entry.createdAt)} · {entry.actorAdminEmail ?? "sin admin"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-neutral-300">{entry.note ?? "Sin nota."}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-500">
                      Todavía no hay cambios comerciales registrados para esta empresa.
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <section className="k21-card p-6">
              <div className="text-xs uppercase tracking-wide text-neutral-500">Selecciona una empresa</div>
              <h2 className="mt-2 text-xl font-semibold text-white">Sin empresa seleccionada</h2>
              <p className="mt-3 text-sm text-neutral-400">
                Elige una fila del listado para ver o configurar la suscripción y el estado
                comercial.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
