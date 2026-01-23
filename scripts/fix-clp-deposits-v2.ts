import { prisma } from "../lib/prisma";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";

function extractMovementId(notes: string | null | undefined) {
  if (!notes) return null;
  const m = notes.match(/movementId:([a-zA-Z0-9_-]+)/);
  return m?.[1] ?? null;
}

async function main() {
  // 1) Trae slips aprobados con monto manual (parsedAmountClp)
  const slips = await prisma.depositSlip.findMany({
    where: {
      status: "approved",
      parsedAmountClp: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      notes: true,
      parsedAmountClp: true,
      createdAt: true,
    },
  });

  console.log("Approved slips:", slips.length);

  let fixed = 0;
  let skippedNoMovementId = 0;
  let skippedNoMovement = 0;

  for (const s of slips) {
    const movementId = extractMovementId(s.notes);
    if (!movementId) {
      skippedNoMovementId++;
      continue;
    }

    const m = await prisma.treasuryMovement.findUnique({
      where: { id: movementId },
      select: {
        id: true,
        assetCode: true,
        type: true,
        status: true,
        amount: true,
        executedQuoteAmount: true,
      },
    });

    if (!m) {
      skippedNoMovement++;
      continue;
    }

    // Solo CLP deposit
    if (m.assetCode !== AssetCode.CLP || m.type !== "deposit") continue;

    const real = s.parsedAmountClp!.toString();

    // Si ya está seteado, no tocar
    const alreadyOk =
      m.executedQuoteAmount?.toString?.() === real &&
      m.amount?.toString?.() === real;

    if (alreadyOk) continue;

    await prisma.treasuryMovement.update({
      where: { id: m.id },
      data: {
        status: TreasuryMovementStatus.APPROVED,
        amount: new Prisma.Decimal(real),
        executedQuoteAmount: new Prisma.Decimal(real),
        executedQuoteCode: AssetCode.CLP,
        executedSource: "whatsapp",
      },
    });

    fixed++;
    console.log("Fixed movement", m.id, "=>", real);
  }

  console.log("DONE", { fixed, skippedNoMovementId, skippedNoMovement });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });