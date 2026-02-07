import dotenv from "dotenv";
import path from "path";
import { PrismaClient, AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";
import { approveMovementAsSystem } from "../lib/treasury/approveMovement";
import { ensureSystemWallet } from "../lib/systemWallet";
import { computeTradeFee, getTradeFeePercent } from "../lib/fees";
import { GET as getCurrentPrice } from "../app/api/prices/current/route";

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

    const marketSnapshot = await prisma.priceSnapshot.create({
      data: {
        assetCode: AssetCode.BTC,
        quoteCode: AssetCode.CLP,
        price: new Prisma.Decimal("60000000"),
        source: "buda:price_source_test",
      },
      select: { id: true, price: true },
    });
    created.priceSnapshotIds.push(marketSnapshot.id);
    const manualSnapshot = await prisma.priceSnapshot.create({
      data: {
        assetCode: AssetCode.BTC,
        quoteCode: AssetCode.CLP,
        price: new Prisma.Decimal("50000000"),
        source: "manual:smoke_sell_btc",
      },
      select: { id: true, price: true },
    });
    created.priceSnapshotIds.push(manualSnapshot.id);

    const snapshotPrice = new Prisma.Decimal(marketSnapshot.price as any);

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
      const amount = new Prisma.Decimal("0.01");
      const executedQuoteAmount = new Prisma.Decimal("600000");
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

    // Case D: prices/current ignores manual by default, allows manual when mode=manual
    {
      const reqDefault = new Request("http://localhost/api/prices/current?pair=BTC_CLP");
      const resDefault = await getCurrentPrice(reqDefault);
      const dataDefault = await resDefault.json().catch(() => ({}));
      const priceDefault = dataDefault?.price ? new Prisma.Decimal(dataDefault.price) : null;
      assertTrue(
        "CASE D default uses market snapshot",
        Boolean(priceDefault && priceDefault.eq(snapshotPrice)),
        `price=${priceDefault?.toString() ?? "null"}`
      );
      console.log(
        `CASE D: ${priceDefault && priceDefault.eq(snapshotPrice) ? "PASS" : "FAIL"} (used=market, price=${priceDefault?.toString() ?? "null"})`
      );

      const reqManual = new Request("http://localhost/api/prices/current?pair=BTC_CLP&mode=manual");
      const resManual = await getCurrentPrice(reqManual);
      const dataManual = await resManual.json().catch(() => ({}));
      const manualPrice = dataManual?.price ? new Prisma.Decimal(dataManual.price) : null;
      assertTrue(
        "CASE D manual mode uses manual snapshot",
        Boolean(manualPrice && manualPrice.eq(new Prisma.Decimal("50000000"))),
        `price=${manualPrice?.toString() ?? "null"}`
      );
      console.log(
        `CASE D: ${manualPrice && manualPrice.eq(new Prisma.Decimal("50000000")) ? "PASS" : "FAIL"} (used=manual, price=${manualPrice?.toString() ?? "null"})`
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
