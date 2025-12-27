// web/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";
import { AssetCode, Prisma } from "@prisma/client";

const ASSETS: AssetCode[] = [AssetCode.BTC, AssetCode.CLP, AssetCode.USD];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  const email = session.user.email.toLowerCase().trim();
  const activeCompanyId = (session as any).activeCompanyId as string | undefined;
  if (!activeCompanyId) redirect("/select-company");

  // 1) usuario
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      personProfile: { select: { userId: true } },
    },
  });
  if (!user) redirect("/auth/login");

  

    // 1.5) estado onboarding (server-side)
    const [personProfile, userOnboarding] = await prisma.$transaction([
      prisma.personProfile.findUnique({
        where: { userId: user.id },
        select: { userId: true },
      }),
      prisma.userOnboarding.findUnique({
        where: { userId: user.id },
        select: { termsAcceptedAt: true },
      }),
    ]);
  
    const onboarding = {
      hasProfile: Boolean(personProfile?.userId),
      termsAccepted: Boolean(userOnboarding?.termsAcceptedAt),
      canOperate: Boolean(personProfile?.userId) && Boolean(userOnboarding?.termsAcceptedAt),
    };

    // 🔒 Hard redirect de onboarding (server-side)
    if (!onboarding.hasProfile) {
      redirect("/onboarding/profile");
    }

    if (!onboarding.termsAccepted) {
      redirect("/onboarding/accept-terms");
    }

  // 2) role en la empresa activa
  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });
  const role = membership?.role ?? "member";
  const roleLower = String(role).toLowerCase();
  const isAdmin = roleLower === "admin" || roleLower === "owner";

  const [balances, movements] = await prisma.$transaction(async (tx) => {
    // ✅ asegurar cuentas BTC/CLP/USD (multi-asset real)
    await Promise.all(
      ASSETS.map((assetCode) =>
        tx.treasuryAccount.upsert({
          where: { companyId_assetCode: { companyId: activeCompanyId, assetCode } },
          update: {},
          create: {
            companyId: activeCompanyId,
            assetCode,
            balance: new Prisma.Decimal(0),
          },
          select: { id: true },
        })
      )
    );

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
        note: true,
        createdAt: true,
        status: true,
      },
    });

    return [map, mv] as const;
  });

  const clientMovements = movements.map((m) => ({
    id: m.id,
    assetCode: m.assetCode,
    type: m.type as "deposit" | "withdraw" | "adjust",
    amount: m.amount.toString(),
    note: m.note,
    createdAt: m.createdAt.toISOString(),
    status: m.status,
  }));

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <header className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-neutral-400">Empresa activa · {activeCompanyId}</p>
          <p className="text-xs text-neutral-500">Rol · {role}</p>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <DashboardClient
        balances={balances}
        movements={clientMovements}
        isAdmin={isAdmin}
        onboarding={onboarding}
      />
      </main>
    </div>
  );
}