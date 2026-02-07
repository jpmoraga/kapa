import dotenv from "dotenv";
import path from "path";
import { PrismaClient, AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";
import { approveMovementAsSystem } from "../lib/treasury/approveMovement";
import { ensureSystemWallet } from "../lib/systemWallet";
import { computeTradeFee, getTradeFeePercent } from "../lib/fees";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

function assertTrue(label: string, ok: boolean, detail?: string) {
  if (!ok) {
    console.error(`FAIL ${label}${detail ? ` | ${detail}` : ""}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS ${label}${detail ? ` | ${detail}` : ""}`);
  }
}

async function getBestSnapshot(prisma: PrismaClient, assetCode: AssetCode) {
  const manual = await prisma.priceSnapshot.findFirst({
    where: {
      assetCode,
      quoteCode: AssetCode.CLP,
      source: { contains: "manual", mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, price: true, source: true, createdAt: true },
  });
  if (manual) return manual;

  return prisma.priceSnapshot.findFirst({
    where: { assetCode, quoteCode: AssetCode.CLP },
    orderBy: { createdAt: "desc" },
    select: { id: true, price: true, source: true, createdAt: true },
  });
}

function captureTradePriceSource<T>(fn: () => Promise<T>) {
  const logs: any[] = [];
  const original = console.log;
  console.log = (...args: any[]) => {
    logs.push(args);
    original(...args);
  };
  return fn()
    .then((out) => ({ out, logs }))
    .finally(() => {
      console.log = original;
    });
}

function findTradePriceSourceLog(logs: any[]) {
  for (const entry of logs) {
    if (entry?.[0] === "TRADE_PRICE_SOURCE" && entry[1]) return entry[1];
  }
  return null;
}

async function main() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  });

  const created: {
    userId?: string;
    companyId?: string;
    movementIds: string[];
    priceSnapshotIds: string[];
    systemBalances?: {
      clp?: Prisma.Decimal;
      btc?: Prisma.Decimal;
      usd?: Prisma.Decimal;
    };
  } = { movementIds: [], priceSnapshotIds: [] };

  try {
    const now = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `price-source-test-${now}@example.com`,
        passwordHash: "test",
      },
      select: { id: true },
    });
    created.userId = user.id;

    const company = await prisma.company.create({
      data: { name: `Price Source Test ${now}`, kind: "BUSINESS" },
      select: { id: true },
    });
    created.companyId = company.id;

    await prisma.companyUser.create({
      data: { userId: user.id, companyId: company.id, role: "admin" },
    });

    const { companyId: systemCompanyId } = await prisma.$transaction(async (tx) =>
      ensureSystemWallet(tx)
    );

    const [sysClp, sysBtc, sysUsd] = await Promise.all([
      prisma.treasuryAccount.findUnique({
        where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
        select: { balance: true },
      }),
      prisma.treasuryAccount.findUnique({
        where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.BTC } },
        select: { balance: true },
      }),
      prisma.treasuryAccount.findUnique({
        where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.USD } },
        select: { balance: true },
      }),
    ]);

    created.systemBalances = {
      clp: new Prisma.Decimal(sysClp?.balance ?? 0),
      btc: new Prisma.Decimal(sysBtc?.balance ?? 0),
      usd: new Prisma.Decimal(sysUsd?.balance ?? 0),
    };

    await prisma.treasuryAccount.update({
      where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
      data: { balance: new Prisma.Decimal("100000000") },
    });
    await prisma.treasuryAccount.update({
      where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.BTC } },
      data: { balance: new Prisma.Decimal("10") },
    });

    await prisma.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId: company.id, assetCode: AssetCode.CLP } },
      update: { balance: new Prisma.Decimal("1000000") },
      create: { companyId: company.id, assetCode: AssetCode.CLP, balance: new Prisma.Decimal("1000000") },
    });
    await prisma.treasuryAccount.upsert({
      where: { companyId_assetCode: { companyId: company.id, assetCode: AssetCode.BTC } },
      update: { balance: new Prisma.Decimal("5") },
      create: { companyId: company.id, assetCode: AssetCode.BTC, balance: new Prisma.Decimal("5") },
    });

    // Ensure snapshot exists
    let snapshot = await getBestSnapshot(prisma, AssetCode.BTC);
    if (!snapshot) {
      const createdSnapshot = await prisma.priceSnapshot.create({
        data: {
          assetCode: AssetCode.BTC,
          quoteCode: AssetCode.CLP,
          price: new Prisma.Decimal("60000000"),
          source: "buda:price_source_test",
        },
        select: { id: true, price: true, source: true, createdAt: true },
      });
      created.priceSnapshotIds.push(createdSnapshot.id);
      snapshot = createdSnapshot;
    }

    const snapshotPrice = new Prisma.Decimal(snapshot.price as any);

    // Case A: manual preset ignored -> snapshot
    {
      const movement = await prisma.treasuryMovement.create({
        data: {
          companyId: company.id,
          assetCode: AssetCode.BTC,
          type: "withdraw",
          amount: new Prisma.Decimal("0.01"),
          status: TreasuryMovementStatus.PENDING,
          createdByUserId: user.id,
          executedPrice: new Prisma.Decimal("50000000"),
          executedQuoteAmount: new Prisma.Decimal("500000"),
          executedSource: "manual:smoke_sell_btc",
          note: "price-source-test A",
        },
        select: { id: true },
      });
      created.movementIds.push(movement.id);

      const { logs } = await captureTradePriceSource(() =>
        approveMovementAsSystem({
          movementId: movement.id,
          companyId: company.id,
          actorUserId: user.id,
          skipSync: true,
        })
      );

      const log = findTradePriceSourceLog(logs);
      const updated = await prisma.treasuryMovement.findUnique({
        where: { id: movement.id },
        select: { executedPrice: true },
      });
      const used = log?.used ?? "unknown";
      const ignored = log?.ignoredPresetSource ?? null;
      const executedPrice = updated?.executedPrice
        ? new Prisma.Decimal(updated.executedPrice as any)
        : null;

      assertTrue(
        "CASE A used snapshot",
        used === "snapshot",
        `used=${used} ignored=${ignored ?? "null"}`
      );
      assertTrue(
        "CASE A ignored preset source",
        ignored === "manual:smoke_sell_btc",
        `ignored=${ignored ?? "null"}`
      );
      assertTrue(
        "CASE A executedPrice == snapshot",
        Boolean(executedPrice && executedPrice.eq(snapshotPrice)),
        `executed=${executedPrice?.toString() ?? "null"} snapshot=${snapshotPrice.toString()}`
      );
      console.log(
        `CASE A: ${used === "snapshot" ? "PASS" : "FAIL"} (used=${used}, ignoredPresetSource=${ignored}, snapshot=${snapshotPrice.toString()})`
      );
    }

    // Case B: preset_price allowed (non-manual)
    {
      const movement = await prisma.treasuryMovement.create({
        data: {
          companyId: company.id,
          assetCode: AssetCode.BTC,
          type: "withdraw",
          amount: new Prisma.Decimal("0.01"),
          status: TreasuryMovementStatus.PENDING,
          createdByUserId: user.id,
          executedPrice: new Prisma.Decimal("50000000"),
          executedSource: "admin:override",
          note: "price-source-test B",
        },
        select: { id: true },
      });
      created.movementIds.push(movement.id);

      const { logs } = await captureTradePriceSource(() =>
        approveMovementAsSystem({
          movementId: movement.id,
          companyId: company.id,
          actorUserId: user.id,
          skipSync: true,
        })
      );

      const log = findTradePriceSourceLog(logs);
      const updated = await prisma.treasuryMovement.findUnique({
        where: { id: movement.id },
        select: { executedPrice: true },
      });
      const used = log?.used ?? "unknown";
      const executedPrice = updated?.executedPrice
        ? new Prisma.Decimal(updated.executedPrice as any)
        : null;

      assertTrue(
        "CASE B used preset_price",
        used === "preset_price",
        `used=${used}`
      );
      assertTrue(
        "CASE B executedPrice == preset",
        Boolean(executedPrice && executedPrice.eq(new Prisma.Decimal("50000000"))),
        `executed=${executedPrice?.toString() ?? "null"}`
      );
      console.log(
        `CASE B: ${used === "preset_price" ? "PASS" : "FAIL"} (used=${used}, price=50000000)`
      );
    }

    // Case C: preset_quote allowed (non-manual)
    {
      const amount = new Prisma.Decimal("0.0001");
      const executedQuoteAmount = new Prisma.Decimal("12345");
      const feePct = getTradeFeePercent(AssetCode.BTC);
      const fee = computeTradeFee(executedQuoteAmount, feePct);
      const expectedGrossBuyClp = executedQuoteAmount.minus(fee);

      const movement = await prisma.treasuryMovement.create({
        data: {
          companyId: company.id,
          assetCode: AssetCode.BTC,
          type: "deposit",
          amount,
          status: TreasuryMovementStatus.PENDING,
          createdByUserId: user.id,
          executedQuoteAmount,
          executedSource: "admin:quote",
          note: "price-source-test C",
        },
        select: { id: true },
      });
      created.movementIds.push(movement.id);

      const { logs } = await captureTradePriceSource(() =>
        approveMovementAsSystem({
          movementId: movement.id,
          companyId: company.id,
          actorUserId: user.id,
          skipSync: true,
        })
      );

      const log = findTradePriceSourceLog(logs);
      const updated = await prisma.treasuryMovement.findUnique({
        where: { id: movement.id },
        select: { executedQuoteAmount: true, executedFeeAmount: true },
      });
      const used = log?.used ?? "unknown";
      const storedQuote = updated?.executedQuoteAmount
        ? new Prisma.Decimal(updated.executedQuoteAmount as any)
        : null;

      assertTrue(
        "CASE C used preset_quote",
        used === "preset_quote",
        `used=${used}`
      );
      assertTrue(
        "CASE C executedQuoteAmount == grossBuyClp",
        Boolean(storedQuote && storedQuote.eq(expectedGrossBuyClp)),
        `stored=${storedQuote?.toString() ?? "null"} expected=${expectedGrossBuyClp.toString()}`
      );
      console.log(
        `CASE C: ${used === "preset_quote" ? "PASS" : "FAIL"} (used=${used}, quote=${executedQuoteAmount.toString()})`
      );
    }
  } finally {
    try {
      if (created.movementIds.length) {
        await prisma.treasuryMovement.deleteMany({ where: { id: { in: created.movementIds } } });
      }
      if (created.companyId) {
        await prisma.treasuryAccount.deleteMany({ where: { companyId: created.companyId } });
        await prisma.companyUser.deleteMany({ where: { companyId: created.companyId } });
        await prisma.company.deleteMany({ where: { id: created.companyId } });
      }
      if (created.userId) {
        await prisma.user.deleteMany({ where: { id: created.userId } });
      }
      if (created.priceSnapshotIds.length) {
        await prisma.priceSnapshot.deleteMany({ where: { id: { in: created.priceSnapshotIds } } });
      }
      if (created.systemBalances) {
        const { companyId: systemCompanyId } = await prisma.$transaction(async (tx) =>
          ensureSystemWallet(tx)
        );
        await prisma.treasuryAccount.update({
          where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
          data: { balance: created.systemBalances.clp ?? new Prisma.Decimal(0) },
        });
        await prisma.treasuryAccount.update({
          where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.BTC } },
          data: { balance: created.systemBalances.btc ?? new Prisma.Decimal(0) },
        });
        await prisma.treasuryAccount.update({
          where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.USD } },
          data: { balance: created.systemBalances.usd ?? new Prisma.Decimal(0) },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
