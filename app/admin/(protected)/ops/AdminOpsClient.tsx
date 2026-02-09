"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { displayAsset, formatUsdtAdmin } from "@/lib/formatUsdt";

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
  approvedAt?: string | null;
  approvedByUserId?: string | null;
  executedAt?: string | null;
  executedPrice?: string | null;
  executedQuoteAmount?: string | null;
  executedBaseAmount?: string | null;
  executedFeeAmount?: string | null;
  executedFeeCode?: string | null;
  executedSource?: string | null;
  externalVenue?: string | null;
  externalOrderId?: string | null;
  paidOut?: boolean | null;
  paidOutAt?: string | null;
  createdByUserId?: string | null;
  createdByEmail?: string | null;
  userEmail?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  attachmentUrl?: string | null;
  internalReason?: string | null;
  internalState?: string | null;
  lastError?: string | null;
  retryCount?: number | null;
  nextRetryAt?: string | null;
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

type ReceiptData = {
  movementId?: string | null;
  side?: "buy" | "sell" | string | null;
  baseAsset?: "BTC" | "USD" | string | null;
  quoteAsset?: "CLP" | string | null;
  status?: string | null;
  qty?: string | null;
  price?: string | null;
  grossAmount?: string | null;
  feePercent?: string | null;
  feeAmount?: string | null;
  feeCurrency?: "CLP" | "BTC" | "USD" | string | null;
  netAmount?: string | null;
  createdAt?: string | null;
  executedAt?: string | null;
  message?: string | null;
  internalReason?: string | null;
  externalOrderId?: string | null;
  externalVenue?: string | null;
};

function formatAmount(amount: string, assetCode: string) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return `${amount} ${displayAsset(assetCode)}`;
  if (assetCode === "CLP") {
    return `$${Math.round(numeric).toLocaleString("es-CL")} CLP`;
  }
  if (String(assetCode).toUpperCase() === "USD") {
    return formatUsdtAdmin(amount);
  }
  return `${numeric.toLocaleString("es-CL")} ${displayAsset(assetCode)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-CL");
}

function formatClpValue(value?: string | null) {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return `$${Math.round(n).toLocaleString("es-CL")} CLP`;
}

function formatAssetValue(value: string | null | undefined, asset: string, decimals: number) {
  if (!value) return "—";
  if (String(asset ?? "").toUpperCase() === "USD") {
    const formatted = formatUsdtAdmin(value);
    return formatted === "--" ? `${value} USDT` : formatted;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return `${n.toLocaleString("es-CL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${displayAsset(asset)}`;
}

function formatFeePercent(value?: string | null) {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `${(n * 100).toFixed(2)}%`;
}

function isTradeAsset(code: string) {
  const v = String(code ?? "").toUpperCase();
  return v === "BTC" || v === "USD";
}

function isClpWithdrawRow(row: MovementRow) {
  const asset = String(row.assetCode ?? "").toUpperCase();
  const typeValue = String(row.type ?? "").toLowerCase();
  return asset === "CLP" && typeValue === "withdraw";
}

function deriveOperationLabel(row: MovementRow) {
  const typeValue = String(row.type ?? "").toLowerCase();
  const asset = String(row.assetCode ?? "").toUpperCase();
  const isSlip = row.source === "deposit_slip" || Boolean(row.slipId);

  if (isSlip) return "Comprobante CLP";
  if (asset === "CLP" && typeValue === "deposit") return "Depósito CLP";
  if (asset === "CLP" && typeValue === "withdraw") return "Retiro CLP";
  if (asset === "BTC" && (typeValue === "deposit" || typeValue === "buy")) return "Compra BTC";
  if (asset === "BTC" && (typeValue === "withdraw" || typeValue === "sell")) return "Venta BTC";
  if (asset === "USD" && (typeValue === "deposit" || typeValue === "buy")) return "Compra USDT";
  if (asset === "USD" && (typeValue === "withdraw" || typeValue === "sell")) return "Venta USDT";

  const fallbackType = deriveType(row).label;
  const assetLabel = displayAsset(asset);
  return `${fallbackType.toUpperCase()} ${assetLabel}`;
}

function formatPrimaryAmount(row: MovementRow) {
  const asset = String(row.assetCode ?? "").toUpperCase();
  const raw = row.amount;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) {
    return { label: `${raw} ${displayAsset(asset)}`, tooltip: null };
  }

  if (asset === "CLP") {
    return { label: `$${Math.round(numeric).toLocaleString("es-CL")} CLP`, tooltip: null };
  }

  if (asset === "BTC") {
    const sats = Math.round(numeric * 1e8);
    const tooltip = `${numeric.toLocaleString("es-CL", {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    })} BTC`;
    const label = sats > 0 ? `${sats.toLocaleString("es-CL")} sats` : numeric > 0 ? "<1 sat" : "0 sats";
    return { label, tooltip };
  }

  if (asset === "USD") {
    const label = formatUsdtAdmin(raw);
    return { label: label === "--" ? `${raw} USDT` : label, tooltip: null };
  }

  return { label: `${numeric.toLocaleString("es-CL")} ${asset}`, tooltip: null };
}

