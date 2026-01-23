// app/treasury/new-movement/NewMovementClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import MovementForm from "../_components/MovementForm";

type Mode = "buy" | "sell" | "adjust";
type AssetCode = "BTC" | "CLP" | "USD";

function safeMode(v: string | null): Mode {
  if (v === "sell") return "sell";
  if (v === "adjust") return "adjust";
  return "buy";
}

function safeAsset(v: string | null): AssetCode {
  if (v === "CLP") return "CLP";
  if (v === "USD") return "USD";
  return "BTC";
}

export default function NewMovementClient() {
  const sp = useSearchParams();

  const mode = safeMode(sp.get("mode"));
  const assetCode = safeAsset(sp.get("assetCode"));

  return <MovementForm mode={mode} assetCode={assetCode} />;
}