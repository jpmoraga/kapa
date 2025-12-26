// web/lib/treasury/approveMovement.ts
import { prisma } from "@/lib/prisma";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";
import { budaCreateMarketOrder } from "@/lib/buda";
import { ensureSystemWallet } from "@/lib/systemWallet";
import { syncSystemWalletFromBuda } from "@/lib/syncSystemWallet";

async function getBestPriceSnapshot(
  tx: Prisma.TransactionClient,
  assetCode: AssetCode.BTC | AssetCode.USD,
  quoteCode: AssetCode.CLP
) {
  const manual = await tx.priceSnapshot.findFirst({
    where: { assetCode, quoteCode, source: { contains: "manual", mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    select: { price: true, source: true },
  });
  if (manual) return manual;

  return (
    (await tx.priceSnapshot.findFirst({
      where: { assetCode, quoteCode },
      orderBy: { createdAt: "desc" },
      select: { price: true, source: true },
    })) ?? null
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

export async function approveMovementAsSystem(opts: {
  movementId: string;
  companyId: string;
  actorUserId: string; // el user que queda como approvedBy
}) {
  const { movementId, companyId, actorUserId } = opts;

  try {
    const out = await prisma.$transaction(async (tx) => {
      const m = await tx.treasuryMovement.findFirst({
        where: { id: movementId, companyId },
        select: { id: true, status: true, type: true, assetCode: true, amount: true, note: true },
      });

      if (!m) throw new Error("NOT_FOUND");
      if (m.status !== TreasuryMovementStatus.PENDING) throw new Error("NOT_PENDING");

      // lock anti doble approve
      await tx.treasuryMovement.update({
        where: { id: m.id },
        data: { status: TreasuryMovementStatus.PROCESSING },
      });

      // sync system wallet desde Buda
      await syncSystemWalletFromBuda(tx);

      const amount = new Prisma.Decimal(m.amount);

      const accAsset = await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId, assetCode: m.assetCode } },
        update: {},
        create: { companyId, assetCode: m.assetCode, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      });

      const accClp = await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
        update: {},
        create: { companyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      });

      const curAsset = new Prisma.Decimal(accAsset.balance);
      const curClp = new Prisma.Decimal(accClp.balance);

      // congelar precio
      let executedPrice: Prisma.Decimal | null = null;
      let executedSource: string | null = null;
      let executedQuoteCode: AssetCode | null = null;
      let executedAt: Date | null = null;

      if (m.assetCode === AssetCode.CLP) {
        executedPrice = new Prisma.Decimal(1);
        executedSource = "internal";
        executedQuoteCode = AssetCode.CLP;
        executedAt = new Date();
      } else if (isTradeAsset(m.assetCode)) {
        const snap = await getBestPriceSnapshot(tx, m.assetCode, AssetCode.CLP);
        if (!snap?.price) throw new Error("NO_PRICE");
        executedPrice = new Prisma.Decimal(snap.price);
        executedSource = snap.source ?? null;
        executedQuoteCode = AssetCode.CLP;
        executedAt = new Date();
      }

      const type = String(m.type);

      // A) CLP normal
      if (m.assetCode === AssetCode.CLP) {
        let next = curAsset;
        if (type === "withdraw") {
          if (curAsset.lt(amount)) throw new Error("INSUFFICIENT_FUNDS");
          next = curAsset.minus(amount);
        } else if (type === "deposit") {
          next = curAsset.plus(amount);
        } else if (type === "adjust") {
          next = curAsset.plus(amount);
          if (next.lt(0)) throw new Error("NEGATIVE_BALANCE");
        } else throw new Error("BAD_TYPE");

        await tx.treasuryAccount.update({
          where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
          data: { balance: next },
        });

        const updated = await tx.treasuryMovement.update({
          where: { id: m.id },
          data: {
            status: TreasuryMovementStatus.APPROVED,
            approvedByUserId: actorUserId,
            approvedAt: new Date(),
            executedPrice,
            executedQuoteCode,
            executedSource,
            executedAt,
          },
          select: { id: true, status: true },
        });

        return { updated, venue: "internal-clp" as const };
      }

      // B) BTC/USD trades
      if (!isTradeAsset(m.assetCode)) throw new Error("UNSUPPORTED_ASSET");
      if (!executedPrice) throw new Error("NO_PRICE");

      const isBuy = type === "deposit";
      const isSell = type === "withdraw";
      if (!isBuy && !isSell) throw new Error("BAD_TYPE");

      const estClp = amount.mul(executedPrice);

      // ✅ IMPORTANTE: esto mira el saldo CLP DEL CLIENTE (empresa activa)
      // Si el cliente no tiene CLP en tu plataforma -> no se ejecuta.
      if (isBuy && curClp.lt(estClp)) throw new Error("INSUFFICIENT_CLP");
      if (isSell && curAsset.lt(amount)) throw new Error("INSUFFICIENT_FUNDS");

      // 1) Intentar system wallet
      const { companyId: systemCompanyId } = await ensureSystemWallet(tx);

      const sysAssetAcc = await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: m.assetCode } },
        update: {},
        create: { companyId: systemCompanyId, assetCode: m.assetCode, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      });

      const sysClpAcc = await tx.treasuryAccount.upsert({
        where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
        update: {},
        create: { companyId: systemCompanyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
        select: { balance: true },
      });

      const sysAsset = new Prisma.Decimal(sysAssetAcc.balance);
      const sysClp = new Prisma.Decimal(sysClpAcc.balance);

      const canFillFromWallet =
        (isBuy && sysAsset.gte(amount)) || (isSell && sysClp.gte(estClp));

      if (canFillFromWallet) {
        if (isBuy) {
          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
            data: { balance: curClp.minus(estClp) },
          });
          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId, assetCode: m.assetCode } },
            data: { balance: curAsset.plus(amount) },
          });

          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: m.assetCode } },
            data: { balance: sysAsset.minus(amount) },
          });
          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
            data: { balance: sysClp.plus(estClp) },
          });
        }

        if (isSell) {
          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId, assetCode: m.assetCode } },
            data: { balance: curAsset.minus(amount) },
          });
          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
            data: { balance: curClp.plus(estClp) },
          });

          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: m.assetCode } },
            data: { balance: sysAsset.plus(amount) },
          });
          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId: systemCompanyId, assetCode: AssetCode.CLP } },
            data: { balance: sysClp.minus(estClp) },
          });
        }

        const updated = await tx.treasuryMovement.update({
          where: { id: m.id },
          data: {
            status: TreasuryMovementStatus.APPROVED,
            approvedByUserId: actorUserId,
            approvedAt: new Date(),
            executedPrice,
            executedQuoteCode,
            executedSource: "internal-wallet",
            executedAt,
          },
          select: { id: true, status: true },
        });

        return { updated, venue: "internal-wallet" as const };
      }

      // 2) Si no alcanza, intentar BUDA (si supera mínimos configurados)
      const MIN_BTC = new Prisma.Decimal(process.env.BUDA_MIN_BTC ?? "0.001");
      const MIN_USDT = new Prisma.Decimal(process.env.BUDA_MIN_USDT ?? "5");

      const isBelowBudaMin =
        (m.assetCode === AssetCode.BTC && amount.lt(MIN_BTC)) ||
        (m.assetCode === AssetCode.USD && amount.lt(MIN_USDT));

      if (isBelowBudaMin) throw new Error("BELOW_BUDA_MIN_INTERNAL_ONLY");

      const marketId = marketForAsset(m.assetCode);

      const baseAmountStr = m.assetCode === AssetCode.BTC ? amount.toFixed(8) : amount.toFixed(2);

      const resp = await budaCreateMarketOrder({
        marketId,
        type: isBuy ? "Bid" : "Ask",
        amount: baseAmountStr,
      });

      const budaOrderId =
        resp?.order?.id?.toString?.() ??
        resp?.order_id?.toString?.() ??
        resp?.id?.toString?.() ??
        null;

      if (isBuy) {
        await tx.treasuryAccount.update({
          where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
          data: { balance: curClp.minus(estClp) },
        });
        await tx.treasuryAccount.update({
          where: { companyId_assetCode: { companyId, assetCode: m.assetCode } },
          data: { balance: curAsset.plus(amount) },
        });
      } else {
        await tx.treasuryAccount.update({
          where: { companyId_assetCode: { companyId, assetCode: m.assetCode } },
          data: { balance: curAsset.minus(amount) },
        });
        await tx.treasuryAccount.update({
          where: { companyId_assetCode: { companyId, assetCode: AssetCode.CLP } },
          data: { balance: curClp.plus(estClp) },
        });
      }

      const updated = await tx.treasuryMovement.update({
        where: { id: m.id },
        data: {
          status: TreasuryMovementStatus.APPROVED,
          approvedByUserId: actorUserId,
          approvedAt: new Date(),
          executedPrice,
          executedQuoteCode,
          executedSource: executedSource ?? "buda",
          executedAt,
          note: budaOrderId ? `${m.note ?? ""}${m.note ? " | " : ""}budaOrderId=${budaOrderId}` : m.note,
        },
        select: { id: true, status: true },
      });

      return { updated, venue: "buda" as const, budaOrderId };
    });

    return out;
  } catch (e: any) {
    // Si quedó PROCESSING y falló -> vuelve a PENDING (para reintento automático)
    await prisma.treasuryMovement.updateMany({
      where: { id: movementId, companyId, status: TreasuryMovementStatus.PROCESSING },
      data: { status: TreasuryMovementStatus.PENDING },
    });
    throw e;
  }
}