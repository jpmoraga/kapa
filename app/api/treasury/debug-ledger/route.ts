export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { AssetCode, Prisma } from "@prisma/client";
import { requireCanOperate } from "@/lib/guards/requireCanOperate";
import { budaGetBalances } from "@/lib/buda";

const ASSETS: AssetCode[] = [AssetCode.BTC, AssetCode.CLP, AssetCode.USD];

function safeDecimal(x: any, fallback = "0") {
  try {
    return new Prisma.Decimal(String(x ?? fallback));
  } catch {
    return new Prisma.Decimal(fallback);
  }
}

function toMap(rows: { assetCode: AssetCode; balance: Prisma.Decimal | null }[]) {
  const out: Record<AssetCode, string> = {
    BTC: "0",
    CLP: "0",
    USD: "0",
  };
  for (const r of rows) {
    out[r.assetCode] = r.balance?.toString?.() ?? "0";
  }
  return out;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const can = await requireCanOperate(user.id);
  if (!can.ok) return NextResponse.json({ error: can.error }, { status: 403 });

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });
  const role = String(membership?.role ?? "").toLowerCase();
  const isAdminOrOwner = role === "admin" || role === "owner";
  if (!isAdminOrOwner) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const url = new URL(req.url);
  const requestedCompanyId = url.searchParams.get("companyId") ?? activeCompanyId;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  if (requestedCompanyId !== activeCompanyId && !isAdminOrOwner) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const systemCompany = await prisma.company.findFirst({
    where: { name: "__SYSTEM_WALLET__" },
    select: { id: true },
  });
  if (!systemCompany) {
    return NextResponse.json({ error: "System wallet no existe" }, { status: 500 });
  }

  const [companyAccounts, systemAccounts, clientSums, movements] = await prisma.$transaction([
    prisma.treasuryAccount.findMany({
      where: { companyId: requestedCompanyId },
      select: { assetCode: true, balance: true },
    }),
    prisma.treasuryAccount.findMany({
      where: { companyId: systemCompany.id },
      select: { assetCode: true, balance: true },
    }),
    prisma.treasuryAccount.groupBy({
      by: ["assetCode"],
      where: {
        companyId: { not: systemCompany.id },
        assetCode: { in: ASSETS },
      },
      orderBy: { assetCode: "asc" },
      _sum: { balance: true },
    }),
    prisma.treasuryMovement.findMany({
      where: { companyId: requestedCompanyId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        assetCode: true,
        amount: true,
        status: true,
        createdAt: true,
        executedAt: true,
        executedPrice: true,
        executedBaseAmount: true,
        executedQuoteAmount: true,
        executedFeeAmount: true,
        executedFeeCode: true,
        internalReason: true,
        internalState: true,
        externalOrderId: true,
        lastError: true,
      },
    }),
  ]);

  const clientSum = (asset: AssetCode) => {
    const row = clientSums.find((x) => x.assetCode === asset);
    return safeDecimal(row?._sum?.balance ?? "0");
  };

  let buda: Record<string, string> | null = null;
  let budaError: string | null = null;
  try {
    const budaResp = await budaGetBalances();
    buda = budaResp.byCurrency ?? null;
  } catch (e: any) {
    budaError = String(e?.message ?? "BUDA_ERROR");
  }

  let expectedSystem: Record<AssetCode, string> | null = null;
  if (buda) {
    const budaClp = safeDecimal(buda["CLP"] ?? "0");
    const budaBtc = safeDecimal(buda["BTC"] ?? "0");
    const budaUsd = safeDecimal(buda["USDT"] ?? buda["USD"] ?? "0");

    const expectedClp = Prisma.Decimal.max(budaClp.minus(clientSum(AssetCode.CLP)), new Prisma.Decimal(0));
    const expectedBtc = Prisma.Decimal.max(budaBtc.minus(clientSum(AssetCode.BTC)), new Prisma.Decimal(0));
    const expectedUsd = Prisma.Decimal.max(budaUsd.minus(clientSum(AssetCode.USD)), new Prisma.Decimal(0));

    expectedSystem = {
      CLP: expectedClp.toString(),
      BTC: expectedBtc.toString(),
      USD: expectedUsd.toString(),
    };
  }

  return NextResponse.json({
    ok: true,
    companyId: requestedCompanyId,
    systemCompanyId: systemCompany.id,
    balances: toMap(companyAccounts),
    systemBalances: toMap(systemAccounts),
    clientSums: {
      CLP: clientSum(AssetCode.CLP).toString(),
      BTC: clientSum(AssetCode.BTC).toString(),
      USD: clientSum(AssetCode.USD).toString(),
    },
    buda: buda
      ? {
          CLP: buda["CLP"] ?? "0",
          BTC: buda["BTC"] ?? "0",
          USD: buda["USDT"] ?? buda["USD"] ?? "0",
        }
      : null,
    budaError,
    expectedSystem,
    movements,
  });
}
