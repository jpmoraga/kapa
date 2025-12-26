// web/scripts/dev-add-second-company.js

require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

function makePrisma() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está definido en web/.env");

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

const prisma = makePrisma();

async function main() {
  const email = "prueba8@empresa.cl";

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) throw new Error("Usuario no encontrado: " + email);

  await prisma.company.create({
    data: {
      name: "Empresa Prueba 8 (2) SpA",
      treasury: { create: { balance: 0 } },
      members: {
        create: { userId: user.id, role: "owner" },
      },
    },
  });

  // Fuerza selector en el próximo login
  await prisma.user.update({
    where: { id: user.id },
    data: { activeCompanyId: null },
  });

  console.log("✅ Segunda empresa creada y activeCompanyId reseteado");
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });