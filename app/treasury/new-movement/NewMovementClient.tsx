"use client";

import { useSearchParams } from "next/navigation";
import MovementForm from "../_components/MovementForm";

export default function NewMovementClient() {
  const sp = useSearchParams();

  const mode = (sp.get("type") ?? "deposit") as any; // deposit | withdraw | adjust
  const assetCode = (sp.get("assetCode") ?? "BTC") as any;

  return <MovementForm mode={mode} assetCode={assetCode} />;
}