function statusPill(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "k21-pill-approved";
  if (normalized === "REJECTED") return "k21-pill-rejected";
  if (normalized === "FAILED") return "k21-pill-rejected";
  return "k21-pill-pending";
}

function normalizeTypeValue(value: string | null | undefined) {
  return String(value ?? "").toLowerCase().trim();
}

function deriveType(row: MovementRow) {
  const raw = normalizeTypeValue(row.type);
  const isTradeAsset = row.assetCode === "BTC" || row.assetCode === "USD";
  if (raw === "buy" || raw === "sell") return { key: raw, label: raw };
  if (isTradeAsset && raw === "deposit") return { key: "buy", label: "buy" };
  if (isTradeAsset && raw === "withdraw") return { key: "sell", label: "sell" };
  if (raw === "deposit" || raw === "withdraw") return { key: raw, label: raw };
  return { key: raw || "unknown", label: raw || "unknown" };
}

function resolveSourceLabel(row: MovementRow) {
  const source = String(row.executedSource ?? row.externalVenue ?? "").toLowerCase();
  if (!source) return "—";
  if (source.includes("buda")) return "BUDA";
  if (source.includes("internal") || source.includes("system") || source.includes("manual")) {
    return "SYSTEM";
  }
  return source.toUpperCase();
}

function formatPaidOut(value?: boolean | null) {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "—";
}

function resolveStatusLabel(row: MovementRow) {
  const statusValue = String(row.status ?? "").toUpperCase();
  if (statusValue === "FAILED") return "FAILED";
  if (row.internalState === "FAILED_TEMPORARY") return "FAILED";
  return statusValue || "—";
}

