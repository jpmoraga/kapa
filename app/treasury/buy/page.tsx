import { redirect } from "next/navigation";

export default async function BuyPage({
  searchParams,
}: {
  searchParams?: Promise<{ unit?: string }>;
}) {
  const sp = await searchParams;
  const unit = String(sp?.unit ?? "").toLowerCase();
  const normalizedUnit = unit === "sats" || unit === "sat" ? "sats" : "btc";

  redirect(`/treasury/new-movement?type=deposit&unit=${normalizedUnit}`);
}