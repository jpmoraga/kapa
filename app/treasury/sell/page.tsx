import { redirect } from "next/navigation";

export default async function SellPage({
  searchParams,
}: {
  searchParams?: { unit?: string };
}) {
  const unit = String(searchParams?.unit ?? "").toLowerCase();
  const normalizedUnit = unit === "sats" || unit === "sat" ? "sats" : "BTC";

  redirect(`/treasury/new-movement?type=withdraw&unit=${normalizedUnit}`);
}