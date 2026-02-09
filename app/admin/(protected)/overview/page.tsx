"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { displayAsset, formatUsdtAdmin } from "@/lib/formatUsdt";

type RangeKey = "7d" | "30d" | "90d" | "all";

type OverviewResponse = {
  ok: boolean;
  systemWallet: {
    available: boolean;
    balances?: Record<string, string>;
    note?: string;
  };
  fees: {
    range: RangeKey;
    totalsByCurrency: Record<string, string>;
    bySide: Record<string, Record<string, string>>;
    byBaseAsset: Record<string, Record<string, string>>;
  };
  recentMovements: Array<{
    id: string;
    createdAt: string;
    executedAt?: string | null;
    status: string;
    side?: string | null;
    type?: string | null;
    assetCode?: string | null;
    baseAsset?: string | null;
    quoteAsset?: string | null;
    feeAmount?: string | null;
    feeCurrency?: string | null;
  }>;
};

type ResyncState = {
  loading: boolean;
  payload?: any;
  ok?: boolean;
  at?: string | null;
  error?: string | null;
};

const RANGES: RangeKey[] = ["7d", "30d", "90d", "all"];

function parseNumberLike(input: string) {
  return Number(String(input).replace(",", "."));
}

function formatClp(value: string) {
  const n = parseNumberLike(value);
  if (!Number.isFinite(n)) return `${value} CLP`;
  return `$${Math.round(n).toLocaleString("es-CL")} CLP`;
}

