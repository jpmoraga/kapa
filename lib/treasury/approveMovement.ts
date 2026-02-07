// web/lib/treasury/approveMovement.ts
import { prisma } from "@/lib/prisma";
import {
  AssetCode,
  InternalMovementReason,
  InternalMovementState,
  Prisma,
  PrismaClient,
  TreasuryMovementStatus,
} from "@prisma/client";
import { budaCreateMarketOrder, budaGetBalances } from "@/lib/buda";
import { ensureSystemWallet } from "@/lib/systemWallet";
import { computeTradeFee, getTradeFeePercent } from "@/lib/fees";

type TimedFn = <T>(step: string, fn: () => Promise<T>) => Promise<T>;

function isManualSource(source: string | null | undefined) {
  return String(source ?? "").toLowerCase().startsWith("manual:");
}

async function getBestPriceSnapshot(
  client: Prisma.TransactionClient | PrismaClient,
  assetCode: AssetCode,
  quoteCode: AssetCode,
  timed?: TimedFn,
  opts?: { allowManual?: boolean }
) {
  const run = timed ?? (async <T,>(_step: string, fn: () => Promise<T>) => fn());

  if (opts?.allowManual) {
    const manual = await run("db.priceSnapshot.findManual", () =>
      client.priceSnapshot.findFirst({
        where: {
          assetCode,
          quoteCode,
          source: { startsWith: "manual:", mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" },
        select: { price: true, source: true },
      })
    );
    if (manual) return manual;
  }

  return (
    (await run("db.priceSnapshot.findLatest", () =>
      client.priceSnapshot.findFirst({
        where: {
          assetCode,
          quoteCode,
          NOT: { source: { startsWith: "manual:", mode: "insensitive" } },
        },
        orderBy: { createdAt: "desc" },
        select: { price: true, source: true },
      })
    )) ?? null
  );
}

function isTradeAsset(a: AssetCode) {
  return a === AssetCode.BTC || a === AssetCode.USD; // USD == USDT (MVP)
}

function marketForAsset(a: AssetCode) {
  if (a === AssetCode.BTC) return "btc-clp";
  if (a === AssetCode.USD) return "usdt-clp";
  throw new Error("BAD_MARKET");
}

function logEvent(event: string, payload: Record<string, unknown>) {
  console.info(JSON.stringify({ event, ...payload }));
}

function makeTimed(baseLog: Record<string, unknown>): TimedFn {
  return async <T,>(step: string, fn: () => Promise<T>) => {
    const started = Date.now();
    try {
      return await fn();
    } finally {
      logEvent("trade:timing", { ...baseLog, step, ms: Date.now() - started });
    }
  };
}

export async function approveMovementAsSystem(opts: {
  movementId: string;
  companyId: string;
  actorUserId?: string | null; // el user que queda como approvedBy
  skipSync?: boolean;
  correlationId?: string;
}) {
  const { movementId, companyId, actorUserId, skipSync, correlationId } = opts;
  const baseLog = { correlationId, movementId, companyId };
  logEvent("trade:approve_start", baseLog);
  const strictSystemWallet = process.env.STRICT_SYSTEM_WALLET !== "false";
  const hasBudaKeys = Boolean(process.env.BUDA_API_KEY && process.env.BUDA_API_SECRET);
  const timed = makeTimed(baseLog);

  type ApprovalResult = {
    updated: {
      id: string;
      status: TreasuryMovementStatus;
      internalReason?: InternalMovementReason | null;
      internalState?: InternalMovementState | null;
    };
    venue: string;
    budaOrderId?: string | null;
  };

  const logResult = (out: ApprovalResult) => {
    logEvent("trade:approve_result", {
      ...baseLog,
      venue: out?.venue ?? null,
      status: out?.updated?.status ?? null,
      internalReason: out?.updated?.internalReason ?? null,
      internalState: out?.updated?.internalState ?? null,
      externalOrderId: out?.budaOrderId ?? null,
    });
  };

  try {
    const movement = await timed("db.movement.find", () =>
      prisma.treasuryMovement.findFirst({
        where: { id: movementId, companyId },
        select: {
          id: true,
          status: true,
          type: true,
          assetCode: true,
          amount: true,
          note: true,
          externalOrderId: true,
          executedPrice: true,
          executedQuoteAmount: true,
          executedQuoteCode: true,
          executedSource: true,
        },
      })
    );

    if (!movement) throw new Error("NOT_FOUND");
    if (movement.status === TreasuryMovementStatus.APPROVED) {
      const out = {
        updated: { id: movement.id, status: movement.status },
        venue: "already-approved",
      };
      logResult(out);
      return out;
    }
    if (movement.status === TreasuryMovementStatus.REJECTED) {
      throw new Error("REJECTED");
    }

    await timed("db.movement.mark_processing", () =>
      prisma.treasuryMovement.updateMany({
        where: {
          id: movement.id,
          companyId,
          status: { in: [TreasuryMovementStatus.PENDING, TreasuryMovementStatus.PROCESSING] },
        },
        data: {
          status: TreasuryMovementStatus.PROCESSING,
          internalState: InternalMovementState.RETRYING_BUDA,
        },
      })
    );

    const amount = new Prisma.Decimal(movement.amount);

    // A) CLP simple (sin lógica externa)
    if (movement.assetCode === AssetCode.CLP) {
      const out = await timed("tx.approve_clp", () =>
        prisma.$transaction(async (tx) => {
          const current = await tx.treasuryMovement.findUnique({
            where: { id: movement.id },
            select: { status: true, type: true },
          });
          if (!current) throw new Error("NOT_FOUND");
          if (current.status === TreasuryMovementStatus.APPROVED) {
            return {
              updated: { id: movement.id, status: TreasuryMovementStatus.APPROVED },
              venue: "already-approved",
            } as ApprovalResult;
          }

          const acc = await tx.treasuryAccount.upsert({
            where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
            update: {},
            create: { companyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
            select: { balance: true },
          });

          const cur = new Prisma.Decimal(acc.balance);
          let next = cur;
          if (current.type === "withdraw") {
            if (cur.lt(amount)) throw new Error("INSUFFICIENT_FUNDS");
            next = cur.minus(amount);
          } else if (current.type === "deposit") {
            next = cur.plus(amount);
          } else if (current.type === "adjust") {
            next = cur.plus(amount);
            if (next.lt(0)) throw new Error("NEGATIVE_BALANCE");
          } else {
            throw new Error("BAD_TYPE");
          }

          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
            data: { balance: next },
          });

          const updated = await tx.treasuryMovement.update({
            where: { id: movement.id },
            data: {
              status: TreasuryMovementStatus.APPROVED,
              approvedByUserId: actorUserId ?? undefined,
              approvedAt: new Date(),
              executedPrice: new Prisma.Decimal(1),
              executedQuoteCode: AssetCode.CLP,
              executedSource: "internal",
              executedAt: new Date(),
              executedBaseAmount: amount,
              executedQuoteAmount: amount,
              executedFeeAmount: new Prisma.Decimal(0),
              executedFeeCode: AssetCode.CLP,
              internalReason: InternalMovementReason.NONE,
              internalState: InternalMovementState.NONE,
            },
            select: { id: true, status: true, internalReason: true, internalState: true },
          });

          return { updated, venue: "internal-clp" } as ApprovalResult;
        })
      );

      logResult(out);
      return out;
    }

    if (!isTradeAsset(movement.assetCode)) throw new Error("UNSUPPORTED_ASSET");

    if (!skipSync) {
      if (!hasBudaKeys && strictSystemWallet) {
        const updated = await timed("db.movement.missing_buda_keys", () =>
          prisma.treasuryMovement.update({
            where: { id: movement.id },
            data: {
              status: TreasuryMovementStatus.PENDING,
              internalReason: InternalMovementReason.BUDA_API_ERROR,
              internalState: InternalMovementState.FAILED_TEMPORARY,
              lastError: "MISSING_BUDA_KEYS",
            },
            select: { id: true, status: true, internalReason: true, internalState: true },
          })
        );
        const out = { updated, venue: "missing-buda-keys" };
        logResult(out);
        return out;
      }

      if (hasBudaKeys) {
        const balances = await timed("ext.buda.balances", () => budaGetBalances());
        await timed("tx.sync_system_wallet", () =>
          prisma.$transaction(async (tx) => {
            const { companyId: systemCompanyId } = await ensureSystemWallet(tx);
            const budaClp = new Prisma.Decimal(balances.byCurrency?.CLP ?? "0");
            const budaBtc = new Prisma.Decimal(balances.byCurrency?.BTC ?? "0");
            const budaUsdt = new Prisma.Decimal(
              balances.byCurrency?.USDT ?? balances.byCurrency?.USD ?? "0"
            );

            const sums = await tx.treasuryAccount.groupBy({
              by: ["assetCode"],
              where: {
                companyId: { not: systemCompanyId },
                assetCode: { in: [AssetCode.CLP, AssetCode.BTC, AssetCode.USD] },
              },
              _sum: { balance: true },
            });

            const sumClient = (a: AssetCode) => {
              const row = sums.find((x) => x.assetCode === a);
              return new Prisma.Decimal((row?._sum?.balance as any) ?? 0);
            };

            const clientsClp = sumClient(AssetCode.CLP);
            const clientsBtc = sumClient(AssetCode.BTC);
            const clientsUsd = sumClient(AssetCode.USD);

            const sysClp = Prisma.Decimal.max(
              budaClp.minus(clientsClp),
              new Prisma.Decimal(0)
            );
            const sysBtc = Prisma.Decimal.max(
              budaBtc.minus(clientsBtc),
              new Prisma.Decimal(0)
            );
            const sysUsd = Prisma.Decimal.max(
              budaUsdt.minus(clientsUsd),
              new Prisma.Decimal(0)
            );

            await tx.treasuryAccount.update({
              where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
              data: { balance: sysClp },
            });
            await tx.treasuryAccount.update({
              where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.BTC } },
              data: { balance: sysBtc },
            });
            await tx.treasuryAccount.update({
              where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.USD } },
              data: { balance: sysUsd },
            });
          })
        );
      }
    }

    const presetQuote =
      movement.executedQuoteAmount != null
        ? new Prisma.Decimal(movement.executedQuoteAmount as any)
        : null;
    const presetPrice =
      movement.executedPrice != null
        ? new Prisma.Decimal(movement.executedPrice as any)
        : null;
    const presetSource = movement.executedSource ?? null;
    const isManualPresetSource = isManualSource(presetSource);
    const presetQuoteCode = movement.executedQuoteCode ?? AssetCode.CLP;

    let executedPrice: Prisma.Decimal | null = null;
    let executedSource: string | null = null;
    let estClp: Prisma.Decimal | null = null;
    const executedQuoteCode = presetQuoteCode ?? AssetCode.CLP;
    const executedAt = new Date();

    let priceSourceUsed: "preset_quote" | "preset_price" | "snapshot" = "snapshot";
    if (!isManualPresetSource && presetQuote && presetQuote.gt(0)) {
      estClp = presetQuote;
      executedPrice = presetPrice && presetPrice.gt(0) ? presetPrice : presetQuote.div(amount);
      executedSource = presetSource ?? "requested-quote";
      priceSourceUsed = "preset_quote";
    } else if (!isManualPresetSource && presetPrice && presetPrice.gt(0)) {
      executedPrice = presetPrice;
      estClp = amount.mul(executedPrice);
      executedSource = presetSource ?? "requested-price";
      priceSourceUsed = "preset_price";
    } else {
      const snap = await getBestPriceSnapshot(prisma, movement.assetCode, AssetCode.CLP, timed, {
        allowManual: false,
      });
      if (!snap?.price) {
        const updated = await timed("db.movement.update.price_missing", () =>
          prisma.treasuryMovement.update({
            where: { id: movement.id },
            data: {
              status: TreasuryMovementStatus.PENDING,
              internalReason: InternalMovementReason.PRICE_MISSING,
              internalState: InternalMovementState.FAILED_TEMPORARY,
              lastError: "PRICE_MISSING",
            },
            select: { id: true, status: true, internalReason: true, internalState: true },
          })
        );
        const out = { updated, venue: "missing-price" };
        logResult(out);
        return out;
      }

      executedPrice = new Prisma.Decimal(snap.price);
      estClp = amount.mul(executedPrice);
      executedSource = snap.source ?? null;
      priceSourceUsed = "snapshot";
    }

    console.log("TRADE_PRICE_SOURCE", {
      movementId: movement.id,
      used: priceSourceUsed,
      ignoredPresetSource: isManualPresetSource ? presetSource : null,
      executedPrice: executedPrice?.toString(),
      estClp: estClp?.toString(),
      source: executedSource,
    });

    const typeValue = String(movement.type ?? "").toLowerCase();
    const isBuy = typeValue === "deposit" || typeValue === "buy";
    const isSell = typeValue === "withdraw" || typeValue === "sell";
    if (!isBuy && !isSell) throw new Error("BAD_TYPE");

    const feePct = getTradeFeePercent(movement.assetCode);
    let feeOnQuote = computeTradeFee(estClp, feePct);
    const feeOnBase = computeTradeFee(amount, feePct);
    let totalBuyClp = estClp.plus(feeOnQuote);
    let grossBuyClp = estClp;
    let buyBaseAmount = amount;
    let inputSpendClp = estClp;

    const useInclusiveFee = isBuy;
    if (useInclusiveFee) {
      inputSpendClp = estClp;
      feeOnQuote = computeTradeFee(inputSpendClp, feePct);
      grossBuyClp = inputSpendClp.minus(feeOnQuote);
      totalBuyClp = inputSpendClp;
      if (executedPrice && executedPrice.gt(0)) {
        buyBaseAmount = grossBuyClp.div(executedPrice);
      }
      logEvent("trade:buy_fee_model", {
        ...baseLog,
        inputSpendClp: inputSpendClp.toString(),
        feeClp: feeOnQuote.toString(),
        grossBuyClp: grossBuyClp.toString(),
        executedPrice: executedPrice?.toString() ?? null,
        baseQtyCredited: buyBaseAmount.toString(),
        totalDebitClp: totalBuyClp.toString(),
      });
    }

    const totalSellBase = amount.plus(feeOnBase);
    const baseAmountForExecution = isBuy ? buyBaseAmount : amount;

    const { companyId: systemCompanyId } = await timed("db.system_wallet.ensure", () =>
      prisma.$transaction(async (tx) => ensureSystemWallet(tx))
    );

    const [accAsset, accClp, sysAssetAcc, sysClpAcc] = await Promise.all([
      prisma.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId, assetCode: movement.assetCode } },
        update: {},
        create: { companyId, assetCode: movement.assetCode, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      }),
      prisma.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
        update: {},
        create: { companyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      }),
      prisma.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: movement.assetCode } },
        update: {},
        create: {
          companyId: systemCompanyId,
          assetCode: movement.assetCode,
          balance: new Prisma.Decimal(0),
        },
        select: { balance: true },
      }),
      prisma.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
        update: {},
        create: { companyId: systemCompanyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      }),
    ]);

    const curAsset = new Prisma.Decimal(accAsset.balance);
    const curClp = new Prisma.Decimal(accClp.balance);
    const sysAsset = new Prisma.Decimal(sysAssetAcc.balance);
    const sysClp = new Prisma.Decimal(sysClpAcc.balance);

    logEvent("trade:wallet_snapshot", {
      ...baseLog,
      assetCode: movement.assetCode,
      side: movement.type,
      clientAsset: curAsset.toString(),
      clientClp: curClp.toString(),
      systemAsset: sysAsset.toString(),
      systemClp: sysClp.toString(),
      estClp: estClp.toString(),
      totalBuyClp: totalBuyClp.toString(),
      totalSellBase: totalSellBase.toString(),
      baseAmountForExecution: baseAmountForExecution.toString(),
    });

    if (isBuy && curClp.lt(totalBuyClp)) {
      const updated = await prisma.treasuryMovement.update({
        where: { id: movement.id },
        data: {
          status: TreasuryMovementStatus.PENDING,
          internalReason: InternalMovementReason.UNKNOWN,
          internalState: InternalMovementState.FAILED_TEMPORARY,
          lastError: "INSUFFICIENT_CLP",
        },
        select: { id: true, status: true, internalReason: true, internalState: true },
      });
      const out = { updated, venue: "insufficient-clp" };
      logResult(out);
      return out;
    }
    if (isSell && curAsset.lt(totalSellBase)) {
      const updated = await prisma.treasuryMovement.update({
        where: { id: movement.id },
        data: {
          status: TreasuryMovementStatus.PENDING,
          internalReason: InternalMovementReason.UNKNOWN,
          internalState: InternalMovementState.FAILED_TEMPORARY,
          lastError: "INSUFFICIENT_FUNDS",
        },
        select: { id: true, status: true, internalReason: true, internalState: true },
      });
      const out = { updated, venue: "insufficient-funds" };
      logResult(out);
      return out;
    }

    const canFillFromWallet =
      (isBuy && sysAsset.gte(baseAmountForExecution)) || (isSell && sysClp.gte(estClp));

    logEvent("trade:execution_decision", {
      ...baseLog,
      canFillFromWallet,
      side: movement.type,
      assetCode: movement.assetCode,
    });

    if (canFillFromWallet) {
      const out = await timed("tx.system_wallet_fill", () =>
        prisma.$transaction(async (tx) => {
          const updated = await tx.treasuryMovement.updateMany({
            where: {
              id: movement.id,
              status: { in: [TreasuryMovementStatus.PENDING, TreasuryMovementStatus.PROCESSING] },
            },
            data: {
              status: TreasuryMovementStatus.APPROVED,
              approvedByUserId: actorUserId ?? undefined,
              approvedAt: new Date(),
              executedPrice,
              executedQuoteCode,
              executedSource: executedSource ?? "internal",
              executedAt,
              executedBaseAmount: baseAmountForExecution,
              executedQuoteAmount: isBuy ? grossBuyClp : estClp,
              executedFeeAmount: isBuy ? feeOnQuote : feeOnBase,
              executedFeeCode: isBuy ? AssetCode.CLP : movement.assetCode,
              internalReason: InternalMovementReason.NONE,
              internalState: InternalMovementState.NONE,
              externalOrderId: null,
              externalVenue: null,
            },
          });
          if (!updated.count) {
            return {
              updated: { id: movement.id, status: TreasuryMovementStatus.APPROVED },
              venue: "already-approved",
            } as ApprovalResult;
          }

          if (isBuy) {
            const debitClient = await tx.treasuryAccount.updateMany({
              where: {
                companyId,
                assetCode: AssetCode.CLP,
                balance: { gte: totalBuyClp },
              },
              data: { balance: { decrement: totalBuyClp } },
            });
            if (!debitClient.count) throw new Error("INSUFFICIENT_CLP");

            const debitSystem = await tx.treasuryAccount.updateMany({
              where: {
                companyId: systemCompanyId,
                assetCode: movement.assetCode,
                balance: { gte: baseAmountForExecution },
              },
              data: { balance: { decrement: baseAmountForExecution } },
            });
            if (!debitSystem.count) throw new Error("SYSTEM_WALLET_INSUFFICIENT");

            await tx.treasuryAccount.update({
              where: { companyId_assetCode: { companyId, assetCode: movement.assetCode } },
              data: { balance: { increment: baseAmountForExecution } },
            });

            await tx.treasuryAccount.update({
              where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
              data: { balance: { increment: totalBuyClp } },
            });
          } else {
            const debitClient = await tx.treasuryAccount.updateMany({
              where: {
                companyId,
                assetCode: movement.assetCode,
                balance: { gte: totalSellBase },
              },
              data: { balance: { decrement: totalSellBase } },
            });
            if (!debitClient.count) throw new Error("INSUFFICIENT_FUNDS");

            const debitSystem = await tx.treasuryAccount.updateMany({
              where: {
                companyId: systemCompanyId,
                assetCode: AssetCode.CLP,
                balance: { gte: estClp },
              },
              data: { balance: { decrement: estClp } },
            });
            if (!debitSystem.count) throw new Error("SYSTEM_WALLET_INSUFFICIENT");

            await tx.treasuryAccount.update({
              where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
              data: { balance: { increment: estClp } },
            });

            await tx.treasuryAccount.update({
              where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: movement.assetCode } },
              data: { balance: { increment: totalSellBase } },
            });
          }

          return {
            updated: { id: movement.id, status: TreasuryMovementStatus.APPROVED },
            venue: "system-wallet",
          } as ApprovalResult;
        })
      );

      logResult(out);
      return out;
    }

    if (!hasBudaKeys && strictSystemWallet) {
      const updated = await prisma.treasuryMovement.update({
        where: { id: movement.id },
        data: {
          status: TreasuryMovementStatus.PENDING,
          internalReason: InternalMovementReason.BUDA_API_ERROR,
          internalState: InternalMovementState.FAILED_TEMPORARY,
          lastError: "MISSING_BUDA_KEYS",
        },
        select: { id: true, status: true, internalReason: true, internalState: true },
      });
      const out = { updated, venue: "missing-buda-keys" };
      logResult(out);
      return out;
    }

    const MIN_BTC = new Prisma.Decimal(process.env.BUDA_MIN_BTC ?? "0.001");
    const MIN_USDT = new Prisma.Decimal(process.env.BUDA_MIN_USDT ?? "5");

    const isBelowBudaMin =
      (movement.assetCode === AssetCode.BTC && baseAmountForExecution.lt(MIN_BTC)) ||
      (movement.assetCode === AssetCode.USD && baseAmountForExecution.lt(MIN_USDT));

    if (isBelowBudaMin) {
      const updated = await prisma.treasuryMovement.update({
        where: { id: movement.id },
        data: {
          status: TreasuryMovementStatus.PENDING,
          internalReason: InternalMovementReason.BELOW_BUDA_MIN,
          internalState: InternalMovementState.WAITING_MIN_SIZE_AGGREGATION,
          lastError: "BELOW_BUDA_MIN",
        },
        select: { id: true, status: true, internalReason: true, internalState: true },
      });
      const out = { updated, venue: "below-min" };
      logResult(out);
      return out;
    }

    const marketId = marketForAsset(movement.assetCode);
    const baseAmountStr =
      movement.assetCode === AssetCode.BTC
        ? baseAmountForExecution.toFixed(8)
        : baseAmountForExecution.toFixed(2);
    const existingOrderId = movement.externalOrderId ?? null;

    let budaOrderId = existingOrderId;
    if (!budaOrderId) {
      let resp: any;
      try {
        resp = await budaCreateMarketOrder({
          marketId,
          type: isBuy ? "Bid" : "Ask",
          amount: baseAmountStr,
        });
      } catch (e: any) {
        const msg = String(e?.message ?? "BUDA_ERROR");
        const isLiquidity = /insufficient|insuficiente|saldo|balance|funds|liquidity/i.test(msg);
        const updated = await prisma.treasuryMovement.update({
          where: { id: movement.id },
          data: {
            status: TreasuryMovementStatus.PENDING,
            internalReason: isLiquidity
              ? InternalMovementReason.INSUFFICIENT_LIQUIDITY
              : InternalMovementReason.BUDA_API_ERROR,
            internalState: isLiquidity
              ? InternalMovementState.WAITING_LIQUIDITY
              : InternalMovementState.FAILED_TEMPORARY,
            lastError: msg,
          },
          select: { id: true, status: true, internalReason: true, internalState: true },
        });
        const out = { updated, venue: "buda-error" };
        logResult(out);
        return out;
      }

      budaOrderId =
        resp?.order?.id?.toString?.() ??
        resp?.order_id?.toString?.() ??
        resp?.id?.toString?.() ??
        null;
    }

    if (!budaOrderId) {
      const updated = await prisma.treasuryMovement.update({
        where: { id: movement.id },
        data: {
          status: TreasuryMovementStatus.PENDING,
          internalReason: InternalMovementReason.BUDA_API_ERROR,
          internalState: InternalMovementState.FAILED_TEMPORARY,
          lastError: "MISSING_BUDA_ORDER_ID",
        },
        select: { id: true, status: true, internalReason: true, internalState: true },
      });
      const out = { updated, venue: "buda-error" };
      logResult(out);
      return out;
    }

    const out = await timed("tx.buda_apply", () =>
      prisma.$transaction(async (tx) => {
        const updated = await tx.treasuryMovement.updateMany({
          where: {
            id: movement.id,
            status: { in: [TreasuryMovementStatus.PENDING, TreasuryMovementStatus.PROCESSING] },
          },
          data: {
            status: TreasuryMovementStatus.APPROVED,
            approvedByUserId: actorUserId ?? undefined,
            approvedAt: new Date(),
            executedPrice,
            executedQuoteCode,
            executedSource: executedSource ?? "buda",
            executedAt,
            executedBaseAmount: baseAmountForExecution,
            executedQuoteAmount: isBuy ? grossBuyClp : estClp,
            executedFeeAmount: isBuy ? feeOnQuote : feeOnBase,
            executedFeeCode: isBuy ? AssetCode.CLP : movement.assetCode,
            internalReason: InternalMovementReason.NONE,
            internalState: InternalMovementState.NONE,
            externalOrderId: budaOrderId,
            externalVenue: "buda",
          },
        });
        if (!updated.count) {
          return {
            updated: { id: movement.id, status: TreasuryMovementStatus.APPROVED },
            venue: "already-approved",
            budaOrderId,
          } as ApprovalResult;
        }

        if (isBuy) {
          const debitClient = await tx.treasuryAccount.updateMany({
            where: {
              companyId,
              assetCode: AssetCode.CLP,
              balance: { gte: totalBuyClp },
            },
            data: { balance: { decrement: totalBuyClp } },
          });
          if (!debitClient.count) throw new Error("INSUFFICIENT_CLP");

          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId, assetCode: movement.assetCode } },
            data: { balance: { increment: baseAmountForExecution } },
          });
        } else {
          const debitClient = await tx.treasuryAccount.updateMany({
            where: {
              companyId,
              assetCode: movement.assetCode,
              balance: { gte: totalSellBase },
            },
            data: { balance: { decrement: totalSellBase } },
          });
          if (!debitClient.count) throw new Error("INSUFFICIENT_FUNDS");

          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
            data: { balance: { increment: estClp } },
          });
        }

        return { updated: { id: movement.id, status: TreasuryMovementStatus.APPROVED }, venue: "buda", budaOrderId } as ApprovalResult;
      })
    );

    logResult(out);
    return out;
  } catch (e: any) {
    const lastError = String(e?.message ?? "UNKNOWN_ERROR");
    logEvent("trade:approve_exception", { ...baseLog, error: lastError });
    await prisma.treasuryMovement.updateMany({
      where: { id: movementId, companyId, status: TreasuryMovementStatus.PROCESSING },
      data: {
        status: TreasuryMovementStatus.PENDING,
        internalReason: InternalMovementReason.UNKNOWN,
        internalState: InternalMovementState.FAILED_TEMPORARY,
        lastError,
      },
    });
    throw e;
  }
}
