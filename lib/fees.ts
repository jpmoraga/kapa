import { AssetCode, Prisma } from "@prisma/client";

const BTC_FEE_PCT = new Prisma.Decimal("0.006");
const USD_FEE_PCT = new Prisma.Decimal("0.004");
const ZERO = new Prisma.Decimal(0);

export function getTradeFeePercent(assetCode: AssetCode): Prisma.Decimal {
  if (assetCode === AssetCode.BTC) return BTC_FEE_PCT;
  if (assetCode === AssetCode.USD) return USD_FEE_PCT;
  return ZERO;
}

export function computeTradeFee(quoteAmount: Prisma.Decimal, feePct: Prisma.Decimal): Prisma.Decimal {
  return quoteAmount.mul(feePct);
}
