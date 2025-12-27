import { redirect } from "next/navigation";

export default async function SellPage({
  searchParams,
}: {
  searchParams?: Promise<{ unit?: string }>;
}) {
  const sp = await searchParams;
  const unit = String(sp?.unit ?? "").toLowerCase();
  const normalizedUnit = unit === "sats" || unit === "sat" ? "sats" : "btc";

  redirect(`/treasury/new-movement?type=withdraw&unit=${normalizedUnit}`);
}