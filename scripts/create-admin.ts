// scripts/create-admin.ts
// Usage:
//   ADMIN_EMAIL=admin@cava.cl ADMIN_PASSWORD=secret npx tsx -r dotenv/config scripts/create-admin.ts

import dotenv from "dotenv";
import path from "path";
import { hash } from "bcrypt";
import { getScriptPrisma } from "./_prisma";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const email = String(process.env.ADMIN_EMAIL ?? "").toLowerCase().trim();
const password = String(process.env.ADMIN_PASSWORD ?? "");

async function main() {
  if (!email || !password) {
    console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD.");
    process.exit(1);
  }

  const prisma = getScriptPrisma();
  try {
    const passwordHash = await hash(password, 12);

    const admin = await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash, role: "ADMIN" },
      select: { id: true, email: true, role: true },
    });

    console.log("admin:create", { id: admin.id, email: admin.email, role: admin.role });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
