import { PrismaClient } from "@prisma/client";

// Scripts must use DIRECT_URL to avoid PgBouncer session pool exhaustion.
export function getScriptPrisma() {
  const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!datasourceUrl) {
    throw new Error("Missing DIRECT_URL/DATABASE_URL for scripts");
  }
  return new PrismaClient({ datasourceUrl });
}
