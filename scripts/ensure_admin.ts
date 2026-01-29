// scripts/ensure_admin.ts
// Usage:
//   npx tsx -r dotenv/config scripts/ensure_admin.ts
//   npx tsx -r dotenv/config scripts/ensure_admin.ts jp@lemonpot.com

import dotenv from "dotenv";
import path from "path";
import { getScriptPrisma } from "./_prisma";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const emailArg = process.argv[2];
const email = (emailArg ?? "jp@lemonpot.com").toLowerCase().trim();

async function main() {
  const prisma = getScriptPrisma();
  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, activeCompanyId: true },
    });

    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    const companyIds = new Set<string>();
    if (user.activeCompanyId) companyIds.add(user.activeCompanyId);

    const memberships = await prisma.companyUser.findMany({
      where: { userId: user.id },
      select: { companyId: true, role: true },
    });

    for (const m of memberships) companyIds.add(m.companyId);

    const systemCompany = await prisma.company.findFirst({
      where: { name: "__SYSTEM_WALLET__" },
      select: { id: true },
    });
    if (systemCompany?.id) companyIds.add(systemCompany.id);

    if (!companyIds.size) {
      console.error("No company memberships found for user.");
      process.exit(1);
    }

    const updates: Array<{ companyId: string; action: string; role: string }> = [];

    for (const companyId of companyIds) {
      const existing = await prisma.companyUser.findUnique({
        where: { userId_companyId: { userId: user.id, companyId } },
        select: { role: true },
      });

      if (!existing) {
        await prisma.companyUser.create({
          data: { userId: user.id, companyId, role: "admin" },
        });
        updates.push({ companyId, action: "created", role: "admin" });
        continue;
      }

      const role = String(existing.role ?? "").toLowerCase();
      if (role === "admin" || role === "owner") {
        updates.push({ companyId, action: "kept", role });
        continue;
      }

      await prisma.companyUser.update({
        where: { userId_companyId: { userId: user.id, companyId } },
        data: { role: "admin" },
      });
      updates.push({ companyId, action: "updated", role: "admin" });
    }

    console.log("ensure_admin:done", {
      email: user.email,
      userId: user.id,
      updates,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
