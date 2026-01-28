// web/app/dashboard/page.tsx
export const runtime = "nodejs";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getOnboardingStatus } from "@/lib/onboardingStatus";
import DashboardBonito from "@/app/components/DashboardBonito";
import { AssetCode, Prisma } from "@prisma/client";
import { CreditCard, BarChart3, ArrowLeftRight, Activity, SlidersHorizontal } from "lucide-react";

const ASSETS: AssetCode[] = [AssetCode.BTC, AssetCode.CLP, AssetCode.USD];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  void resolvedSearchParams;

  const perfEnabled = process.env.DEBUG_PERF === "1";
  const t0 = Date.now();

  const tSession = Date.now();
  const session = await getServerSession(authOptions);
  const sessionMs = Date.now() - tSession;
  if (!session?.user?.email) redirect("/auth/login");

  const email = session.user.email.toLowerCase().trim();
  const activeCompanyId = (session as any).activeCompanyId as string | undefined;
  if (!activeCompanyId) redirect("/select-company");

  

  // 1) usuario (con nombre desde DB)
  const tUser = Date.now();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      personProfile: { select: { fullName: true } },
    },
  });
  const userMs = Date.now() - tUser;
  if (!user) redirect("/auth/login");

  const displayName =
    (user.personProfile?.fullName ?? "").trim() || email.split("@")[0];

  

  // 1.5) estado onboarding (server-side)
  const tOnboarding = Date.now();
  const onboarding = await getOnboardingStatus(user.id);
  const onboardingMs = Date.now() - tOnboarding;

  // 🔒 Hard redirect de onboarding (server-side)
  if (!onboarding.canOperate) redirect("/onboarding");

  // 2) role en la empresa activa
  const tMembership = Date.now();
  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });
  const membershipMs = Date.now() - tMembership;
  const role = membership?.role ?? "member";
  const roleLower = String(role).toLowerCase();
  const isAdmin = roleLower === "admin" || roleLower === "owner";

  const tTxn = Date.now();
  const [balances, movements] = await prisma.$transaction(async (tx) => {
    // ✅ asegurar cuentas BTC/CLP/USD (multi-asset real)
    await tx.treasuryAccount.createMany({
      data: ASSETS.map((assetCode) => ({
        companyId: activeCompanyId,
        assetCode,
        balance: 0,
      })),
      skipDuplicates: true,
    });

    // balances por asset
    const accounts = await tx.treasuryAccount.findMany({
      where: { companyId: activeCompanyId },
      select: { assetCode: true, balance: true },
    });

    const map: Record<AssetCode, string> = {
      [AssetCode.BTC]: "0",
      [AssetCode.CLP]: "0",
      [AssetCode.USD]: "0",
    };

    for (const a of accounts) {
      map[a.assetCode] = a.balance?.toString?.() ?? "0";
    }

    // movimientos (por ahora traemos todos; luego filtramos por asset en UI si quieres)
    const mv = await tx.treasuryMovement.findMany({
      where: { companyId: activeCompanyId },
      orderBy: {
        createdAt: "desc", // 🔑 lo más importante
      },
      take: 200, // margen sano
      select: {
        id: true,
        assetCode: true,
        type: true,
        amount: true,
        attachmentUrl: true,
        createdAt: true,
        status: true,
        executedQuoteAmount: true,
      },
    });

    return [map, mv] as const;
  });
  const txnMs = Date.now() - tTxn;

  const clientMovements = movements.map((m) => ({
    id: m.id,
    assetCode: m.assetCode,
    type: m.type as "deposit" | "withdraw" | "adjust",
    amount: m.amount.toString(),
    attachmentUrl: m.attachmentUrl ?? null,
    executedQuoteAmount: m.executedQuoteAmount
      ? m.executedQuoteAmount.toString()
      : null,
    createdAt: m.createdAt.toISOString(),
    status: m.status,
  }));

  if (perfEnabled) {
    console.info("perf:dashboard", {
      route: "/dashboard",
      sessionMs,
      userMs,
      onboardingMs,
      membershipMs,
      txnMs,
      movementsCount: movements.length,
      totalMs: Date.now() - t0,
    });
  }

  return (
    <DashboardBonito
      activeCompanyId={activeCompanyId}
      activeCompanyName={displayName}
      balances={balances}
      movements={clientMovements}
      isAdmin={isAdmin}
      onboarding={onboarding}
      hrefs={{
        // CLP
        depositCLP: "/treasury/new-movement?mode=buy&assetCode=CLP",
        withdrawCLP: "/treasury/new-movement?mode=sell&assetCode=CLP",
      
        // BTC
        buyBTC: "/treasury/new-movement?mode=buy&assetCode=BTC",
        sellBTC: "/treasury/new-movement?mode=sell&assetCode=BTC",
      
        // USD (en tu sistema = USDT)
        buyUSD: "/treasury/new-movement?mode=buy&assetCode=USD",
        sellUSD: "/treasury/new-movement?mode=sell&assetCode=USD",
      
        // Activity
        activity: "/treasury/activity",
      }}
    />
  );
}
