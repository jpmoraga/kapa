import Link from "next/link";
import AdminPageHeader from "../_components/AdminPageHeader";
import { getAdminPricingPageData } from "@/lib/adminCommercial";
import { COMMERCIAL_PRICING_FIELD_DEFINITIONS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildPricingHref(params: { q: string; companyId?: string | null }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.companyId) query.set("companyId", params.companyId);
  const value = query.toString();
  return value ? `/admin/pricing?${value}` : "/admin/pricing";
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL");
}

function toneClass(kind: "neutral" | "success" | "warning" | "danger" | "info") {
  if (kind === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (kind === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  if (kind === "danger") return "border-red-500/30 bg-red-500/10 text-red-200";
  if (kind === "info") return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  return "border-white/10 bg-white/[0.04] text-neutral-300";
}

function flashMessage(code: string | undefined) {
  switch (code) {
    case "default-pricing-updated":
      return {
        tone: "success" as const,
        text: "Plan base comercial actualizado. No se recalculó pricing histórico ni se tocaron movimientos aprobados.",
      };
    case "company-pricing-updated":
      return {
        tone: "success" as const,
        text: "Pricing comercial por empresa actualizado.",
      };
    default:
      return null;
  }
}

function errorMessage(code: string | undefined) {
  switch (code) {
    case "company_not_found":
      return "La empresa indicada no existe o no está disponible para admin.";
    case "pricing_plan_not_found":
      return "El pricing plan seleccionado no existe.";
    case "invalid_decimal":
      return "Una de las tasas o fees no tiene formato decimal válido.";
    case "invalid_integer":
      return "Uno de los campos enteros no tiene un valor válido.";
    default:
      return code ? "No se pudo guardar la configuración de pricing." : null;
  }
}

function formatSource(source: string) {
  if (source === "company_override") return "info" as const;
  if (source === "company_plan") return "success" as const;
  if (source === "default_plan") return "warning" as const;
  return "neutral" as const;
}

export default async function AdminPricingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = firstString(sp.q) ?? "";
  const companyId = firstString(sp.companyId) ?? null;
  const flash = flashMessage(firstString(sp.flash));
  const error = errorMessage(firstString(sp.error));
  const data = await getAdminPricingPageData({ companyId, q });
  const selectedCompany = data.selectedCompany;
  const returnTo = buildPricingHref({
    q,
    companyId: selectedCompany?.companyId ?? companyId,
  });

  const defaultRuleMap = Object.fromEntries(
    (data.defaultPlan?.rules ?? []).map((rule) => [
      rule.key,
      rule.valueDecimal?.toString() ?? (typeof rule.valueInt === "number" ? String(rule.valueInt) : ""),
    ])
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AdminPageHeader
        eyebrow="Admin / Pricing"
        title="Pricing comercial"
        description="Vista y control del pricing comercial efectivo. La precedencia queda explícita y separada de la ejecución patrimonial."
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

      <div className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
        <div className="text-xs uppercase tracking-wide text-sky-100">Precedencia oficial</div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {[
            "1. Override directo de empresa",
            "2. Plan asignado a la empresa",
            "3. Plan base del sistema",
            "4. Fallback legacy del código",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-sky-400/20 bg-sky-950/20 px-4 py-3 text-sm text-sky-50"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <section className="space-y-6">
          <section className="k21-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-500">Plan base</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Pricing base del sistema</h2>
                <p className="mt-2 text-sm text-neutral-400">
                  Esta configuración define el baseline comercial visible para toda empresa que no
                  tenga plan asignado ni override propio.
                </p>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-neutral-400">
                {data.defaultPlan ? data.defaultPlan.name : "Aún no creado"}
              </div>
            </div>

            <form action="/api/admin/pricing/default" method="post" className="mt-5 space-y-4">
              <input type="hidden" name="returnTo" value={returnTo} />
              <div className="grid gap-4 md:grid-cols-2">
                {COMMERCIAL_PRICING_FIELD_DEFINITIONS.map((definition) => (
                  <div key={definition.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <label className="text-sm font-medium text-white">{definition.label}</label>
                    <div className="mt-1 text-xs text-neutral-500">{definition.description}</div>
                    <input
                      name={definition.key}
                      defaultValue={defaultRuleMap[definition.key] ?? data.fallbackRules[definition.key] ?? ""}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                    />
                    <div className="mt-2 text-xs text-neutral-500">
                      Fallback legacy: {data.fallbackRules[definition.key] ?? "—"}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm font-medium text-white/80">Nota</label>
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Ej: ajuste comercial base para nuevos clientes pyme."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
                  Guardar plan base
                </button>
              </div>
            </form>
          </section>

          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Pricing plans</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Planes disponibles</h2>
            <div className="mt-4 space-y-3">
              {data.plans.length ? (
                data.plans.map((plan) => (
                  <div key={plan.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-white">{plan.name}</div>
                        <div className="mt-1 text-xs text-neutral-500">
                          Creado {formatDateTime(plan.createdAt.toISOString())}
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] ${
                          plan.isDefault ? toneClass("warning") : toneClass("neutral")
                        }`}
                      >
                        {plan.isDefault ? "Default" : "Asignable"}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-neutral-500">
                      Empresas: {plan._count.companies} · User pricing legacy: {plan._count.users}
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {plan.rules.map((rule) => (
                        <div
                          key={rule.key}
                          className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-neutral-300"
                        >
                          <div className="font-medium text-white">{rule.key}</div>
                          <div className="mt-1">
                            {rule.valueDecimal?.toString() ??
                              (typeof rule.valueInt === "number" ? String(rule.valueInt) : "—")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-500">
                  Todavía no existen pricing plans persistidos. El formulario superior crea y
                  mantiene el plan base comercial.
                </div>
              )}
            </div>
          </section>
        </section>

        <div className="space-y-6">
          <section className="k21-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-neutral-500">Empresas</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Pricing efectivo por cliente</h2>
                <p className="mt-2 text-sm text-neutral-400">
                  Selecciona una empresa para ver qué pricing comercial le aplica hoy.
                </p>
              </div>

              <form method="get" className="flex w-full max-w-md flex-wrap items-end gap-3">
                {selectedCompany ? <input type="hidden" name="companyId" value={selectedCompany.companyId} /> : null}
                <div className="min-w-[220px] flex-1">
                  <label className="text-xs text-neutral-400">Buscar por empresa o RUT</label>
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="empresa, rut o plan"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
                  Buscar
                </button>
                <Link href="/admin/pricing" className="k21-btn-secondary px-4 py-3 text-sm">
                  Limpiar
                </Link>
              </form>
            </div>

            <div className="mt-4 max-h-[340px] overflow-y-auto space-y-3">
              {data.companies.length ? (
                data.companies.map((company) => {
                  const selected = company.companyId === selectedCompany?.companyId;
                  return (
                    <div
                      key={company.companyId}
                      className={`rounded-2xl border p-4 ${
                        selected
                          ? "border-white/20 bg-white/[0.06]"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">{company.companyName}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {company.companyRut ?? "Sin RUT"} · {company.kind}
                          </div>
                        </div>
                        <Link
                          href={buildPricingHref({ q, companyId: company.companyId })}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
                        >
                          Ver
                        </Link>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full border px-2 py-1 ${toneClass("neutral")}`}>
                          {company.assignedPlanName ?? "Plan base"}
                        </span>
                        <span className={`rounded-full border px-2 py-1 ${toneClass("warning")}`}>
                          {company.subscriptionPlanLabel}
                        </span>
                        <span className={`rounded-full border px-2 py-1 ${toneClass("info")}`}>
                          {company.commercialStatusLabel}
                        </span>
                        {company.hasOverride ? (
                          <span className={`rounded-full border px-2 py-1 ${toneClass("success")}`}>
                            Override empresa
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-500">
                  No encontré empresas para el filtro actual.
                </div>
              )}
            </div>
          </section>

          {selectedCompany ? (
            <>
              <section className="k21-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-neutral-500">Empresa seleccionada</div>
                    <h2 className="mt-2 text-xl font-semibold text-white">{selectedCompany.companyName}</h2>
                    <div className="mt-2 text-sm text-neutral-400">
                      {selectedCompany.companyRut ?? "Sin RUT"} · {selectedCompany.subscription.planLabel} ·{" "}
                      {selectedCompany.commercial.statusLabel}
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
                      href={`/admin/subscriptions?companyId=${selectedCompany.companyId}`}
                      className="k21-btn-secondary px-3 py-2 text-sm"
                    >
                      Ver suscripción
                    </Link>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedCompany.pricing.precedence.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <section className="k21-card p-6">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Pricing efectivo</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Qué aplica hoy</h2>
                <div className="mt-4 space-y-3">
                  {selectedCompany.pricing.effectiveFields.map((field) => (
                    <div
                      key={field.key}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">{field.label}</div>
                          <div className="mt-1 text-xs text-neutral-500">{field.description}</div>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] ${toneClass(
                            formatSource(field.source)
                          )}`}
                        >
                          {field.sourceLabel}
                        </span>
                      </div>
                      <div className="mt-3 text-lg font-semibold text-white">{field.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section id="company-pricing-editor" className="k21-card scroll-mt-24 p-6">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Override empresa</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Editar pricing por empresa</h2>
                <div className="mt-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-100">
                  Aquí puedes dejar un fee en <code>0</code> si quieres un trato comercial sin fee
                  para esta empresa. Vaciar todos los campos elimina el override directo.
                </div>
                <form
                  action={`/api/admin/pricing/companies/${selectedCompany.companyId}`}
                  method="post"
                  className="mt-4 space-y-4"
                >
                  <input type="hidden" name="returnTo" value={returnTo} />

                  <div>
                    <label className="text-sm font-medium text-white/80">Plan asignado a la empresa</label>
                    <select
                      name="companyPlanId"
                      defaultValue={selectedCompany.pricing.assignedPlan?.id ?? ""}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#101216] px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="">Usar plan base</option>
                      {data.plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-white/80">Fee compra BTC</label>
                      <input
                        name="buyBtcFeePct"
                        defaultValue={
                          selectedCompany.pricing.effectiveFields.find(
                            (field) => field.key === "TRADE_BUY_BTC_FEE_PCT" && field.source === "company_override"
                          )?.value ?? ""
                        }
                        placeholder="0.015"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80">Fee venta BTC</label>
                      <input
                        name="sellBtcFeePct"
                        defaultValue={
                          selectedCompany.pricing.effectiveFields.find(
                            (field) => field.key === "TRADE_SELL_BTC_FEE_PCT" && field.source === "company_override"
                          )?.value ?? ""
                        }
                        placeholder="0.015"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80">APR crédito estándar</label>
                      <input
                        name="loanAprStandard"
                        defaultValue={
                          selectedCompany.pricing.effectiveFields.find(
                            (field) => field.key === "LOAN_APR_STANDARD" && field.source === "company_override"
                          )?.value ?? ""
                        }
                        placeholder="0.16"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80">APR crédito suscrito</label>
                      <input
                        name="loanAprSubscriber"
                        defaultValue={
                          selectedCompany.pricing.effectiveFields.find(
                            (field) => field.key === "LOAN_APR_SUBSCRIBER" && field.source === "company_override"
                          )?.value ?? ""
                        }
                        placeholder="0.12"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80">Nota comercial</label>
                    <textarea
                      name="note"
                      rows={4}
                      defaultValue={selectedCompany.pricing.overrideNote ?? ""}
                      placeholder="Ej: fee preferente para cliente pyme asistido."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-neutral-500">
                      Override actualizado: {formatDateTime(selectedCompany.pricing.overrideUpdatedAt)} ·{" "}
                      {selectedCompany.pricing.overrideUpdatedByAdminEmail ?? "sin admin"}
                    </div>
                    <button type="submit" className="k21-btn-primary px-4 py-3 text-sm">
                      Guardar pricing empresa
                    </button>
                  </div>
                </form>
              </section>

              <section className="k21-card p-6">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Legacy read-only</div>
                <h2 className="mt-2 text-xl font-semibold text-white">User pricing heredado</h2>
                <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                  Los overrides en <code>UserPricing</code> se muestran solo como visibilidad
                  heredada. La capa oficial de esta fase es company-level.
                </div>
                <div className="mt-4 space-y-3">
                  {selectedCompany.pricing.legacyUserPricings.length ? (
                    selectedCompany.pricing.legacyUserPricings.map((entry) => (
                      <div
                        key={entry.userId}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="font-medium text-white">{entry.name ?? entry.email}</div>
                        <div className="mt-1 text-xs text-neutral-500">{entry.email}</div>
                        <div className="mt-2 text-sm text-neutral-200">{entry.planName}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-500">
                      No hay user pricing heredado visible para esta empresa.
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
                Elige una empresa para revisar su pricing efectivo y configurar plan/override.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
