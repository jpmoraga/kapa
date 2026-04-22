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
  "lib/adminCustomers.ts",
  "app/api/admin/customers/route.ts",
  "app/api/admin/customers/[id]/route.ts",
  "app/admin/(protected)/customers/page.tsx",
  "app/admin/(protected)/customers/[companyId]/page.tsx",
];

for (const relPath of requiredFiles) ensureFile(relPath);

const service = read("lib/adminCustomers.ts");
assert.match(service, /prisma\.company\.findMany/);
assert.match(service, /prisma\.company\.findFirst/);
assert.match(service, /treasury:/);
assert.ok(!service.includes("recomputeBalances"), "Customer service must not recompute balances");
assert.ok(!service.includes("treasuryAccount.update"), "Customer service must not mutate balances");
assert.ok(!service.includes("treasuryAccount.create"), "Customer service must not create balances");
assert.ok(!service.includes("treasuryMovement.create"), "Customer service must not create movements");
for (const text of ["Todos", "Con saldo", "Suscritos", "No suscritos", "Activos"]) {
  assert.ok(service.includes(text), `Missing filter label: ${text}`);
}

const listRoute = read("app/api/admin/customers/route.ts");
assert.match(listRoute, /requireAdmin/);
assert.match(listRoute, /listAdminCustomers/);

const detailRoute = read("app/api/admin/customers/[id]/route.ts");
assert.match(detailRoute, /requireAdmin/);
assert.match(detailRoute, /getAdminCustomerDetail/);

const listPage = read("app/admin/(protected)/customers/page.tsx");
assert.match(listPage, /Ver detalle/);

const detailPage = read("app/admin/(protected)/customers/[companyId]/page.tsx");
assert.match(detailPage, /TreasuryAccount vigente/);
assert.match(detailPage, /Acciones admin|Operación auditada e idempotente/);
assert.match(detailPage, /Volver a Clientes/);

console.log("validate_admin_customers: ok");
