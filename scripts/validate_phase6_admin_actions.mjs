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
  "prisma/schema.prisma",
  "prisma/migrations/20260421170000_phase6_admin_actions_secure_ops/migration.sql",
  "lib/adminActions.ts",
  "lib/treasury/approveMovement.ts",
  "app/api/admin/actions/route.ts",
  "app/api/admin/actions/[id]/route.ts",
  "app/api/admin/actions/subscription-charge/route.ts",
  "app/api/admin/actions/buy-btc/route.ts",
  "app/api/admin/actions/sell-btc/route.ts",
  "app/api/admin/actions/assign-btc-external/route.ts",
  "app/admin/(protected)/audit/page.tsx",
  "app/admin/(protected)/customers/[companyId]/page.tsx",
];

for (const relPath of requiredFiles) ensureFile(relPath);

const schema = read("prisma/schema.prisma");
for (const snippet of [
  "model AdminAction",
  "model AdminActionEffect",
  "model SubscriptionCharge",
  "model AdminExternalBtcAssignment",
  "enum AdminActionType",
  "enum AdminActionStatus",
  "enum AdminActionEffectType",
  "enum SubscriptionChargeStatus",
  "enum AdminExternalBtcAssignmentStatus",
  "baseAmountUsd",
  "ADMIN_TRADE",
  "ADMIN_SUBSCRIPTION_CHARGE",
  "ADMIN_MANUAL_ASSIGNMENT",
]) {
  assert.match(schema, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const migration = read(
  "prisma/migrations/20260421170000_phase6_admin_actions_secure_ops/migration.sql"
);
for (const snippet of [
  "CREATE TABLE \"AdminAction\"",
  "CREATE TABLE \"AdminActionEffect\"",
  "CREATE TABLE \"SubscriptionCharge\"",
  "CREATE TABLE \"AdminExternalBtcAssignment\"",
  "ALTER TABLE \"CompanySubscription\"",
  "ADD COLUMN \"baseAmountUsd\"",
  "ALTER TYPE \"InternalMovementReason\" ADD VALUE IF NOT EXISTS 'ADMIN_TRADE'",
]) {
  assert.match(migration, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const adminActions = read("lib/adminActions.ts");
for (const snippet of [
  "createOrReuseAction",
  "requestHash",
  "idempotencyKey",
  "applyCompanySystemTransfer",
  "executeManualSubscriptionChargeFromAdmin",
  "executeAdminBuyBtcFromAdmin",
  "executeAdminSellBtcFromAdmin",
  "executeAdminExternalBtcAssignmentFromAdmin",
  "SubscriptionChargeStatus",
  "AdminExternalBtcAssignmentStatus",
  "approveMovementAsSystem",
  "InternalMovementReason.ADMIN_TRADE",
  "InternalMovementReason.ADMIN_SUBSCRIPTION_CHARGE",
  "InternalMovementReason.ADMIN_MANUAL_ASSIGNMENT",
]) {
  assert.match(adminActions, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.ok(
  !adminActions.includes('type: "adjust"'),
  "Admin actions service must not use adjust as an operational shortcut"
);

for (const relPath of [
  "app/api/admin/actions/route.ts",
  "app/api/admin/actions/[id]/route.ts",
  "app/api/admin/actions/subscription-charge/route.ts",
  "app/api/admin/actions/buy-btc/route.ts",
  "app/api/admin/actions/sell-btc/route.ts",
  "app/api/admin/actions/assign-btc-external/route.ts",
]) {
  const content = read(relPath);
  assert.match(content, /requireAdmin/);
  for (const forbidden of [
    "treasuryAccount.update",
    "treasuryAccount.updateMany",
    "treasuryAccount.upsert",
    "treasuryMovement.create",
    "adjust",
  ]) {
    assert.ok(
      !content.includes(forbidden),
      `Route handler must not mutate treasury directly (${forbidden}) in ${relPath}`
    );
  }
}

const approveMovement = read("lib/treasury/approveMovement.ts");
for (const snippet of [
  "feePercentOverride",
  "successInternalReason",
]) {
  assert.match(approveMovement, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const customerDetailPage = read("app/admin/(protected)/customers/[companyId]/page.tsx");
for (const snippet of [
  "Acciones admin",
  "Cobrar suscripción",
  "Comprar BTC",
  "Vender BTC",
  "Asignar BTC manual",
  "/api/admin/actions/subscription-charge",
  "/api/admin/actions/buy-btc",
  "/api/admin/actions/sell-btc",
  "/api/admin/actions/assign-btc-external",
]) {
  assert.match(
    customerDetailPage,
    new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  );
}

const auditPage = read("app/admin/(protected)/audit/page.tsx");
for (const snippet of ["Admin actions", "Log de acciones admin", "/api/admin/actions/"]) {
  assert.match(auditPage, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

console.log("validate_phase6_admin_actions: ok");
