import { randomUUID } from "crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminPageHeader from "../../_components/AdminPageHeader";
import { getAdminCustomerDetail } from "@/lib/adminCustomers";
import { getCompanyCommercialSnapshot } from "@/lib/adminCommercial";
import { getAdminActionDetail, listAdminActions } from "@/lib/adminActions";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-CL");
}

function formatClp(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} CLP`;
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function formatUsd(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} USD`;
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatBtc(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} BTC`;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

function badgeClasses(kind: "neutral" | "success" | "warning") {
  if (kind === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (kind === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  return "border-white/10 bg-white/[0.04] text-neutral-300";
}

function extendedBadgeClasses(kind: "neutral" | "success" | "warning" | "danger" | "info") {
  if (kind === "danger") return "border-red-500/30 bg-red-500/10 text-red-200";
  if (kind === "info") return "border-sky-500/30 bg-sky-500/10 text-sky-100";
  return badgeClasses(kind);
}

function activityLabel(value: "movement" | "loan" | null) {
  if (value === "movement") return "Movimiento";
  if (value === "loan") return "Crédito";
  return "—";
}

function commercialTone(label: string) {
  if (label === "Activo") return "success" as const;
  if (label === "Pausado") return "warning" as const;
  if (label === "Restringido") return "danger" as const;
  if (label === "Inactivo") return "neutral" as const;
  return "info" as const;
}

function pricingSourceTone(source: string) {
  if (source === "company_override") return "info" as const;
  if (source === "company_plan") return "success" as const;
  if (source === "default_plan") return "warning" as const;
  return "neutral" as const;
}

function adminActionTone(statusLabel: string) {
  if (statusLabel === "Succeeded") return "success" as const;
  if (statusLabel === "Failed") return "danger" as const;
  if (statusLabel === "Processing" || statusLabel === "Pending") return "warning" as const;
  return "neutral" as const;
}

function flashMessage(code: string | undefined) {
  switch (code) {
    case "admin-action-success":
      return {
        tone: "success" as const,
        text: "La acción admin se ejecutó y quedó auditada.",
      };
    case "admin-action-failed":
      return {
        tone: "warning" as const,
        text: "La acción admin quedó registrada en auditoría, pero no se pudo completar.",
      };
    case "btc_clp_refreshed":
      return {
        tone: "success" as const,
        text: "Snapshot BTC/CLP actualizado. Ya puedes reintentar la compra o venta BTC.",
      };
    case "usd_clp_refreshed":
      return {
        tone: "success" as const,
        text: "Snapshot USD/CLP actualizado. Ya puedes reintentar cobros o conversiones que lo usen.",
      };
    default:
      return null;
  }
}

function errorMessage(code: string | undefined) {
  switch (code) {
    case "confirmation_text_invalid":
      return "La confirmación escrita no coincide con la acción solicitada.";
    case "company_not_found":
      return "No encontré la empresa objetivo para ejecutar la acción admin.";
    case "invalid_price_pair":
      return "El par de pricing solicitado no es válido para refresco manual.";
    case "subscription_not_configured":
      return "La empresa no tiene una suscripción oficial configurada.";
    case "subscription_not_active":
      return "La suscripción oficial no está activa.";
    case "subscription_free_temp":
      return "No se puede cobrar una suscripción marcada como free temporal.";
    case "base_amount_required":
      return "La suscripción base no tiene monto USD configurado.";
    case "custom_amount_required":
      return "La suscripción custom no tiene monto USD configurado.";
    case "company_not_commercially_active":
      return "La empresa no está comercialmente activa para operar desde admin.";
    case "INSUFFICIENT_CLIENT_FUNDS":
      return "Saldo insuficiente para ejecutar la acción solicitada.";
    case "SYSTEM_WALLET_INSUFFICIENT":
      return "System wallet sin inventario suficiente para ejecutar la acción.";
    case "INSUFFICIENT_CLP":
      return "Saldo CLP insuficiente del cliente para completar la compra.";
    case "INSUFFICIENT_FUNDS":
      return "Saldo insuficiente del cliente para completar la operación.";
    case "invalid_spend_amount_clp":
      return "El monto CLP para la compra es inválido.";
    case "invalid_amount_btc":
      return "El monto BTC indicado es inválido.";
    case "invalid_reference_price_clp":
      return "El precio de referencia CLP es inválido.";
    case "invalid_reference_fee_clp":
      return "La fee de referencia CLP es inválida.";
    case "invalid_asset_code":
      return "El asset seleccionado es inválido.";
    case "idempotency_conflict":
      return "La idempotency key ya existe para otra acción distinta. Recarga la vista antes de reintentar.";
    case "price_snapshot_missing":
      return "No hay un snapshot de precio disponible para ejecutar la acción.";
    case "price_snapshot_stale":
      return "El snapshot de precio disponible está vencido. Actualiza pricing antes de operar.";
    case "btc_clp_refresh_failed":
      return "No pude refrescar BTC/CLP desde mercado. Revisa conectividad con Buda y reintenta.";
    case "usd_clp_refresh_failed":
      return "No pude refrescar USD/CLP desde mercado. Revisa conectividad con Buda y reintenta.";
    case "pricing_field_missing":
      return "Falta una condición de pricing comercial requerida para esta operación.";
    case "pricing_field_invalid":
      return "El pricing comercial configurado para esta empresa es inválido.";
    case "manual_reference_price_disabled":
      return "La operación no acepta precio manual. Se ejecuta solo con snapshot fresco del sistema.";
    case "trade_not_approved":
    case "NOT_EXECUTED_INLINE":
      return "La operación no pudo ejecutarse inline contra system wallet.";
    case "trade_manual_review_required":
      return "La operación quedó en revisión manual y no se ejecutó inline contra system wallet.";
    case "admin_action_processing_timeout":
      return "La acción quedó abierta demasiado tiempo y requiere reconciliación manual.";
    case "provider_required":
      return "Debes indicar el proveedor para la asignación BTC externa.";
    case "external_reference_required":
      return "Debes indicar una referencia externa para la asignación BTC externa.";
    case "trade_action_orphaned":
      return "La acción de compra/venta quedó sin movimiento reconciliado y requiere revisión manual.";
    case "subscription_charge_orphaned":
      return "El cobro de suscripción quedó sin reconciliación y requiere revisión manual.";
    case "external_assignment_orphaned":
      return "La asignación externa quedó sin reconciliación y requiere revisión manual.";
    case "subscription_charge_failed":
    case "trade_execution_failed":
    case "external_assignment_failed":
    case "admin_buy_btc_failed":
    case "admin_sell_btc_failed":
    case "admin_assign_btc_external_failed":
      return "Ocurrió un error interno inesperado al preparar la acción admin.";
    case "admin_action_detail_missing":
      return "La acción terminó sin detalle disponible. Revisa la auditoría antes de reintentar.";
    default:
      return code ? "No se pudo completar la acción admin." : null;
  }
}

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { companyId } = await params;
  const sp = searchParams ? await searchParams : {};
  const flash = flashMessage(Array.isArray(sp.flash) ? sp.flash[0] : sp.flash);
  const error = errorMessage(Array.isArray(sp.error) ? sp.error[0] : sp.error);
  const errorCode = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const auditVisibility = Array.isArray(sp.audit) ? sp.audit[0] : sp.audit;
  const actionId = Array.isArray(sp.actionId) ? sp.actionId[0] : sp.actionId;
  const [customer, commercial, adminActions, actionDetail] = await Promise.all([
    getAdminCustomerDetail(companyId),
    getCompanyCommercialSnapshot(companyId),
    listAdminActions({ companyId, take: 8 }),
    actionId ? getAdminActionDetail(actionId) : Promise.resolve(null),
  ]);

  if (!customer) notFound();

  const actionSucceeded = actionDetail?.status === "SUCCEEDED";
  const actionFailedAudit =
    actionDetail != null &&
    actionDetail.status !== "SUCCEEDED" &&
    actionDetail.status !== "PENDING" &&
    actionDetail.status !== "PROCESSING";
  const actionOpenAudit =
    actionDetail?.status === "PENDING" || actionDetail?.status === "PROCESSING";
  const effectiveFlash = actionSucceeded ? flashMessage("admin-action-success") : flash;
  const showFlash = effectiveFlash && !actionFailedAudit && !actionOpenAudit;
  const showError =
    Boolean(error) &&
    !actionSucceeded &&
    (!showFlash || auditVisibility === "not-recorded" || actionFailedAudit || actionOpenAudit);

  const chargeKey = randomUUID();
  const buyKey = randomUUID();
  const sellKey = randomUUID();
  const assignKey = randomUUID();
  const returnTo = `/admin/customers/${companyId}`;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AdminPageHeader
        eyebrow="Admin / Clientes / Ficha operativa"
        title={customer.displayName}
        description="Ficha operativa del cliente/empresa. Aquí viven los saldos, el contexto comercial visible y las acciones admin auditadas; el lifecycle documental sigue separado en Empresas."
        actions={
          <>
            <Link href="/admin/customers" className="k21-btn-secondary px-3 py-2 text-sm">
              Volver a Clientes
            </Link>
            <Link href={`/admin/companies/${companyId}`} className="k21-btn-secondary px-3 py-2 text-sm">
              Ver lifecycle empresa
            </Link>
          </>
        }
      />

      {showFlash ? (
        <div
          className={`mt-6 rounded-2xl border p-4 text-sm ${
            effectiveFlash.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              : "border-amber-500/30 bg-amber-500/10 text-amber-100"
          }`}
        >
          {effectiveFlash.text}
          {actionId ? (
            <span className="block pt-2 text-xs text-neutral-200">
              Action ID: <code>{actionId}</code>
            </span>
          ) : null}
          {auditVisibility === "recorded" ? (
            <span className="block pt-2 text-xs text-neutral-200">
              Esta acción debería aparecer en{" "}
              <Link href={`/admin/audit?companyId=${companyId}`} className="underline underline-offset-4">
                /admin/audit
              </Link>
              .
            </span>
          ) : null}
        </div>
      ) : null}

      {showError ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <div>{error}</div>
          {auditVisibility === "not-recorded" ? (
            <div className="pt-2 text-xs text-red-100/90">
              El fallo ocurrió antes de crear una nueva <code>AdminAction</code>. No debería
              aparecer una fila nueva en auditoría para este intento.
            </div>
          ) : null}
          {auditVisibility === "recorded" ? (
            <div className="pt-2 text-xs text-red-100/90">
              El error corresponde a una acción ya auditada. Revísala en{" "}
              <Link href={`/admin/audit?companyId=${companyId}`} className="underline underline-offset-4">
                /admin/audit
              </Link>
              {actionId ? (
                <>
                  {" "}
                  con Action ID <code>{actionId}</code>
                </>
              ) : null}
              .
            </div>
          ) : null}
          {actionFailedAudit ? (
            <div className="pt-2 text-xs text-red-100/90">
              La acción sí quedó auditada, pero terminó en <code>{actionDetail?.status}</code>. Revisa
              su detalle en{" "}
              <Link href={`/admin/audit?companyId=${companyId}`} className="underline underline-offset-4">
                /admin/audit
              </Link>
              .
            </div>
          ) : null}
          {actionOpenAudit ? (
            <div className="pt-2 text-xs text-red-100/90">
              La acción quedó auditada pero sigue abierta en estado <code>{actionDetail?.status}</code>.
              Revisa auditoría o reconcíliala antes de reintentar.
            </div>
          ) : null}
          {errorCode ? (
            <div className="pt-2 text-xs text-red-100/90">
              Código: <code>{errorCode}</code>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Contacto principal</div>
          <div className="mt-2 text-lg font-semibold text-white">{customer.summary.contactName ?? "—"}</div>
          <div className="mt-2 text-sm text-neutral-400">{customer.summary.contactEmail ?? "—"}</div>
          <div className="mt-1 text-xs text-neutral-500">{customer.summary.contactRole ?? "—"}</div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Tipo / estado</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-2 py-1 text-[11px] ${badgeClasses("neutral")}`}>
              {customer.kind}
            </span>
            <span
              className={`rounded-full border px-2 py-1 text-[11px] ${
                customer.summary.onboardingCompleted
                  ? badgeClasses("success")
                  : badgeClasses("warning")
              }`}
            >
              {customer.summary.onboardingCompleted ? "Onboarding completo" : "Pendiente"}
            </span>
          </div>
          <div className="mt-3 text-sm text-neutral-400">
            {customer.companyRut ? `RUT: ${customer.companyRut}` : "Sin RUT registrado"}
          </div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Actividad</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {formatDateTime(customer.summary.lastActivityAt)}
          </div>
          <div className="mt-2 text-sm text-neutral-400">
            Fuente: {activityLabel(customer.summary.lastActivitySource)}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Fecha creación empresa: {customer.createdAt ? formatDateTime(customer.createdAt) : "—"}
          </div>
        </div>

        <div className="k21-card p-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Capa comercial</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2 py-1 text-[11px] ${extendedBadgeClasses(
                commercialTone(commercial?.commercial.statusLabel ?? "Draft")
              )}`}
            >
              {commercial?.commercial.statusLabel ?? "Draft"}
            </span>
            <span
              className={`rounded-full border px-2 py-1 text-[11px] ${extendedBadgeClasses(
                commercial?.subscription.isSubscribedEffective ? "success" : "neutral"
              )}`}
            >
              {commercial?.subscription.statusLabel ?? "Sin definir"}
            </span>
          </div>
          <div className="mt-2 text-sm text-neutral-400">
            {commercial?.subscription.planLabel ?? "Sin plan"}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Configuración oficial company-level. Legacy visible solo como fallback.
          </div>
        </div>
      </div>

      <section id="ficha-operativa" className="mt-6 k21-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Acciones admin</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Ficha operativa y acceso rápido</h2>
            <p className="mt-2 max-w-3xl text-sm text-neutral-400">
              Esta es la vista operativa del cliente. Las acciones admin disponibles en esta fase se
              ejecutan desde esta misma ficha y quedan auditadas.
            </p>
          </div>
          <Link href={`/admin/audit?companyId=${companyId}`} className="k21-btn-secondary px-3 py-2 text-sm">
            Ver auditoría
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <a
            href="#accion-cobrar-suscripcion"
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">Disponible</div>
            <div className="mt-2 font-medium text-white">Cobrar suscripción</div>
          </a>
          <a
            href="#accion-comprar-btc"
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">Disponible</div>
            <div className="mt-2 font-medium text-white">Comprar BTC</div>
          </a>
          <a
            href="#accion-vender-btc"
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">Disponible</div>
            <div className="mt-2 font-medium text-white">Vender BTC</div>
          </a>
          <a
            href="#accion-asignar-btc-externo"
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-500">Excepcional</div>
            <div className="mt-2 font-medium text-white">Asignar BTC externa</div>
          </a>
        </div>
      </section>

      <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
        La valorización total se omite para no mezclar pricing o lógica sensible sobre patrimonio.
        Las acciones admin de esta fase solo se ejecutan desde esta ficha operativa, a través de
        flujos explícitos e idempotentes.
      </div>

      <section className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-sky-100">Snapshots de operación</div>
            <h2 className="mt-2 text-lg font-semibold text-white">Actualizar pricing de mercado</h2>
            <p className="mt-2 max-w-3xl text-sm text-sky-50/90">
              <code>Comprar BTC</code> y <code>Vender BTC</code> usan un snapshot fresco de{" "}
              <code>BTC/CLP</code>. Los cobros de suscripción en CLP/USD usan <code>USD/CLP</code>.
              Si ves <code>price_snapshot_stale</code>, refresca aquí y vuelve a intentar.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <form action="/api/admin/pricing/refresh-market" method="post">
            <input type="hidden" name="pair" value="BTC_CLP" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit" className="k21-btn-secondary px-4 py-3 text-sm">
              Actualizar BTC/CLP
            </button>
          </form>
          <form action="/api/admin/pricing/refresh-market" method="post">
            <input type="hidden" name="pair" value="USDT_CLP" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button type="submit" className="k21-btn-secondary px-4 py-3 text-sm">
              Actualizar USD/CLP
            </button>
          </form>
          <Link href="/admin/pricing" className="k21-btn-secondary px-4 py-3 text-sm">
            Ver pricing comercial
          </Link>
        </div>
      </section>

      <section id="acciones-admin" className="mt-6 k21-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Saldos actuales</div>
            <h2 className="mt-2 text-xl font-semibold text-white">TreasuryAccount vigente</h2>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-neutral-400">
            Fuente de verdad actual
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">CLP</div>
            <div className="mt-2 text-2xl font-semibold text-white">{formatClp(customer.balances.clp)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">USD</div>
            <div className="mt-2 text-2xl font-semibold text-white">{formatUsd(customer.balances.usd)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">BTC</div>
            <div className="mt-2 text-2xl font-semibold text-white">{formatBtc(customer.balances.btc)}</div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="k21-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Resumen de empresa</div>
              <h2 className="mt-2 text-xl font-semibold text-white">Contexto comercial y estructural</h2>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/subscriptions?companyId=${companyId}`} className="k21-btn-secondary px-3 py-2 text-sm">
                Suscripción
              </Link>
              <Link href={`/admin/pricing?companyId=${companyId}`} className="k21-btn-secondary px-3 py-2 text-sm">
                Pricing
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-neutral-500">Estado comercial</div>
              <div className="mt-2">
                <span
                  className={`rounded-full border px-2 py-1 text-[11px] ${extendedBadgeClasses(
                    commercialTone(commercial?.commercial.statusLabel ?? "Draft")
                  )}`}
                >
                  {commercial?.commercial.statusLabel ?? "Draft"}
                </span>
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                Último cambio: {formatDateTime(commercial?.commercial.updatedAt ?? null)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-neutral-500">Suscripción oficial</div>
              <div className="mt-2 text-sm font-medium text-white">
                {commercial?.subscription.planLabel ?? "Sin plan"}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {commercial?.subscription.statusLabel ?? "Sin definir"} · inicio{" "}
                {formatDateTime(commercial?.subscription.startedAt ?? null)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-neutral-500">Pricing company</div>
              <div className="mt-2 text-sm font-medium text-white">
                {commercial?.pricing.assignedPlan?.name ?? customer.pricing.companyPlanName ?? "Plan base"}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {commercial?.pricing.companyOverrideConfigured
                  ? "Override directo configurado"
                  : commercial?.pricing.assignedPlan?.isDefault
                  ? "Plan default"
                  : commercial?.pricing.assignedPlan
                  ? "Plan asignado"
                  : "Sin plan company"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-neutral-500">User pricing</div>
              <div className="mt-2 text-sm font-medium text-white">
                {customer.pricing.userPricingCount}
              </div>
              <div className="mt-1 text-xs text-neutral-500">Miembros con override de pricing</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-neutral-500">Funds declaration</div>
              <div className="mt-2 text-sm font-medium text-white">
                {formatDateTime(customer.summary.fundsDeclAcceptedAt)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs text-neutral-500">Privacidad / términos</div>
              <div className="mt-2 text-sm font-medium text-white">
                {formatDateTime(customer.summary.privacyAcceptedAt)}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Términos: {formatDateTime(customer.summary.termsAcceptedAt)}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Pricing efectivo visible</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {(commercial?.pricing.effectiveFields ?? []).map((field) => (
                <div
                  key={field.key}
                  className="rounded-2xl border border-white/10 bg-black/10 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-white">{field.label}</div>
                      <div className="mt-1 text-xs text-neutral-500">{field.description}</div>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] ${extendedBadgeClasses(
                        pricingSourceTone(field.source)
                      )}`}
                    >
                      {field.sourceLabel}
                    </span>
                  </div>
                  <div className="mt-3 text-lg font-semibold text-white">{field.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Suscripción y legacy</div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="text-xs text-neutral-500">Oficial company-level</div>
                <div className="mt-2 text-sm font-medium text-white">
                  {commercial?.subscription.statusLabel ?? "Sin definir"} ·{" "}
                  {commercial?.subscription.planLabel ?? "Sin plan"}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Fin: {formatDateTime(commercial?.subscription.endsAt ?? null)} · admin{" "}
                  {commercial?.subscription.updatedByAdminEmail ?? "—"}
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm text-neutral-300">
                  {commercial?.subscription.note ?? "Sin nota comercial de suscripción."}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="text-xs text-neutral-500">Legacy user signal</div>
                {customer.subscription.subscriberMembers.length ? (
                  <div className="mt-3 space-y-2 text-sm text-neutral-200">
                    {customer.subscription.subscriberMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                      >
                        <div className="font-medium text-white">{member.name ?? member.email}</div>
                        <div className="mt-1 text-xs text-neutral-500">
                          {member.email} · desde {formatDateTime(member.subscriberSince)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-neutral-500"
                  >
                    No hay miembros con la flag heredada <code>User.isSubscriber</code>.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Notas comerciales</div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs text-neutral-500">Notas</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-200">
                  {commercial?.commercial.notes ?? "Sin notas comerciales."}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Condición especial</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-200">
                  {commercial?.commercial.specialTermsNote ?? "Sin condición especial registrada."}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Trazabilidad comercial</div>
            <div className="mt-3 space-y-2">
              {(commercial?.auditLog ?? []).slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-white/10 bg-black/10 px-3 py-3"
                >
                  <div className="font-medium text-white">{entry.typeLabel}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {formatDateTime(entry.createdAt)} · {entry.actorAdminEmail ?? "sin admin"}
                  </div>
                  <div className="mt-2 text-sm text-neutral-300">{entry.note ?? "Sin nota."}</div>
                </div>
              ))}
              {!commercial?.auditLog?.length ? (
                <div className="text-sm text-neutral-500">Sin cambios comerciales registrados.</div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="k21-card p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Onboarding y miembros</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Contactos y readiness</h2>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Miembro</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Onboarding</th>
                  <th className="px-4 py-3 font-medium">Banco</th>
                  <th className="px-4 py-3 font-medium">Pricing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {customer.members.map((member) => (
                  <tr key={member.userId} className="align-top text-neutral-200">
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{member.name ?? member.email}</div>
                      <div className="mt-1 text-xs text-neutral-500">{member.email}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        Subscriber: {member.subscriber ? "Sí" : "No"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-300">{member.role}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-2 py-1 text-[11px] ${
                            member.onboarding.isComplete
                              ? badgeClasses("success")
                              : badgeClasses("warning")
                          }`}
                        >
                          {member.onboarding.step}
                        </span>
                        <span className={`rounded-full border px-2 py-1 text-[11px] ${badgeClasses("neutral")}`}>
                          docs {member.onboarding.hasIdDocument ? "ok" : "—"}
                        </span>
                        <span className={`rounded-full border px-2 py-1 text-[11px] ${badgeClasses("neutral")}`}>
                          perfil {member.onboarding.hasProfile ? "ok" : "—"}
                        </span>
                        <span className={`rounded-full border px-2 py-1 text-[11px] ${badgeClasses("neutral")}`}>
                          banco {member.onboarding.hasBankAccount ? "ok" : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-300">
                      {member.bankAccount ? (
                        <>
                          <div>{member.bankAccount.bankName ?? "—"}</div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {member.bankAccount.accountType ?? "—"} ·{" "}
                            {member.bankAccount.accountNumberMasked ?? "—"}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-300">
                      {member.userPricingPlanName ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-6 k21-card p-6">
        <div className="text-xs uppercase tracking-wide text-neutral-500">Actividad reciente</div>
        <h2 className="mt-2 text-xl font-semibold text-white">Movimientos</h2>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {customer.recentMovements.map((movement) => (
                <tr key={movement.id} className="align-top text-neutral-200">
                  <td className="px-4 py-4">
                    <div>{formatDateTime(movement.createdAt)}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      ejecutado {formatDateTime(movement.executedAt)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-300">{movement.type}</td>
                  <td className="px-4 py-4 text-sm text-neutral-300">{movement.assetCode}</td>
                  <td className="px-4 py-4 font-mono text-xs text-neutral-300">{movement.amount}</td>
                  <td className="px-4 py-4">
                    <div>{movement.status}</div>
                    <div className="mt-1 text-xs text-neutral-500">{movement.internalReason}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-300">{movement.note ?? "—"}</td>
                </tr>
              ))}
              {!customer.recentMovements.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Sin movimientos registrados para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 k21-card p-6">
        <div className="text-xs uppercase tracking-wide text-neutral-500">Créditos</div>
        <h2 className="mt-2 text-xl font-semibold text-white">Solo lectura</h2>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Borrower</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Principal CLP</th>
                <th className="px-4 py-3 font-medium">APR</th>
                <th className="px-4 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {customer.loans.map((loan) => (
                <tr key={loan.id} className="align-top text-neutral-200">
                  <td className="px-4 py-4 font-mono text-xs text-neutral-300">{loan.id}</td>
                  <td className="px-4 py-4">
                    <div>{loan.borrowerName ?? "—"}</div>
                    <div className="mt-1 text-xs text-neutral-500">{loan.borrowerEmail ?? "—"}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-300">{loan.status}</td>
                  <td className="px-4 py-4 font-mono text-xs text-neutral-300">{formatClp(loan.principalClp)}</td>
                  <td className="px-4 py-4 text-sm text-neutral-300">{loan.interestApr}</td>
                  <td className="px-4 py-4 text-sm text-neutral-300">{formatDateTime(loan.createdAt)}</td>
                </tr>
              ))}
              {!customer.loans.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Sin créditos asociados a esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 k21-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Acciones admin</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Operación auditada desde la ficha del cliente</h2>
            <p className="mt-2 max-w-3xl text-sm text-neutral-400">
              Cada acción crea primero un <code>AdminAction</code> y solo después ejecuta el flujo
              patrimonial correspondiente. En esta fase, buy/sell y asignación manual operan solo
              contra <code>system wallet</code>.
            </p>
          </div>
          <Link href={`/admin/audit?companyId=${companyId}`} className="k21-btn-secondary px-3 py-2 text-sm">
            Ver historial completo
          </Link>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-2">
          <section id="accion-cobrar-suscripcion" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Cobrar suscripción</div>
            <div className="mt-2 text-sm font-medium text-white">Acción disponible</div>
            <div className="mt-2 text-sm text-neutral-300">
              Referencia oficial:
              <span className="pl-2 font-medium text-white">
                {commercial?.subscription.customAmountUsd
                  ? `USD ${commercial.subscription.customAmountUsd} custom`
                  : commercial?.subscription.baseAmountUsd
                  ? `USD ${commercial.subscription.baseAmountUsd} base`
                  : "sin monto configurado"}
              </span>
            </div>
            <form action="/api/admin/actions/subscription-charge" method="post" className="mt-4 space-y-4">
              <input type="hidden" name="companyId" value={companyId} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="idempotencyKey" value={chargeKey} />
              <div>
                <label className="text-sm font-medium text-white/80">Asset a debitar</label>
                <select
                  name="debitAssetCode"
                  defaultValue="CLP"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#101216] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="CLP">CLP</option>
                  <option value="USD">USD</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Nota</label>
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Ej: cobro manual del período de abril."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Escribe COBRAR para confirmar</label>
                <input
                  name="confirmationText"
                  placeholder="COBRAR"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button type="submit" className="k21-btn-primary w-full px-4 py-3 text-sm">
                Cobrar suscripción desde saldo
              </button>
            </form>
          </section>

          <section id="accion-comprar-btc" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Comprar BTC</div>
            <div className="mt-2 text-sm font-medium text-white">Acción disponible</div>
            <div className="mt-2 text-sm text-neutral-300">
              Fee comercial efectivo:{" "}
              <span className="font-medium text-white">
                {commercial?.pricing.effectiveFields.find((field) => field.key === "TRADE_BUY_BTC_FEE_PCT")?.value ??
                  "—"}
              </span>
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Precio definido solo por snapshot fresco del sistema. Override manual deshabilitado.
            </div>
            <form action="/api/admin/actions/buy-btc" method="post" className="mt-4 space-y-4">
              <input type="hidden" name="companyId" value={companyId} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="idempotencyKey" value={buyKey} />
              <div>
                <label className="text-sm font-medium text-white/80">Monto CLP a gastar</label>
                <input
                  name="spendAmountClp"
                  placeholder="250000"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Nota</label>
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Ej: compra asistida para pyme."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Escribe COMPRAR para confirmar</label>
                <input
                  name="confirmationText"
                  placeholder="COMPRAR"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button type="submit" className="k21-btn-primary w-full px-4 py-3 text-sm">
                Comprar BTC por cliente
              </button>
            </form>
          </section>

          <section id="accion-vender-btc" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Vender BTC</div>
            <div className="mt-2 text-sm font-medium text-white">Acción disponible</div>
            <div className="mt-2 text-sm text-neutral-300">
              Fee comercial efectivo:{" "}
              <span className="font-medium text-white">
                {commercial?.pricing.effectiveFields.find((field) => field.key === "TRADE_SELL_BTC_FEE_PCT")?.value ??
                  "—"}
              </span>
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Precio definido solo por snapshot fresco del sistema. Override manual deshabilitado.
            </div>
            <form action="/api/admin/actions/sell-btc" method="post" className="mt-4 space-y-4">
              <input type="hidden" name="companyId" value={companyId} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="idempotencyKey" value={sellKey} />
              <div>
                <label className="text-sm font-medium text-white/80">BTC a vender</label>
                <input
                  name="amountBtc"
                  placeholder="0.01000000"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Nota</label>
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Ej: venta administrada para liquidar a CLP."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Escribe VENDER para confirmar</label>
                <input
                  name="confirmationText"
                  placeholder="VENDER"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button type="submit" className="k21-btn-primary w-full px-4 py-3 text-sm">
                Vender BTC por cliente
              </button>
            </form>
          </section>

          <section id="accion-asignar-btc-externo" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Asignación BTC externa</div>
            <div className="mt-2 text-sm font-medium text-white">Acción disponible con uso excepcional</div>
            <div className="mt-2 text-sm text-neutral-300">
              Caso formal para compras fuera de Buda. En esta fase exige inventario suficiente en{" "}
              <code>system wallet</code>.
            </div>
            <form action="/api/admin/actions/assign-btc-external" method="post" className="mt-4 space-y-4">
              <input type="hidden" name="companyId" value={companyId} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="idempotencyKey" value={assignKey} />
              <div>
                <label className="text-sm font-medium text-white/80">BTC a asignar</label>
                <input
                  name="amountBtc"
                  placeholder="0.01000000"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-white/80">Proveedor</label>
                  <input
                    name="provider"
                    required
                    placeholder="Mesa OTC / broker"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/80">Referencia externa</label>
                  <input
                    name="externalReference"
                    required
                    placeholder="OTC-2026-04-001"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-white/80">Precio referencia CLP</label>
                  <input
                    name="referencePriceClp"
                    placeholder="64500000"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/80">Fee referencia CLP</label>
                  <input
                    name="referenceFeeClp"
                    placeholder="15000"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Nota</label>
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Ej: compra externa ya liquidada y conciliada fuera de Buda."
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/80">Escribe ASIGNAR para confirmar</label>
                <input
                  name="confirmationText"
                  placeholder="ASIGNAR"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button type="submit" className="k21-btn-primary w-full px-4 py-3 text-sm">
                Asignar BTC manual externo
              </button>
            </form>
          </section>
        </div>
      </section>

      <section className="mt-6 k21-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Historial</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Historial de acciones admin</h2>
          </div>
          <Link href={`/admin/audit?companyId=${companyId}`} className="k21-btn-secondary px-3 py-2 text-sm">
            Ir a auditoría
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Resumen</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {adminActions.length ? (
                adminActions.map((row) => (
                  <tr key={row.id} className="align-top text-neutral-200">
                    <td className="px-4 py-4">
                      <div>{formatDateTime(row.createdAt)}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        fin {formatDateTime(row.completedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-300">{row.typeLabel}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] ${extendedBadgeClasses(
                          adminActionTone(row.statusLabel)
                        )}`}
                      >
                        {row.statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-300">
                      {row.resultSummary ?? row.errorCode ?? row.errorMessage ?? row.reason ?? "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/api/admin/actions/${row.id}`}
                          className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-100 transition hover:border-white/20 hover:bg-white/[0.06]"
                        >
                          JSON
                        </Link>
                        {row.status !== "SUCCEEDED" && row.status !== "CANCELLED" ? (
                          <form action={`/api/admin/actions/${row.id}/reconcile`} method="post">
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <button
                              type="submit"
                              className="inline-flex rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 transition hover:border-amber-400/40 hover:bg-amber-500/15"
                            >
                              Reconciliar
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-neutral-500">
                    Todavía no hay admin actions para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-neutral-300">
        La arquitectura ya deja un punto único para futuras acciones admin, pero los créditos siguen
        fuera de este alcance hasta tener reservas/holds de colateral correctamente diseñadas.
      </section>
    </div>
  );
}
