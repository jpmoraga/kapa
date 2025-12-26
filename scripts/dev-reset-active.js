require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

async function main() {
  await prisma.user.update({
    where: { email: "prueba8@empresa.cl" },
    data: { activeCompanyId: null },
  });
  console.log("✅ activeCompanyId = null");
}

main().finally(() => prisma.$disconnect());