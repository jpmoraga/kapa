import path from "path";
import { stdin as input, stdout as output } from "process";
import { createInterface } from "readline/promises";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { BackofficeRole, PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

function resolveDatasourceUrl() {
  const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!datasourceUrl) {
    throw new Error("Missing DIRECT_URL/DATABASE_URL for scripts");
  }
  return datasourceUrl;
}

async function readPassword() {
  const envPassword = String(process.env.BACKOFFICE_OWNER_PASSWORD ?? "");
  if (envPassword) return envPassword;

  const rl = createInterface({ input, output });
  try {
    const password = String(await rl.question("Backoffice owner password: "));
    const confirm = String(await rl.question("Confirm password: "));

    if (!password) {
      throw new Error("Missing password");
    }
    if (password !== confirm) {
      throw new Error("Password confirmation does not match");
    }

    return password;
  } finally {
    rl.close();
  }
}

async function main() {
  const email = String(process.env.BACKOFFICE_OWNER_EMAIL ?? "jp@lemonpot.com")
    .toLowerCase()
    .trim();
  const name = String(process.env.BACKOFFICE_OWNER_NAME ?? "").trim() || null;
  const password = await readPassword();

  if (!email) {
    throw new Error("Missing BACKOFFICE_OWNER_EMAIL");
  }
  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters");
  }

  const prisma = new PrismaClient({ datasourceUrl: resolveDatasourceUrl() });

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const owner = await prisma.backofficeUser.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        role: BackofficeRole.OWNER,
        isActive: true,
      },
      create: {
        email,
        name,
        passwordHash,
        role: BackofficeRole.OWNER,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    console.log("backoffice-owner:ready", owner);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
