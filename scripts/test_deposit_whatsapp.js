require("dotenv").config({ path: process.env.DOTENV_CONFIG_PATH || ".env.local" });

const { PrismaClient } = require("@prisma/client");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SESSION_COOKIE = process.env.SESSION_COOKIE;
const AMOUNT = process.env.AMOUNT || "1000";

if (!SESSION_COOKIE) {
  console.error("Missing SESSION_COOKIE (use your next-auth session cookie).");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  if (!globalThis.FormData || !globalThis.Blob) {
    throw new Error("This script requires Node 18+ (FormData/Blob globals).");
  }

  const form = new FormData();
  form.append("type", "deposit");
  form.append("assetCode", "CLP");
  form.append("amount", AMOUNT);
  form.append("note", "whatsapp-failure-smoke");
  form.append("receipt", new Blob([Buffer.from("test receipt")], { type: "application/pdf" }), "receipt.pdf");

  const res = await fetch(`${BASE_URL}/api/treasury/movements`, {
    method: "POST",
    headers: { cookie: SESSION_COOKIE },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  console.log("API response:", res.status, data);

  if (!res.ok || !data?.movementId) {
    throw new Error("Movement create failed");
  }

  const movement = await prisma.treasuryMovement.findUnique({
    where: { id: String(data.movementId) },
    select: { status: true, lastError: true, retryCount: true, nextRetryAt: true },
  });

  console.log("Movement status:", movement);
}

main()
  .catch((err) => {
    console.error(err?.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
