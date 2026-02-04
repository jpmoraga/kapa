// scripts/test_manual_deposit.ts
// Dry run (default):
//   npx tsx -r dotenv/config scripts/test_manual_deposit.ts --companyId <id> --userId <id>
// Execute:
//   npx tsx -r dotenv/config scripts/test_manual_deposit.ts --execute --companyId <id> --userId <id>

import dotenv from "dotenv";
import path from "path";
import { Prisma, AssetCode, TreasuryMovementStatus } from "@prisma/client";
import { getScriptPrisma } from "./_prisma";
import { approveClpDepositByMovement, rejectClpDepositByMovement } from "../lib/treasury/manualClpDeposits";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const args = process.argv.slice(2);
const execute = args.includes("--execute");

function getArg(name: string) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const companyId = getArg("--companyId");
const userId = getArg("--userId");
const amountStr = getArg("--amount") ?? "2000";

if (!companyId || !userId) {
  console.error("Missing --companyId or --userId");
  process.exit(1);
}

async function main() {
  const prisma = getScriptPrisma();
  try {
    const amount = new Prisma.Decimal(amountStr);

    const before = await prisma.treasuryAccount.findUnique({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      select: { balance: true },
    });

    console.log("balance_before", before?.balance?.toString?.() ?? "0");

    if (!execute) {
      console.log("[DRY RUN] Would create PENDING CLP deposit + approve + reject.");
      return;
    }

    const movement = await prisma.treasuryMovement.create({
      data: {
        companyId,
        assetCode: AssetCode.CLP,
        type: "deposit",
        amount,
        status: TreasuryMovementStatus.PENDING,
        createdByUserId: userId,
        note: "manual test deposit",
        internalNote: "test_manual_deposit",
      },
      select: { id: true },
    });

    await prisma.depositSlip.create({
      data: {
        userId,
        filePath: "test/manual-slip",
        ocrStatus: "received",
        status: "received",
        notes: `movementId:${movement.id}`,
      },
    });

    const mid = movement.id;
    console.log("created_movement", mid);

    await approveClpDepositByMovement({
      movementId: mid,
      companyId,
      actorUserId: userId,
      amountClp: Number(amountStr),
      channel: "admin",
    });

    const afterApprove = await prisma.treasuryAccount.findUnique({
      where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
      select: { balance: true },
    });
    console.log("balance_after_approve", afterApprove?.balance?.toString?.() ?? "0");

    const rejectResult = await rejectClpDepositByMovement({
      movementId: mid,
      companyId,
      actorUserId: userId,
      channel: "admin",
    }).catch((e: any) => ({ error: e?.message ?? "reject_failed" }));
    console.log("reject_result", rejectResult);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
