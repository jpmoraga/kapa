import { redirect } from "next/navigation";

export default async function BuyPage({
  searchParams,
}: {
  searchParams?: { unit?: string };
}) {
  const unit = String(searchParams?.unit ?? "").toLowerCase();
  const normalizedUnit = unit === "sats" || unit === "sat" ? "sats" : "BTC";

  redirect(`/treasury/new-movement?type=deposit&unit=${normalizedUnit}`);
}