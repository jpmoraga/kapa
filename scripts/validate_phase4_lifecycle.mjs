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
  "app/auth/forgot-password/page.tsx",
  "app/auth/reset-password/page.tsx",
  "app/api/auth/forgot-password/route.ts",
  "app/api/auth/reset-password/route.ts",
  "app/companies/new/page.tsx",
  "app/api/companies/route.ts",
  "app/admin/(protected)/companies/page.tsx",
  "app/admin/(protected)/companies/[companyId]/page.tsx",
  "app/api/admin/companies/route.ts",
  "app/api/admin/companies/[id]/route.ts",
  "app/api/admin/companies/[id]/review/route.ts",
  "app/api/admin/companies/[id]/documents/[documentId]/download/route.ts",
  "lib/passwordReset.ts",
  "lib/sendPasswordResetEmail.ts",
  "lib/companyLifecycle.ts",
  "prisma/schema.prisma",
];

for (const relPath of requiredFiles) ensureFile(relPath);

const schema = read("prisma/schema.prisma");
for (const snippet of [
  "model PasswordResetToken",
  "model CompanyReview",
  "model CompanyDocument",
  "enum CompanyReviewStatus",
  "enum CompanyReviewSource",
]) {
  assert.match(schema, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

const passwordResetLib = read("lib/passwordReset.ts");
assert.match(passwordResetLib, /usedAt/);
assert.match(passwordResetLib, /expiresAt/);
assert.match(passwordResetLib, /passwordHash/);

const forgotRoute = read("app/api/auth/forgot-password/route.ts");
assert.match(forgotRoute, /issuePasswordResetForEmail/);

const resetRoute = read("app/api/auth/reset-password/route.ts");
assert.match(resetRoute, /resetPasswordWithToken/);

const companyLifecycle = read("lib/companyLifecycle.ts");
assert.match(companyLifecycle, /createClientBusinessCompany/);
assert.match(companyLifecycle, /createAdminBusinessCompany/);
assert.match(companyLifecycle, /reviewCompanyFromAdmin/);
assert.ok(!companyLifecycle.includes("treasuryAccount.update"), "Lifecycle must not mutate balances");
assert.ok(!companyLifecycle.includes("treasuryAccount.create"), "Lifecycle must not create treasury accounts");
assert.ok(!companyLifecycle.includes("treasuryMovement.create"), "Lifecycle must not create treasury movements");

const adminCompaniesRoute = read("app/api/admin/companies/route.ts");
assert.match(adminCompaniesRoute, /requireAdmin/);
assert.match(adminCompaniesRoute, /createAdminBusinessCompany/);

const adminCompanyReviewRoute = read("app/api/admin/companies/[id]/review/route.ts");
assert.match(adminCompanyReviewRoute, /requireAdmin/);
assert.match(adminCompanyReviewRoute, /reviewCompanyFromAdmin/);

const companyCreateRoute = read("app/api/companies/route.ts");
assert.match(companyCreateRoute, /createClientBusinessCompany/);

const selectCompanyPage = read("app/select-company/page.tsx");
assert.match(selectCompanyPage, /force/);

const activeCompanyRoute = read("app/api/auth/active-company/route.ts");
assert.ok(!activeCompanyRoute.includes("admin_override"), "active-company must not allow admin_override");
assert.match(activeCompanyRoute, /companyUser\.findUnique/);

const dashboardUi = read("app/components/DashboardBonito.tsx");
assert.match(dashboardUi, /\/companies\/new/);
assert.match(dashboardUi, /\/select-company\?force=1/);

const companiesPage = read("app/admin/(protected)/companies/page.tsx");
assert.match(companiesPage, /Alta manual/);
assert.match(companiesPage, /Revisar/);

const companyDetailPage = read("app/admin/(protected)/companies/[companyId]/page.tsx");
assert.match(companyDetailPage, /Aprobar empresa/);
assert.match(companyDetailPage, /Ver documento/);

console.log("validate_phase4_lifecycle: ok");