export default function AdminOpsClient({
  initialRows = [],
  disableAutoFetch = false,
  initialStatusFilter = "ALL",
}: AdminOpsClientProps) {
  const [rows, setRows] = useState<MovementRow[]>(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [paidFilter, setPaidFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [actioning, setActioning] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pendingTotal, setPendingTotal] = useState<number | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const fetchRows = useCallback(
    async (opts?: { append?: boolean; cursor?: string | null }) => {
      const append = opts?.append === true;
      const statusValue = String(statusFilter ?? "PENDING").toUpperCase();
      const usePendingEndpoint = statusValue === "PENDING" || statusValue === "PROCESSING";

      if (!append) {
        setNextCursor(null);
      }

      setLoading(true);
      setError(null);
      try {
        if (usePendingEndpoint) {
          const res = await fetch("/api/treasury/movements/pending?admin=1", {
            cache: "no-store",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(data?.error ?? "No se pudieron cargar los movimientos.");
            setRows([]);
            return;
          }
          const pendingRows: MovementRow[] = Array.isArray(data?.pending) ? data.pending : [];
          setRows(pendingRows);
          setNextCursor(null);
          const pendingOnly = pendingRows.filter(
            (row: MovementRow) => String(row.status ?? "").toUpperCase() === "PENDING"
          ).length;
          setPendingTotal(pendingOnly);
          return;
        }

        const params = new URLSearchParams();
        params.set("status", statusFilter);
        params.set("type", typeFilter);
        if (paidFilter === "PAID") params.set("paidOut", "true");
        else if (paidFilter === "UNPAID") params.set("paidOut", "false");
        else params.set("paidOut", "ALL");
        const q = search.trim();
        if (q) params.set("q", q);
        params.set("limit", "50");
        if (append && opts?.cursor) params.set("cursor", opts.cursor);

        const res = await fetch(`/api/admin/movements?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message ?? data?.error ?? "No se pudieron cargar los movimientos.");
          if (!append) setRows([]);
          return;
        }
        const listRows = Array.isArray(data?.rows) ? data.rows : [];
        setRows((prev) => (append ? [...prev, ...listRows] : listRows));
        setNextCursor(data?.nextCursor ?? null);
        if (typeof data?.pendingCount === "number") {
          setPendingTotal(data.pendingCount);
        }
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, typeFilter, paidFilter, search]
  );

  useEffect(() => {
    if (disableAutoFetch) return;
    fetchRows();
  }, [fetchRows, disableAutoFetch]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const statusValue = String(row.status ?? "").toUpperCase();
      if (statusFilter !== "ALL" && statusValue !== statusFilter) return false;
      const typeMeta = deriveType(row);
      if (typeFilter !== "ALL" && typeMeta.key !== typeFilter) return false;
      if (paidFilter !== "ALL") {
        const isPaid = row.paidOut === true;
        if (paidFilter === "PAID" && !isPaid) return false;
        if (paidFilter === "UNPAID" && isPaid) return false;
      }
      if (!query) return true;
      const haystack = [
        row.id,
        row.movementId ?? "",
        row.slipId ?? "",
        row.createdByEmail ?? "",
        row.companyName ?? "",
        row.companyId ?? "",
        row.createdByUserId ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, search, statusFilter, typeFilter, paidFilter]);

  const showPaidColumn = useMemo(() => filtered.some((row) => isClpWithdrawRow(row)), [filtered]);

  const pendingCount = useMemo(() => {
    if (typeof pendingTotal === "number") return pendingTotal;
    return rows.filter((row) => String(row.status ?? "").toUpperCase() === "PENDING").length;
  }, [rows, pendingTotal]);

  const resultsCount = useMemo(() => rows.length, [rows]);

  const selectedRow = useMemo(() => {
    if (!selectedId) return null;
    return rows.find((row) => row.id === selectedId) ?? null;
  }, [rows, selectedId]);

  const detailJson = useMemo(() => selectedRow ?? null, [selectedRow]);

  function resolveMovementId(row: MovementRow) {
    return row.movementId ?? row.id ?? null;
  }

  function resolveSlipId(row: MovementRow) {
    if (row.slipId) return row.slipId;
    if (row.source === "deposit_slip") return row.id;
    return null;
  }

  function canResyncMovement(row: MovementRow) {
    const movementId = resolveMovementId(row);
    if (!movementId) return false;
    const statusValue = String(row.status ?? "").toUpperCase();
    const assetCode = String(row.assetCode ?? "").toUpperCase();
    const isTradeAsset = assetCode === "BTC" || assetCode === "USD";
    const isResyncStatus = statusValue === "PENDING" || statusValue === "PROCESSING";
    return isTradeAsset && isResyncStatus;
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

  async function runAction(
    row: MovementRow,
    action: "approve" | "reject" | "paid" | "resync"
  ) {
    setNotice(null);
    setActioning((prev) => ({ ...prev, [row.id]: true }));
    try {
      const movementId = resolveMovementId(row);
      const rawMovementId = row.movementId ?? null;
      const slipId = resolveSlipId(row);
      const rowDebug = JSON.stringify(row);
      const isSlip = row.source === "deposit_slip" || Boolean(row.slipId);

      let endpoint = "";
      let body: Record<string, any> | undefined;
      const rawType = normalizeTypeValue(row.type);

      if (isSlip && !rawMovementId) {
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
      } else {
        if (!movementId) {
          setNotice({ type: "error", message: `Movimiento inválido. row=${rowDebug}` });
          return;
        }
        if (action === "approve") {
          const isClpDeposit = row.assetCode === "CLP" && rawType === "deposit";
          const amountClp = isClpDeposit ? resolveSlipAmount(row) : null;
          endpoint = `/api/admin/movements/${movementId}/approve`;
          body = amountClp ? { amountClp } : undefined;
        } else if (action === "reject") {
          endpoint = `/api/admin/movements/${movementId}/reject`;
        } else {
          endpoint =
            action === "resync"
              ? `/api/admin/movements/${movementId}/resync`
              : `/api/treasury/movements/${movementId}/${action}`;
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({
          type: "error",
          message: data?.message ?? data?.error ?? "No se pudo ejecutar la acción.",
        });
        return;
      }
      setNotice({ type: "success", message: "Acción ejecutada." });
      await fetchRows();
    } finally {
      setActioning((prev) => ({ ...prev, [row.id]: false }));
    }
  }

  async function openReceipt(id: string) {
    setReceiptOpen(true);
    setReceiptLoading(true);
    setReceiptError(null);
    setReceiptData(null);
    try {
      const res = await fetch(`/api/treasury/movements/${id}/receipt`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReceiptError(data?.error ?? data?.message ?? "No pude cargar el receipt.");
        return;
      }
      setReceiptData(data as ReceiptData);
    } catch (e: any) {
      setReceiptError(e?.message ?? "No pude cargar el receipt.");
    } finally {
      setReceiptLoading(false);
    }
  }

  function getRowActions(row: MovementRow) {
    const statusValue = String(row.status ?? "").toUpperCase();
    const rawType = normalizeTypeValue(row.type);
    const isSlip = row.source === "deposit_slip" || Boolean(row.slipId);
    const isClp = String(row.assetCode ?? "").toUpperCase() === "CLP";
    const isClpDeposit = isClp && (rawType === "deposit" || isSlip);
    const isClpWithdraw = isClp && rawType === "withdraw";
    const movementId = resolveMovementId(row);
    const slipId = resolveSlipId(row);

    const canApproveReject =
      statusValue === "PENDING" && (isClpDeposit || (isSlip && Boolean(slipId || movementId)));
    const canMarkPaid =
      isClpWithdraw &&
      (statusValue === "APPROVED" || statusValue === "PROCESSING") &&
      row.paidOut !== true &&
      Boolean(movementId);
    const canResync = canResyncMovement(row);

    return {
      isSlip,
      canApproveReject,
      canMarkPaid,
      canResync,
    };
  }

  async function copyDetailJson() {
    if (!detailJson) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(detailJson, null, 2));
      setNotice({ type: "success", message: "JSON copiado." });
    } catch {
      setNotice({ type: "error", message: "No se pudo copiar el JSON." });
    }
  }

  async function copyReceiptJson() {
    if (!receiptData) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(receiptData, null, 2));
      setNotice({ type: "success", message: "JSON copiado." });
    } catch {
      setNotice({ type: "error", message: "No se pudo copiar el JSON." });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-neutral-400">Cava Admin</div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">Operaciones</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="k21-badge">Pendientes: {pendingCount}</div>
          <div className="k21-badge">Resultados: {resultsCount}</div>
        </div>
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

          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Tipo</label>
            <select
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">ALL</option>
              <option value="deposit">deposit</option>
              <option value="withdraw">withdraw</option>
              <option value="buy">buy</option>
              <option value="sell">sell</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Pagado</label>
            <select
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100"
              value={paidFilter}
              onChange={(e) => setPaidFilter(e.target.value)}
            >
              <option value="ALL">ALL</option>
              <option value="PAID">paidOut=true</option>
              <option value="UNPAID">paidOut=false</option>
            </select>
          </div>

          <div className="flex-1 min-w-[220px]">
            <label className="text-xs text-neutral-400">Buscar</label>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-100"
              placeholder="movementId, slipId, email o empresa"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="k21-btn-secondary mt-5"
            type="button"
            onClick={() => fetchRows()}
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
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Usuario / Empresa</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                {showPaidColumn && <th className="px-4 py-3">Pagado</th>}
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.map((row) => {
                const rowBusy = Boolean(actioning[row.id]);
                const { canApproveReject, canMarkPaid, canResync } = getRowActions(row);
                const statusLabel = String(row.status ?? "").toUpperCase() || "—";
                const primaryAmount = formatPrimaryAmount(row);

                return (
                  <tr key={row.id} className="text-neutral-200">
                    <td className="px-4 py-3 text-xs text-neutral-400">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {row.createdByEmail ?? row.userEmail ?? "—"}
                      </div>
                      <div className="text-xs text-neutral-500">{row.companyName ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-300">
                      {deriveOperationLabel(row)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span title={primaryAmount.tooltip ?? undefined}>
                        {primaryAmount.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusPill(statusLabel)}>{statusLabel}</span>
                    </td>
                    {showPaidColumn && (
                      <td className="px-4 py-3 text-xs text-neutral-300">
                        {isClpWithdrawRow(row) ? formatPaidOut(row.paidOut) : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                          disabled={rowBusy}
                          onClick={() => setSelectedId(row.id)}
                        >
                          Ver detalle
                        </button>
                        {canApproveReject && (
                          <>
                            <button
                              className="k21-btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                              disabled={rowBusy}
                              onClick={() => runAction(row, "approve")}
                            >
                              Aprobar
                            </button>
                            <button
                              className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                              disabled={rowBusy}
                              onClick={() => runAction(row, "reject")}
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {canMarkPaid && (
                          <button
                            className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                            disabled={rowBusy}
                            onClick={() => runAction(row, "paid")}
                          >
                            Marcar pagado
                          </button>
                        )}
                        {canResync && (
                          <button
                            className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                            disabled={rowBusy}
                            onClick={() => runAction(row, "resync")}
                          >
                            Resync
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && !loading && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-neutral-500"
                    colSpan={showPaidColumn ? 7 : 6}
                  >
                    No hay movimientos.
                  </td>
                </tr>
              )}
      {loading && (
        <tr>
          <td
            className="px-4 py-6 text-center text-sm text-neutral-500"
            colSpan={showPaidColumn ? 7 : 6}
          >
            Cargando...
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
{nextCursor && (
  <div className="border-t border-neutral-800 bg-neutral-950/80 px-4 py-3 text-right">
    <button
      className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
      type="button"
      disabled={loading}
      onClick={() => fetchRows({ append: true, cursor: nextCursor })}
    >
      {loading ? "Cargando..." : "Cargar más"}
    </button>
  </div>
)}
</div>

      {selectedRow && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedId(null)}
            role="button"
            tabIndex={0}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl">
            <div className="k21-card h-full overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-neutral-400">Detalle operativo</div>
                  <h2 className="text-xl font-semibold text-neutral-50">
                    {deriveOperationLabel(selectedRow)}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <span className={statusPill(resolveStatusLabel(selectedRow))}>
                      {resolveStatusLabel(selectedRow)}
                    </span>
                    <span>{formatDateTime(selectedRow.createdAt)}</span>
                  </div>
                  <div className="mt-2 text-sm text-neutral-300">
                    {selectedRow.createdByEmail ?? selectedRow.userEmail ?? "—"}
                    {selectedRow.companyName ? ` · ${selectedRow.companyName}` : ""}
                  </div>
                </div>
                <button
                  className="k21-btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => setSelectedId(null)}
                >
                  Cerrar
                </button>
              </div>

              {(() => {
                const hasFinancial =
                  Boolean(selectedRow.amount) ||
                  Boolean(selectedRow.executedPrice) ||
                  Boolean(selectedRow.executedSource);
                if (!hasFinancial) return null;

                const primaryAmount = formatPrimaryAmount(selectedRow);
                const executedPrice =
                  selectedRow.executedPrice && Number.isFinite(Number(selectedRow.executedPrice))
                    ? `$${Math.round(Number(selectedRow.executedPrice)).toLocaleString("es-CL")} CLP`
                    : null;
                const executedSource = selectedRow.executedSource ?? null;
                const feeAmount =
                  selectedRow.executedFeeAmount && Number.isFinite(Number(selectedRow.executedFeeAmount))
                    ? selectedRow.executedFeeAmount
                    : null;
                const feeCode = selectedRow.executedFeeCode ?? null;
                const quoteAmount =
                  selectedRow.executedQuoteAmount &&
                  Number.isFinite(Number(selectedRow.executedQuoteAmount))
                    ? Number(selectedRow.executedQuoteAmount)
                    : null;
                const feeAmountNumber =
                  feeAmount && Number.isFinite(Number(feeAmount)) ? Number(feeAmount) : null;
                const totalClp =
                  quoteAmount != null
                    ? feeCode === "CLP" && feeAmountNumber != null
                      ? quoteAmount + feeAmountNumber
                      : quoteAmount
                    : null;

                return (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      Resumen financiero
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-neutral-500">Monto principal</div>
                        <div className="mt-1 font-medium" title={primaryAmount.tooltip ?? undefined}>
                          {primaryAmount.label}
                        </div>
                      </div>
                      {executedPrice ? (
                        <div>
                          <div className="text-xs text-neutral-500">Precio ejecución</div>
                          <div className="mt-1 font-medium">{executedPrice}</div>
                        </div>
                      ) : null}
                      {executedSource ? (
                        <div>
                          <div className="text-xs text-neutral-500">Fuente precio</div>
                          <div className="mt-1 font-medium">{executedSource}</div>
                        </div>
                      ) : null}
                      {feeAmount ? (
                        <div>
                          <div className="text-xs text-neutral-500">Fee</div>
                          <div className="mt-1 font-medium">
                            {feeCode
                              ? String(feeCode).toUpperCase() === "USD"
                                ? formatUsdtAdmin(feeAmount)
                                : `${feeAmount} ${displayAsset(feeCode)}`
                              : feeAmount}
                          </div>
                        </div>
                      ) : null}
                      {totalClp != null ? (
                        <div>
                          <div className="text-xs text-neutral-500">Total CLP</div>
                          <div className="mt-1 font-medium">
                            ${Math.round(totalClp).toLocaleString("es-CL")} CLP
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })()}

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Estado operacional</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-neutral-500">Status</div>
                    <div className="mt-1 font-medium">{resolveStatusLabel(selectedRow)}</div>
                  </div>
                  {(() => {
                    const typeValue = String(selectedRow.type ?? "").toLowerCase();
                    const showPaid = selectedRow.assetCode === "CLP" && typeValue === "withdraw";
                    if (!showPaid) return null;
                    return (
                      <div>
                        <div className="text-xs text-neutral-500">Pagado</div>
                        <div className="mt-1 font-medium">{formatPaidOut(selectedRow.paidOut)}</div>
                      </div>
                    );
                  })()}
                  {selectedRow.approvedAt ? (
                    <div>
                      <div className="text-xs text-neutral-500">approvedAt</div>
                      <div className="mt-1 font-medium">{formatDateTime(selectedRow.approvedAt)}</div>
                    </div>
                  ) : null}
                  {selectedRow.executedAt ? (
                    <div>
                      <div className="text-xs text-neutral-500">executedAt</div>
                      <div className="mt-1 font-medium">{formatDateTime(selectedRow.executedAt)}</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-500">Acciones realizadas</div>
                <div className="mt-3 text-sm text-neutral-200">
                  {(() => {
                    const statusValue = String(selectedRow.status ?? "").toUpperCase();
                    if (statusValue === "APPROVED") {
                      if (selectedRow.approvedAt && selectedRow.approvedByUserId) {
                        return "Aprobado por admin";
                      }
                      if (selectedRow.approvedAt) return "Aprobado automáticamente";
                      return "Aprobado";
                    }
                    if (statusValue === "REJECTED") return "Rechazado";
                    if (statusValue === "PROCESSING") return "En proceso";
                    if (statusValue === "PENDING") return "Pendiente";
                    return statusValue || "—";
                  })()}
                </div>
                {(selectedRow.externalVenue || selectedRow.externalOrderId) && (
                  <details className="mt-3 rounded-xl border border-white/10 bg-neutral-950/60 p-3 text-xs text-neutral-300">
                    <summary className="cursor-pointer text-neutral-400">Metadatos externos</summary>
                    <div className="mt-2 grid gap-2">
                      {selectedRow.externalVenue ? (
                        <div>Venue: {selectedRow.externalVenue}</div>
                      ) : null}
                      {selectedRow.externalOrderId ? (
                        <div>Order ID: {selectedRow.externalOrderId}</div>
                      ) : null}
                    </div>
                  </details>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(() => {
                  const movementId = resolveMovementId(selectedRow);
                  if (!movementId) return null;
                  return (
                    <button
                      className="k21-btn-secondary px-3 py-1.5 text-xs"
                      onClick={() => openReceipt(movementId)}
                    >
                      Ver receipt
                    </button>
                  );
                })()}

                {(() => {
                  const slipPath = selectedRow.slipPath ?? selectedRow.attachmentUrl ?? null;
                  if (!slipPath) return null;
                  return (
                    <button
                      className="k21-btn-secondary px-3 py-1.5 text-xs"
                      onClick={() => openSlip(slipPath)}
                    >
                      Ver comprobante
                    </button>
                  );
                })()}
              </div>

              <div className="mt-6">
                <div className="text-xs text-neutral-400 mb-2">Acciones</div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const rowBusy = Boolean(actioning[selectedRow.id]);
                    const { canApproveReject, canMarkPaid, canResync } = getRowActions(selectedRow);
                    return (
                      <>
                        {canApproveReject && (
                          <>
                            <button
                              className="k21-btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                              disabled={rowBusy}
                              onClick={() => runAction(selectedRow, "approve")}
                            >
                              Aprobar
                            </button>
                            <button
                              className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                              disabled={rowBusy}
                              onClick={() => runAction(selectedRow, "reject")}
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {canMarkPaid && (
                          <button
                            className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                            disabled={rowBusy}
                            onClick={() => runAction(selectedRow, "paid")}
                          >
                            Marcar pagado
                          </button>
                        )}
                        {canResync && (
                          <button
                            className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                            disabled={rowBusy}
                            onClick={() => runAction(selectedRow, "resync")}
                          >
                            Resync
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-6">
                <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <summary className="cursor-pointer text-xs uppercase tracking-wide text-neutral-500">
                    Bloque técnico
                  </summary>
                  <div className="mt-3">
                    <pre className="max-h-64 overflow-auto rounded-xl bg-neutral-950 p-3 text-xs text-neutral-300">
                      {JSON.stringify(detailJson, null, 2)}
                    </pre>
                    <button
                      className="k21-btn-secondary mt-3 px-3 py-1.5 text-xs"
                      onClick={copyDetailJson}
                    >
                      Copiar JSON
                    </button>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

      {receiptOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setReceiptOpen(false)}
            role="button"
            tabIndex={0}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-xl">
            <div className="k21-card h-full overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-neutral-400">Receipt</div>
                  <h2 className="text-xl font-semibold text-neutral-50">Receipt</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    {receiptData?.status ? (
                      <span className={statusPill(String(receiptData.status))}>
                        {String(receiptData.status).toUpperCase()}
                      </span>
                    ) : null}
                    <span className="break-all">
                      {receiptData?.movementId ?? "—"}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-neutral-400">
                    createdAt: {formatDateTime(receiptData?.createdAt)} · executedAt:{" "}
                    {formatDateTime(receiptData?.executedAt)}
                  </div>
                </div>
                <button
                  className="k21-btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => setReceiptOpen(false)}
                >
                  Cerrar
                </button>
              </div>

              {receiptLoading && (
                <div className="mt-6 text-sm text-neutral-400">Cargando receipt...</div>
              )}

              {receiptError && (
                <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {receiptError}
                </div>
              )}

              {receiptData && !receiptLoading && !receiptError && (
                <>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      Trade summary
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-neutral-500">Side</div>
                        <div className="mt-1 font-medium">
                          {receiptData.side ?? "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Par</div>
                        <div className="mt-1 font-medium">
                          {displayAsset(receiptData.baseAsset)} /{" "}
                          {displayAsset(receiptData.quoteAsset)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Qty</div>
                        <div className="mt-1 font-medium">
                          {formatAssetValue(
                            receiptData.qty ?? null,
                            receiptData.baseAsset ?? "BTC",
                            String(receiptData.baseAsset ?? "").toUpperCase() === "BTC" ? 8 : 6
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Price</div>
                        <div className="mt-1 font-medium">
                          {formatClpValue(receiptData.price ?? null)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      Financials
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      {receiptData.grossAmount ? (
                        <div>
                          <div className="text-xs text-neutral-500">Gross</div>
                          <div className="mt-1 font-medium">
                            {receiptData.side === "sell"
                              ? formatAssetValue(
                                  receiptData.grossAmount,
                                  receiptData.baseAsset ?? "BTC",
                                  String(receiptData.baseAsset ?? "").toUpperCase() === "BTC" ? 8 : 6
                                )
                              : formatClpValue(receiptData.grossAmount)}
                          </div>
                        </div>
                      ) : null}
                      {formatFeePercent(receiptData.feePercent) ? (
                        <div>
                          <div className="text-xs text-neutral-500">Fee %</div>
                          <div className="mt-1 font-medium">
                            {formatFeePercent(receiptData.feePercent)}
                          </div>
                        </div>
                      ) : null}
                      {receiptData.feeAmount ? (
                        <div>
                          <div className="text-xs text-neutral-500">Fee</div>
                          <div className="mt-1 font-medium">
                            {receiptData.feeCurrency === "CLP"
                              ? formatClpValue(receiptData.feeAmount)
                              : formatAssetValue(
                                  receiptData.feeAmount,
                                  receiptData.feeCurrency ?? receiptData.baseAsset ?? "BTC",
                                  receiptData.feeCurrency === "BTC" ? 8 : 6
                                )}
                          </div>
                        </div>
                      ) : null}
                      {receiptData.netAmount ? (
                        <div>
                          <div className="text-xs text-neutral-500">Neto</div>
                          <div className="mt-1 font-medium">
                            {receiptData.side === "sell"
                              ? formatAssetValue(
                                  receiptData.netAmount,
                                  receiptData.baseAsset ?? "BTC",
                                  String(receiptData.baseAsset ?? "").toUpperCase() === "BTC" ? 8 : 6
                                )
                              : formatClpValue(receiptData.netAmount)}
                          </div>
                        </div>
                      ) : null}
                      {(receiptData.message || receiptData.internalReason) && (
                        <div className="col-span-2">
                          <div className="text-xs text-neutral-500">Notas</div>
                          <div className="mt-1 text-sm text-neutral-300">
                            {[receiptData.message, receiptData.internalReason]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {(receiptData.externalVenue || receiptData.externalOrderId) && (
                    <details className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <summary className="cursor-pointer text-xs uppercase tracking-wide text-neutral-500">
                        External
                      </summary>
                      <div className="mt-3 grid gap-2 text-sm text-neutral-200">
                        {receiptData.externalVenue ? (
                          <div>Venue: {receiptData.externalVenue}</div>
                        ) : null}
                        {receiptData.externalOrderId ? (
                          <div>Order ID: {receiptData.externalOrderId}</div>
                        ) : null}
                      </div>
                    </details>
                  )}

                  <details className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <summary className="cursor-pointer text-xs uppercase tracking-wide text-neutral-500">
                      Technical
                    </summary>
                    <div className="mt-3">
                      <pre className="max-h-64 overflow-auto rounded-xl bg-neutral-950 p-3 text-xs text-neutral-300">
                        {JSON.stringify(receiptData, null, 2)}
                      </pre>
                      <button
                        className="k21-btn-secondary mt-3 px-3 py-1.5 text-xs"
                        onClick={copyReceiptJson}
                      >
                        Copiar JSON
                      </button>
                    </div>
                  </details>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
