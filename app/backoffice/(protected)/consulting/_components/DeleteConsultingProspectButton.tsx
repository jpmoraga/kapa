"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteConsultingProspectButtonProps = {
  prospectId: string;
  companyName: string;
  contactName: string;
  redirectHref?: string;
  variant?: "inline" | "danger";
};

function buttonClassName(variant: DeleteConsultingProspectButtonProps["variant"]) {
  if (variant === "danger") {
    return "inline-flex items-center justify-center rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:border-red-400/45 hover:bg-red-500/15 disabled:opacity-60";
  }

  return "inline-flex items-center rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-100 transition hover:border-red-400/40 hover:bg-red-500/15 disabled:opacity-60";
}

export default function DeleteConsultingProspectButton({
  prospectId,
  companyName,
  contactName,
  redirectHref,
  variant = "inline",
}: DeleteConsultingProspectButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    const confirmed = window.confirm(
      [
        "Vas a eliminar este prospecto de Consulting.",
        "",
        `Empresa: ${companyName}`,
        `Contacto: ${contactName}`,
        "",
        "Esta acción no se ejecutará sin tu confirmación.",
      ].join("\n")
    );

    if (!confirmed) return;

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/backoffice/consulting/prospects/${prospectId}`, {
      method: "DELETE",
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "No fue posible eliminar el prospecto.");
      return;
    }

    if (redirectHref) {
      router.push(redirectHref);
      router.refresh();
      return;
    }

    router.refresh();
  }

  return (
    <div className={variant === "danger" ? "space-y-3" : "space-y-2"}>
      <button
        type="button"
        onClick={onDelete}
        disabled={loading}
        className={buttonClassName(variant)}
      >
        {loading ? "Eliminando..." : "Eliminar"}
      </button>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}