function formatBtc(value: string) {
  const n = parseNumberLike(value);
  if (!Number.isFinite(n)) return `${value} BTC`;
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 8, maximumFractionDigits: 8 })} BTC`;
}

function formatAssetAmount(asset: string | null | undefined, value: string | null | undefined) {
  if (!value) return "—";
  const code = String(asset ?? "").toUpperCase();
  if (code === "USD") return formatUsdtAdmin(value);
  if (code === "CLP") return formatClp(value);
  if (code === "BTC") return formatBtc(value);
  if (!code) return value;
  return `${value} ${displayAsset(code)}`;
}

function formatFeeAmount(value: string | null | undefined, currency: string | null | undefined) {
  if (!value) return "—";
  const code = String(currency ?? "").toUpperCase();
  if (code === "USD") return formatUsdtAdmin(value);
  if (code === "CLP") return formatClp(value);
  if (code === "BTC") return formatBtc(value);
  if (!code) return value;
  return `${value} ${displayAsset(code)}`;
}

function renderTotalsLine(map: Record<string, string> | undefined) {
  const entries = Object.entries(map ?? {});
  if (!entries.length) return "—";
  const sorted = entries.sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([currency, amount]) => formatFeeAmount(amount, currency)).join(" · ");
}

export default function AdminOverviewPage() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resync, setResync] = useState<ResyncState>({ loading: false });

  const systemBalances = useMemo(() => {
    const entries = Object.entries(data?.systemWallet?.balances ?? {});
    const order = { CLP: 0, BTC: 1, USD: 2 } as Record<string, number>;
    return entries.sort(([a], [b]) => (order[a] ?? 99) - (order[b] ?? 99));
  }, [data?.systemWallet?.balances]);

  async function fetchOverview(selectedRange: RangeKey) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/overview?range=${selectedRange}`, { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as OverviewResponse;
      if (!res.ok || !json?.ok) {
        setError((json as any)?.message ?? (json as any)?.error ?? "Error cargando overview");
        setData(null);
        return;
      }
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando overview");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleResync() {
    setResync({ loading: true });
    try {
      const res = await fetch("/api/admin/system-wallet/resync", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      const ok = res.ok && Boolean(json?.ok);
      setResync({
        loading: false,
        payload: json,
        ok,
        at: json?.at ?? null,
        error: ok ? null : json?.error ?? json?.message ?? "Error en resync",
      });
      if (ok) await fetchOverview(range);
    } catch (e: any) {
      setResync({ loading: false, ok: false, error: e?.message ?? "Error en resync" });
    }
  }

  useEffect(() => {
    void fetchOverview(range);
  }, [range]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="k21-card p-6">
        <div className="text-sm text-white/60">Cava Admin</div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Overview</h1>
        <p className="mt-2 text-sm text-white/60">Panel general de caja, ingresos y actividad.</p>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6">
        <section className="k21-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">System Wallet</div>
              <h2 className="mt-1 text-lg font-semibold">Balances</h2>
            </div>
            <button
              type="button"
              className="k21-btn-secondary px-3 py-1.5 text-xs"
              onClick={handleResync}
              disabled={resync.loading}
            >
              {resync.loading ? "Resync..." : "Resync System Wallet"}
            </button>
          </div>

          {loading && !data ? (
            <div className="mt-4 text-sm text-neutral-500">Cargando...</div>
          ) : data?.systemWallet?.available ? (
            <div className="mt-4 grid gap-2">
              {systemBalances.length ? (
                systemBalances.map(([asset, amount]) => (
                  <div key={asset} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">{displayAsset(asset)}</span>
                    <span className="font-medium text-neutral-100">
                      {formatAssetAmount(asset, amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-neutral-500">Sin balances disponibles.</div>
              )}
            </div>
          ) : (
            <div className="mt-4 text-sm text-amber-300">
              System Wallet DB view no disponible (sin entidad explícita).
            </div>
          )}

          {resync.payload && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-neutral-300">
              <div>
                Último resync: {resync.at ?? "—"} · {resync.ok ? "OK" : "ERROR"}
              </div>
              {resync.error && <div className="mt-1 text-red-300">{resync.error}</div>}
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] text-neutral-400">
                {JSON.stringify(resync.payload, null, 2)}
              </pre>
            </div>
          )}
        </section>

        <section className="k21-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Ingresos</div>
              <h2 className="mt-1 text-lg font-semibold">Fees</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={
                    r === range
                      ? "k21-btn-primary px-3 py-1.5 text-xs"
                      : "k21-btn-secondary px-3 py-1.5 text-xs"
                  }
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Totales por moneda</div>
              <div className="mt-2 text-sm text-neutral-200">
                {renderTotalsLine(data?.fees?.totalsByCurrency)}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Por side</div>
              <div className="mt-2 grid gap-2 text-sm text-neutral-200">
                {Object.entries(data?.fees?.bySide ?? {}).length ? (
                  Object.entries(data?.fees?.bySide ?? {}).map(([side, totals]) => (
                    <div key={side} className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <div className="text-xs text-neutral-400">{side}</div>
                      <div className="mt-1">{renderTotalsLine(totals)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-neutral-500">—</div>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Por asset base</div>
              <div className="mt-2 grid gap-2 text-sm text-neutral-200">
                {Object.entries(data?.fees?.byBaseAsset ?? {}).length ? (
                  Object.entries(data?.fees?.byBaseAsset ?? {}).map(([asset, totals]) => (
                    <div key={asset} className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <div className="text-xs text-neutral-400">{displayAsset(asset)}</div>
                      <div className="mt-1">{renderTotalsLine(totals)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-neutral-500">—</div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="k21-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">Movimientos recientes</div>
              <h2 className="mt-1 text-lg font-semibold">Últimos 20</h2>
            </div>
            <Link href="/admin/ops" className="k21-btn-secondary px-3 py-1.5 text-xs">
              Ir a Ops
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-neutral-500 border-b border-neutral-800">
                <tr>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Side/Tipo</th>
                  <th className="py-2 pr-4">Asset</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {(data?.recentMovements ?? []).map((row) => (
                  <tr key={row.id} className="text-neutral-200">
                    <td className="py-2 pr-4 font-mono text-xs text-neutral-400">{row.id}</td>
                    <td className="py-2 pr-4 text-xs text-neutral-400">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString("es-CL") : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {(row.side ?? row.type ?? "—").toString()}
                    </td>
                    <td className="py-2 pr-4">
                      {displayAsset(row.baseAsset ?? row.assetCode ?? "")}
                    </td>
                    <td className="py-2 pr-4">{row.status}</td>
                    <td className="py-2">
                      {row.feeAmount && row.feeCurrency
                        ? formatFeeAmount(row.feeAmount, row.feeCurrency)
                        : "—"}
                    </td>
                  </tr>
                ))}
                {!loading && !(data?.recentMovements ?? []).length && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-sm text-neutral-500">
                      Sin movimientos recientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
