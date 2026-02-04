"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type MovementRow = {
  id: string;
  source?: "movement" | "deposit_slip";
  movementId?: string | null;
  status: string;
  assetCode: string;
  type: string;
  amount: string;
  note: string | null;
  createdAt: string;
  createdByUserId?: string | null;
  createdByEmail?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  attachmentUrl?: string | null;
  internalReason?: string | null;
  internalState?: string | null;
  slipId?: string | null;
  slipStatus?: string | null;
  ocrStatus?: string | null;
  declaredAmountClp?: string | null;
  parsedAmountClp?: string | null;
  bankHint?: string | null;
  slipPath?: string | null;
};

type Notice = { type: "success" | "error"; message: string } | null;

type AdminOpsClientProps = {
  initialRows?: MovementRow[];
  disableAutoFetch?: boolean;
  initialStatusFilter?: string;
};

function formatAmount(amount: string, assetCode: string) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return `${amount} ${assetCode}`;
  if (assetCode === "CLP") {
    return `$${Math.round(numeric).toLocaleString("es-CL")} CLP`;
  }
  return `${numeric.toLocaleString("es-CL")} ${assetCode}`;
}

function statusPill(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "k21-pill-approved";
  if (normalized === "REJECTED") return "k21-pill-rejected";
  return "k21-pill-pending";
}

