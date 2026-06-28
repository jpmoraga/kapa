"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PromoteMiningProspectButton({
  prospectId,
}: {
  prospectId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPromote() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/backoffice/mining/operations/promote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prospectId }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      id?: string;
      created?: boolean;
    };

    setLoading(false);

    if (!response.ok || !payload.id) {
      setError(payload.error ?? "No fue posible promover este prospecto.");
      return;
    }

    const promotedFlag = payload.created ? "1" : "existing";
    router.push(`/backoffice/mining/operations/${payload.id}?promoted=${promotedFlag}`);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-sm font-semibold text-white">Promover a operación</div>
      <p className="mt-2 text-sm text-white/60">
        Crea una operación separada sin borrar el prospecto privado ni copiar notas internas.
      </p>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onPromote}
        disabled={loading}
        className="k21-btn-primary mt-4 w-full disabled:opacity-60"
      >
        {loading ? "Promoviendo…" : "Promover a operación"}
      </button>
    </div>
  );
}
