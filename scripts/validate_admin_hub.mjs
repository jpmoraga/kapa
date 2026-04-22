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
  "app/admin/(protected)/page.tsx",
  "app/admin/(protected)/layout.tsx",
  "app/admin/(protected)/treasury/page.tsx",
  "app/admin/(protected)/customers/page.tsx",
  "app/admin/(protected)/companies/page.tsx",
  "app/admin/(protected)/subscriptions/page.tsx",
  "app/admin/(protected)/pricing/page.tsx",
  "app/admin/(protected)/loans/page.tsx",
  "app/admin/(protected)/audit/page.tsx",
  "app/admin/(protected)/overview/page.tsx",
  "app/admin/(protected)/ops/page.tsx",
  "app/api/admin/login/route.ts",
  "app/api/admin/logout/route.ts",
  "app/admin/login/page.tsx",
  "app/admin/login/AdminLoginClient.tsx",
  "lib/adminNavigation.ts",
];

for (const relPath of requiredFiles) ensureFile(relPath);

const layout = read("app/admin/(protected)/layout.tsx");
assert.match(layout, /getAdminSession/);
assert.match(layout, /redirect\(["']\/admin\/login["']\)/);

const loginPage = read("app/admin/login/page.tsx");
assert.match(loginPage, /redirect\(["']\/admin["']\)/);

const loginClient = read("app/admin/login/AdminLoginClient.tsx");
assert.match(loginClient, /router\.(push|replace)\(["']\/admin["']\)/);

const navFile = read("lib/adminNavigation.ts");
for (const href of [
  "/admin",
  "/admin/customers",
  "/admin/companies",
  "/admin/treasury",
  "/admin/subscriptions",
  "/admin/pricing",
  "/admin/loans",
  "/admin/audit",
]) {
  assert.ok(navFile.includes(href), `Missing nav href: ${href}`);
}

const previewPage = read("app/admin/ops-preview/page.tsx");
assert.match(previewPage, /getAdminSession/);
assert.match(previewPage, /redirect\(["']\/admin\/login["']\)/);

const logoutRoute = read("app/api/admin/logout/route.ts");
assert.match(logoutRoute, /ADMIN_SESSION_COOKIE/);
assert.match(logoutRoute, /\/admin\/login/);

console.log("validate_admin_hub: ok");
