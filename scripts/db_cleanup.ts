// scripts/db_cleanup.ts
// Run:
//   npx tsx -r dotenv/config scripts/db_cleanup.ts

import dotenv from "dotenv";
import path from "path";
import { getScriptPrisma } from "./_prisma";
import { runDbCleanup } from "../lib/dbCleanup";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

async function main() {
  const prisma = getScriptPrisma();
  try {
    const qaEmailDomain = process.env.QA_EMAIL_DOMAIN ?? null;
    const result = await runDbCleanup(prisma, { qaEmailDomain });
    console.log("DB_CLEANUP_RESULT", result);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
