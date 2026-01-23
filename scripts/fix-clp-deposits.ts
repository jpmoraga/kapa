import { prisma } from "../lib/prisma";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";

async function main() {
  // Busca movimientos CLP deposit que están APPROVED pero sin executedQuoteAmount
  const movements = await prisma.treasuryMovement.findMany({
    where: {
      assetCode: AssetCode.CLP,
      type: "deposit",
      status: TreasuryMovementStatus.APPROVED,
      executedQuoteAmount: null,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      amount: true,
      depositSlipId: true, // <- asumo que existe (porque lo usas en create)
      createdAt: true,
    } as any,
  });

  console.log("Movements candidate:", movements.length);

  let fixed = 0;
  for (const m of movements as any[]) {
    if (!m.depositSlipId) continue;

    const slip = await prisma.depositSlip.findUnique({
      where: { id: m.depositSlipId },
      select: { id: true, parsedAmountClp: true, status: true },
    });

    const parsed = slip?.parsedAmountClp;
    if (!parsed) continue;

    await prisma.treasuryMovement.update({
      where: { id: m.id },
      data: {
        amount: new Prisma.Decimal(parsed.toString()),
        executedQuoteAmount: new Prisma.Decimal(parsed.toString()),
        executedQuoteCode: AssetCode.CLP,
        executedSource: "whatsapp",
      },
    });

    fixed++;
    console.log("Fixed", m.id, "=>", parsed.toString());
  }

  console.log("DONE. fixed:", fixed);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });