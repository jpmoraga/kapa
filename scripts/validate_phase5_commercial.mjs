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
  "lib/adminCommercial.ts",
  "lib/pricing.ts",
  "prisma/schema.prisma",
  "app/api/admin/subscriptions/route.ts",
  "app/api/admin/subscriptions/[id]/route.ts",
  "app/api/admin/commercial/[id]/route.ts",
  "app/api/admin/pricing/route.ts",
  "app/api/admin/pricing/default/route.ts",
  "app/api/admin/pricing/companies/[id]/route.ts",
  "app/admin/(protected)/subscriptions/page.tsx",
  "app/admin/(protected)/pricing/page.tsx",
  "app/admin/(protected)/customers/[companyId]/page.tsx",
];

for (const relPath of requiredFiles) ensureFile(relPath);

const schema = read("prisma/schema.prisma");
for (const snippet of [
  "model CompanyCommercialProfile",
  "model CompanySubscription",
  "model CompanyPricingOverride",
  "model CommercialAuditLog",
  "enum CommercialStatus",
  "enum CompanySubscriptionStatus",
  "enum CompanySubscriptionPlan",
  "enum CommercialAuditType",
]) {
  assert.match(schema, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const adminCommercial = read("lib/adminCommercial.ts");
for (const snippet of [
  "listAdminSubscriptions",
  "getCompanyCommercialSnapshot",
  "updateCompanyCommercialStatusFromAdmin",
  "updateCompanySubscriptionFromAdmin",
  "updateCompanyPricingFromAdmin",
  "updateDefaultPricingPlanFromAdmin",
  "Override directo de empresa",
  "Fallback legacy del código",
  "commercialAuditLog.create",
]) {
  assert.match(adminCommercial, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

for (const forbidden of [
  "treasuryAccount.update",
  "treasuryAccount.create",
  "treasuryMovement.create",
  "approveMovement(",
  "syncSystemWallet(",
]) {
  assert.ok(!adminCommercial.includes(forbidden), `Commercial layer must not touch treasury: ${forbidden}`);
}

const pricingLib = read("lib/pricing.ts");
for (const snippet of [
  "TRADE_BUY_BTC_FEE_PCT",
  "TRADE_SELL_BTC_FEE_PCT",
  "LOAN_APR_STANDARD",
  "LOAN_APR_SUBSCRIBER",
  "COMMERCIAL_PRICING_FIELD_DEFINITIONS",
  "getCommercialPricingFallbacks",
]) {
  assert.match(pricingLib, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

for (const relPath of [
  "app/api/admin/subscriptions/route.ts",
  "app/api/admin/subscriptions/[id]/route.ts",
  "app/api/admin/commercial/[id]/route.ts",
  "app/api/admin/pricing/route.ts",
  "app/api/admin/pricing/default/route.ts",
  "app/api/admin/pricing/companies/[id]/route.ts",
]) {
  const content = read(relPath);
  assert.match(content, /requireAdmin/);
}

const subscriptionsPage = read("app/admin/(protected)/subscriptions/page.tsx");
for (const snippet of [
  "CompanySubscription",
  "Configurar CompanySubscription",
  "Configurar CompanyCommercialProfile",
  "Audit log comercial",
  "legacy heredada desde",
]) {
  assert.match(subscriptionsPage, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const pricingPage = read("app/admin/(protected)/pricing/page.tsx");
for (const snippet of [
  "Precedencia oficial",
  "Guardar plan base",
  "Guardar pricing empresa",
  "User pricing heredado",
  "Override empresa",
]) {
  assert.match(pricingPage, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const customerDetailPage = read("app/admin/(protected)/customers/[companyId]/page.tsx");
for (const snippet of [
  "Suscripción y legacy",
  "Pricing efectivo visible",
  "Trazabilidad comercial",
  "/admin/subscriptions?companyId=",
  "/admin/pricing?companyId=",
]) {
  assert.match(customerDetailPage, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

console.log("validate_phase5_commercial: ok");
