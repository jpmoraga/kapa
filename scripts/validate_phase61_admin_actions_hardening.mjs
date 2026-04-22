import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function file(relPath) {
  return path.join(root, relPath);
}

function read(relPath) {
  return readFileSync(file(relPath), "utf8");
}

function ensureFile(relPath) {
  assert.ok(existsSync(file(relPath)), `Missing file: ${relPath}`);
}

const requiredFiles = [
  "lib/adminActions.ts",
  "lib/treasury/approveMovement.ts",
  "app/api/cron/retry-pending/route.ts",
  "app/api/admin/actions/[id]/reconcile/route.ts",
  "app/admin/(protected)/audit/page.tsx",
  "app/admin/(protected)/customers/[companyId]/page.tsx",
];

for (const relPath of requiredFiles) ensureFile(relPath);

const adminActions = read("lib/adminActions.ts");
for (const snippet of [
  "price_snapshot_stale",
  "manual_reference_price_disabled",
  "openByHash",
  "reconcileAdminActionById",
  "markActionFailedIfOpen",
  "Movimiento system wallet trade admin",
  "mirror=system_trade",
  "provider_required",
  "external_reference_required",
  "company_not_commercially_active",
]) {
  assert.match(adminActions, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(
  adminActions,
  /getLatestPriceSnapshot\(AssetCode\.BTC,\s*AssetCode\.CLP,\s*\{\s*allowManualFallback:\s*false/s
);

const approveMovement = read("lib/treasury/approveMovement.ts");
for (const snippet of [
  "isAdminSystemWalletOnlyExecution",
  "execution=system_wallet_only",
  "InternalMovementState.MANUAL_REVIEW",
  "InternalMovementReason.ADMIN_TRADE",
]) {
  assert.match(approveMovement, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const cronRetry = read("app/api/cron/retry-pending/route.ts");
for (const snippet of ['{ internalNote: { contains: "adminAction=" } }', '{ internalNote: { contains: "execution=system_wallet_only" } }']) {
  assert.match(cronRetry, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const reconcileRoute = read("app/api/admin/actions/[id]/reconcile/route.ts");
assert.match(reconcileRoute, /requireAdmin/);
assert.match(reconcileRoute, /reconcileAdminActionById/);

const auditPage = read("app/admin/(protected)/audit/page.tsx");
assert.match(auditPage, /Reconciliar/);
assert.match(auditPage, /\/api\/admin\/actions\/\$\{row\.id\}\/reconcile/);

const customerDetailPage = read("app/admin/(protected)/customers/[companyId]/page.tsx");
assert.match(customerDetailPage, /Override manual deshabilitado/);
assert.equal(
  (customerDetailPage.match(/name="referencePriceClp"/g) ?? []).length,
  1,
  "Solo la asignación externa debe seguir pidiendo precio manual de referencia"
);
assert.match(customerDetailPage, /name="provider"/);
assert.match(customerDetailPage, /name="externalReference"/);
assert.match(customerDetailPage, /required/);

for (const relPath of [
  "app/api/admin/actions/subscription-charge/route.ts",
  "app/api/admin/actions/buy-btc/route.ts",
  "app/api/admin/actions/sell-btc/route.ts",
  "app/api/admin/actions/assign-btc-external/route.ts",
  "app/api/admin/actions/[id]/reconcile/route.ts",
]) {
  const content = read(relPath);
  assert.match(content, /requireAdmin/);
  for (const forbidden of [
    "treasuryAccount.update",
    "treasuryAccount.updateMany",
    "treasuryAccount.upsert",
    "treasuryMovement.update",
    "treasuryMovement.updateMany",
  ]) {
    assert.ok(
      !content.includes(forbidden),
      `Route handler must not mutate treasury directly (${forbidden}) in ${relPath}`
    );
  }
}

console.log("validate_phase61_admin_actions_hardening: ok");
