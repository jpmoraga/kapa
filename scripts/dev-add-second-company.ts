import { prisma } from "../lib/prisma";

async function main() {
  const email = "prueba8@empresa.cl";

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, activeCompanyId: true },
  });

  if (!user) throw new Error("No existe el usuario " + email);

  // 1) Crear segunda empresa + treasury 1:1
  const company2 = await prisma.company.create({
    data: {
      name: "Empresa Prueba 8 (2) SpA",
      treasury: { create: { balance: 0 } },
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
    select: { id: true, name: true },
  });

  // 2) Forzar que NO haya empresa activa para probar selector
  await prisma.user.update({
    where: { id: user.id },
    data: { activeCompanyId: null },
  });

  console.log("OK. Creada:", company2);
  console.log("activeCompanyId seteado a null para forzar /select-company");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });