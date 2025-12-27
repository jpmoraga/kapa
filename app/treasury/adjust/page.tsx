import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import AdjustClient from "./adjust-client";

type AssetCode = "BTC" | "CLP" | "USD";

function normalizeAsset(input: any): AssetCode {
  const a = String(input ?? "").trim().toUpperCase();
  if (a === "BTC" || a === "CLP" || a === "USD") return a;
  return "BTC";
}

export default async function AdjustPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/login");

  const email = session.user.email.toLowerCase().trim();
  const activeCompanyId = (session as any).activeCompanyId as string | undefined;
  if (!activeCompanyId) redirect("/select-company");

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) redirect("/auth/login");

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });

  const role = String(membership?.role ?? "").toLowerCase();
  const isAdminOrOwner = role === "admin" || role === "owner";
  if (!isAdminOrOwner) redirect("/dashboard");

  // ✅ aquí está el fix Next 16 (await searchParams)
  const sp = await searchParams;
  const raw = sp.assetCode ?? sp.asset;
  const initialAsset = Array.isArray(raw) ? normalizeAsset(raw[0]) : normalizeAsset(raw);

  return <AdjustClient initialAsset={initialAsset} />;
}