export default function AdminOpsClient({
  initialRows = [],
  disableAutoFetch = false,
  initialStatusFilter = "PENDING",
}: AdminOpsClientProps) {
  const [rows, setRows] = useState<MovementRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<Record<string, boolean>>({});

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/treasury/movements/pending?admin=1", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "No se pudieron cargar los movimientos.");
        setRows([]);
        return;
      }
      setRows(Array.isArray(data?.pending) ? data.pending : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (disableAutoFetch) return;
    fetchRows();
  }, [fetchRows, disableAutoFetch]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (!query) return true;
      const haystack = [
        row.id,
        row.movementId ?? "",
        row.slipId ?? "",
        row.createdByEmail ?? "",
        row.companyName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, search, statusFilter]);

  function resolveMovementId(row: MovementRow) {
    if (row.movementId) return row.movementId;
    if (row.source === "movement") return row.id;
    return null;
  }

  function resolveSlipId(row: MovementRow) {
    if (row.slipId) return row.slipId;
    if (row.source === "deposit_slip") return row.id;
    return null;
  }

  function resolveSlipAmount(row: MovementRow) {
    const parsed = row.parsedAmountClp ? Number(row.parsedAmountClp) : null;
    if (parsed && Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
    const declared = row.declaredAmountClp ? Number(row.declaredAmountClp) : null;
    if (declared && Number.isFinite(declared) && declared > 0) return Math.round(declared);
    const base = Number(row.amount);
    if (Number.isFinite(base) && base > 0) return Math.round(base);
    return null;
  }

  async function openSlip(path: string) {
    const res = await fetch(
      `/api/storage/signed-url?bucket=deposit-slips&path=${encodeURIComponent(path)}`,
      { cache: "no-store" }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.signedUrl) {
      setNotice({ type: "error", message: data?.error ?? "No pude abrir el comprobante." });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function runAction(row: MovementRow, action: "approve" | "reject" | "paid" | "reconcile") {
    setNotice(null);
    setActioning((prev) => ({ ...prev, [row.id]: true }));
    try {
      const movementId = resolveMovementId(row);
      const slipId = resolveSlipId(row);

      if (!movementId && (action === "paid" || action === "reconcile")) {
        setNotice({ type: "error", message: "Acción no disponible para este registro." });
        return;
      }

      let endpoint = "";
      let body: Record<string, any> | undefined;

      if (row.source === "deposit_slip" && !movementId) {
        if (!slipId) {
          setNotice({ type: "error", message: "Slip inválido." });
          return;
        }
        if (action === "approve") {
          const amount = resolveSlipAmount(row);
          let amountClp = amount;
          if (!amountClp) {
            const input = window.prompt("Monto CLP para aprobar:", "");
            const parsed = input ? Number(String(input).replace(/[^\d]/g, "")) : NaN;
            if (!Number.isFinite(parsed) || parsed <= 0) {
              setNotice({ type: "error", message: "Monto inválido." });
              return;
            }
            amountClp = Math.round(parsed);
          }
          endpoint = "/api/internal/deposit-slip/set-manual";
          body = { slipId, amountClp };
        } else if (action === "reject") {
          endpoint = "/api/internal/deposit-slip/reject";
          body = { slipId };
        } else {
          setNotice({ type: "error", message: "Acción no disponible para este comprobante." });
          return;
        }
      } else if (row.assetCode === "CLP" && row.type === "deposit") {
        if (!movementId) {
          setNotice({ type: "error", message: "Movimiento inválido." });
          return;
        }
        if (action === "approve") {
          const amountClp = resolveSlipAmount(row);
          endpoint = `/api/admin/movements/${movementId}/approve`;
          body = amountClp ? { amountClp } : undefined;
        } else if (action === "reject") {
          endpoint = `/api/admin/movements/${movementId}/reject`;
        } else {
          setNotice({ type: "error", message: "Acción no disponible para este depósito." });
          return;
        }
      } else {
        if (!movementId) {
          setNotice({ type: "error", message: "Movimiento inválido." });
          return;
        }
        endpoint = `/api/treasury/movements/${movementId}/${action}`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ type: "error", message: data?.error ?? "No se pudo ejecutar la acción." });
        return;
      }
      setNotice({ type: "success", message: "Acción ejecutada." });
      await fetchRows();
    } finally {
      setActioning((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  function openReceipt(id: string) {
    window.open(`/api/treasury/movements/${id}/receipt`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-neutral-400">Cava Admin</div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">Operaciones</h1>
        </div>
        <div className="k21-badge">Pendientes: {rows.length}</div>
      </div>

      <div className="mt-6 k21-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Estado</label>
            <select
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="ALL">ALL</option>
            </select>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-neutral-400">Buscar</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100"
              placeholder="ID, email o empresa"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="k21-btn-secondary mt-5"
            type="button"
            onClick={fetchRows}
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Refresh"}
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`mt-4 rounded-xl border px-4 py-2 text-sm ${
            notice.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {notice.message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 k21-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-900/60 text-xs uppercase text-neutral-400">
              <tr>
                <th className="px-4 py-3">Fuente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Usuario / Empresa</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Nota / Reason</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((row) => {
                const rowBusy = Boolean(actioning[row.id]);
                const slipPath = row.slipPath ?? row.attachmentUrl ?? null;
                const isSlip = row.source === "deposit_slip" || Boolean(row.slipId);
                const showPaid = row.type === "withdraw" && row.assetCode === "CLP";
                const showReconcile =
                  row.status === "PROCESSING" ||
                  Boolean(row.internalReason && row.internalReason !== "NONE");
                const showReceipt = row.assetCode === "BTC" || row.assetCode === "USD";

                return (
                  <tr key={row.id} className="text-neutral-200">
                    <td className="px-4 py-3 text-xs text-neutral-300">
                      {row.source === "deposit_slip" ? "Comprobante" : "Movimiento"}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      {new Date(row.createdAt).toLocaleString("es-CL")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{row.createdByEmail ?? "—"}</div>
                      <div className="text-xs text-neutral-500">{row.companyName ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-300">{row.type}</td>
                    <td className="px-4 py-3 text-xs text-neutral-300">{row.assetCode}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatAmount(row.amount, row.assetCode)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusPill(row.status)}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      <div>{row.note ?? "—"}</div>
                      {row.slipStatus && row.slipStatus !== "approved" && (
                        <div className="text-[11px] text-neutral-500">Slip: {row.slipStatus}</div>
                      )}
                      {row.bankHint && (
                        <div className="text-[11px] text-neutral-500">Banco: {row.bankHint}</div>
                      )}
                      {row.parsedAmountClp && (
                        <div className="text-[11px] text-neutral-500">
                          OCR: {Number(row.parsedAmountClp).toLocaleString("es-CL")} CLP
                        </div>
                      )}
                      {row.declaredAmountClp && !row.parsedAmountClp && (
                        <div className="text-[11px] text-neutral-500">
                          Declarado: {Number(row.declaredAmountClp).toLocaleString("es-CL")} CLP
                        </div>
                      )}
                      {row.internalReason && row.internalReason !== "NONE" && (
                        <div className="text-[11px] text-neutral-500">{row.internalReason}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="k21-btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                          disabled={rowBusy}
                          onClick={() => runAction(row, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                          disabled={rowBusy}
                          onClick={() => runAction(row, "reject")}
                        >
                          Reject
                        </button>
                        {showPaid && (
                          <button
                            className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                            disabled={rowBusy}
                            onClick={() => runAction(row, "paid")}
                          >
                            Mark Paid
                          </button>
                        )}
                        {showReconcile && (
                          <button
                            className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                            disabled={rowBusy}
                            onClick={() => runAction(row, "reconcile")}
                          >
                            Reconcile
                          </button>
                        )}
                        {showReceipt && (
                          <button
                            className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                            disabled={rowBusy}
                            onClick={() => openReceipt(row.id)}
                          >
                            Receipt
                          </button>
                        )}
                        {isSlip && slipPath && (
                          <button
                            className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                            disabled={rowBusy}
                            onClick={() => openSlip(slipPath)}
                          >
                            Ver comprobante
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && !loading && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-neutral-500" colSpan={9}>
                    No hay movimientos pendientes.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-neutral-500" colSpan={9}>
                    Cargando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
