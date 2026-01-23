import { Suspense } from "react";
import NewMovementClient from "./NewMovementClient";

export default function NewMovementPage() {
  return (
    <Suspense fallback={<div className="k21-card p-6 text-sm text-neutral-400">Cargando…</div>}>
      <NewMovementClient />
    </Suspense>
  );
}