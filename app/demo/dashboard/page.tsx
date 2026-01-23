// web/app/demo/dashboard/page.tsx
import DashboardBonito from "@/app/components/DashboardBonito";

export default function DemoDashboardPage() {
  const activeCompanyId = "demo-company";
  const isAdmin = true;

  const onboarding = {
    hasProfile: true,
    termsAccepted: true,
    canOperate: true,
  };

  const balances = {
    BTC: "0.31415926",
    CLP: "12500000",
    USD: "4200",
  } as const;

  const movements = [
    {
      id: "m1",
      assetCode: "BTC",
      type: "deposit",
      amount: "0.10",
      note: "Compra demo",
      createdAt: new Date().toISOString(),
      status: "APPROVED",
    },
    {
      id: "m2",
      assetCode: "USD",
      type: "deposit",
      amount: "2000",
      note: "Ingreso USDT demo",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      status: "PENDING",
    },
    {
      id: "m3",
      assetCode: "CLP",
      type: "withdraw",
      amount: "1500000",
      note: "Salida CLP demo",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: "REJECTED",
    },
  ] as any[];

  return (
    <DashboardBonito
      activeCompanyId={activeCompanyId}
      balances={balances as any}
      movements={movements as any}
      isAdmin={isAdmin}
      onboarding={onboarding}
    />
  );
}