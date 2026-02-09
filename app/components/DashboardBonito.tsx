// app/components/DashboardBonito.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import MovementForm from "@/app/treasury/_components/MovementForm";
import BtcClpChart from "@/components/landing/BtcClpChart";
import { displayAsset, formatUsdtClient } from "@/lib/formatUsdt";
import type { TreasuryMovementStatus } from "@prisma/client";
import {
  CreditCard,
  BarChart3,
  ArrowLeftRight,
  Activity,
  SlidersHorizontal,
} from "lucide-react";

type AssetCode = "BTC" | "CLP" | "USD";
type Mode = "buy" | "sell" | "adjust";
type QuoteCurrency = "CLP" | "BTC" | "USDT";
type MovementStatus = TreasuryMovementStatus;

type Movement = {
  id: string;
  assetCode: AssetCode;
  type: "deposit" | "withdraw" | "adjust";
  amount: string;
  executedQuoteAmount?: string | null; // 👈 NUEVO
  attachmentUrl?: string | null;
  createdAt: string; // ISO
  status: MovementStatus;
};

type OnboardingStatus = {
  hasProfile: boolean;
  termsAccepted: boolean;
  canOperate: boolean;
};

export default function DashboardBonito({
  activeCompanyId = "demo-company",
  activeCompanyName = "Kapa 21 SpA",
  balances,
  movements = [],
  isAdmin = false,
  onboarding = { hasProfile: true, termsAccepted: true, canOperate: true },
  // hook opcional (si no lo pasas, navegamos con router.push)
  onGo,
  hrefs,
}: {
  activeCompanyId?: string;
  activeCompanyName?: string;
  balances: Record<AssetCode, string>;
  movements?: Movement[];
  isAdmin?: boolean;
  onboarding?: OnboardingStatus;
  onGo?: (href: string) => void;
  hrefs?: Partial<{
    buyCLP: string;
    sellCLP: string;
    buyBTC: string;
    sellBTC: string;
    buyUSD: string;
    sellUSD: string;
    withdrawCLP: string;
    depositCLP: string;
    activity: string;
  }>;
}) {
  const router = useRouter();

  const [quote, setQuote] = useState<QuoteCurrency>("CLP");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [btcUnit, setBtcUnit] = useState<"BTC" | "SATS">("BTC");

  // ✅ balances/movements "vivos" (se actualizan sin refresh)
  const [liveBalances, setLiveBalances] = useState(balances);
  const [liveMovements, setLiveMovements] = useState(movements);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachmentBusyId, setAttachmentBusyId] = useState<string | null>(null);

  // Si cambian props por navegación, resincroniza
  useEffect(() => {
    setLiveBalances(balances);
  }, [balances]);

  useEffect(() => {
    setLiveMovements(movements);
  }, [movements]);

  const [movementModal, setMovementModal] = useState<{
    open: boolean;
    mode: Mode;
    assetCode: AssetCode;
  } | null>(null);

  // ✅ HOTFIX producción: refresca data server-side sin F5 (pausa si hay modal o trade activo)
  useEffect(() => {
    if (movementModal?.open) return;
    const id = setInterval(() => {
      router.refresh();
    }, 10_000); // 10s (cámbialo a 5_000 si quieres)

    return () => clearInterval(id);
  }, [router, movementModal?.open]);

  function openMovementModalFromHref(href: string) {
    // Solo interceptamos el flujo de /treasury/new-movement
    if (typeof window === "undefined") return false;

    const url = new URL(href, window.location.origin);
    if (url.pathname !== "/treasury/new-movement") return false;

    const mode = (url.searchParams.get("mode") as Mode) || "buy";
    const assetCode = (url.searchParams.get("assetCode") as AssetCode) || "BTC";

    setMovementModal({ open: true, mode, assetCode });
    return true;
  }

  function n(amountStr: string) {
    const v = Number(String(amountStr).replace(",", "."));
    return Number.isFinite(v) ? v : 0;
  }

  function formatCLP(v: number) {
    return `$${Math.round(v).toLocaleString("es-CL")} CLP`;
  }
  function formatBTC(v: number) {
    return `${v.toLocaleString("en-US", { maximumFractionDigits: 8 })} BTC`;
  }

  const clp = n(liveBalances.CLP ?? "0");
  const btc = n(liveBalances.BTC ?? "0");
  const usd = n(liveBalances.USD ?? "0");

  // Spot prices (Buda public API). Fallback demo while loading/error.
  const [btcClpSpot, setBtcClpSpot] = useState<number>(80_736_201);
  const [usdtClpSpot, setUsdtClpSpot] = useState<number>(897);
  const [spotError, setSpotError] = useState<string | null>(null);


async function fetchTicker(marketId: "btc-clp" | "usdt-clp") {
  const res = await fetch(`/api/buda/ticker?marketId=${marketId}`, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
  });
  if (!res.ok) return null;
  return res.json();
}

useEffect(() => {
  let alive = true;

  const loadPrices = async () => {
    try {
      const [btc, usdt] = await Promise.all([
        fetchTicker("btc-clp"),
        fetchTicker("usdt-clp"),
      ]);

      if (!alive) return;

      setBtcClpSpot(Number(btc?.last_price) || 80_736_201);
      setUsdtClpSpot(Number(usdt?.last_price) || 897);
      setSpotError(null);
    } catch (e: any) {
      if (!alive) return;
      setSpotError(e?.message ?? "Error cargando precios");
      // Mantén el último valor, no lo botes a null (para que no “salte” la UI)
    }
  };

  loadPrices();
  const intervalId = setInterval(loadPrices, 15000);

  return () => {
    alive = false;
    clearInterval(intervalId);
  };
}, []);

// ✅ Polling de balances (y movimientos) para reflejar aprobaciones sin refresh
useEffect(() => {
  let alive = true;

  const loadSummary = async () => {
    try {
      const res = await fetch("/api/treasury/summary", {
        cache: "no-store",
        headers: { "cache-control": "no-cache" },
      });
      const data = await res.json().catch(() => ({}));
      if (!alive) return;

      if (res.ok && data?.ok) {
        if (data?.balances) setLiveBalances(data.balances);
        if (Array.isArray(data?.movements)) setLiveMovements(data.movements);
      }
    } catch {
      // silencio
    }
  };

  loadSummary();
  const id = setInterval(loadSummary, 8000);

  return () => {
    alive = false;
    clearInterval(id);
  };
}, []);

  const total = useMemo(() => {
    const totalCLP = clp + usd * usdtClpSpot + btc * btcClpSpot;
    const totalUSDT = clp / usdtClpSpot + usd + (btc * btcClpSpot) / usdtClpSpot;
    const totalBTC = btc + clp / btcClpSpot + (usd * usdtClpSpot) / btcClpSpot;

    if (quote === "CLP") return formatCLP(totalCLP);
    if (quote === "USDT") return formatUsdtClient(totalUSDT);
    return formatBTC(totalBTC);
  }, [clp, btc, usd, quote, btcClpSpot, usdtClpSpot]);

  function canClick() {
    return Boolean(onboarding?.canOperate);
  }

  function go(href?: string) {
    if (!href) return;
  
    // 1) si es /treasury/new-movement => abrir modal y cortar navegación
    if (openMovementModalFromHref(href)) return;
  
    // 2) si no, navegar normal
    if (onGo) return onGo(href);
    router.push(href);
  }

  async function openAttachment(movementId: string, path: string) {
    if (!path) return;
    if (path.startsWith("/uploads/")) {
      setAttachmentError("Comprobante no disponible (archivo legacy).");
      return;
    }

    setAttachmentError(null);
    setAttachmentBusyId(movementId);
    try {
      const res = await fetch(
        `/api/storage/signed-url?bucket=deposit-slips&path=${encodeURIComponent(path)}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.signedUrl) {
        setAttachmentError(data?.error ?? "No pude abrir el comprobante.");
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setAttachmentError(e?.message ?? "No pude abrir el comprobante.");
    } finally {
      setAttachmentBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        {/* HEADER */}
        <header className="mb-10 py-4">
          <div className="flex items-center justify-between gap-6 min-h-[112px]">
            {/* Left: brand (logo real) */}
            <a href="#" className="group flex items-center shrink-0 active:opacity-80">
              {/* símbolo solo en mobile */}
              <img
                src="/brand/k21-mark-white.svg"
                alt="K21"
                className="h-11 w-11 md:hidden transition-opacity duration-150 group-hover:opacity-90"
              />

              {/* lockup en desktop */}
              <img
                src="/brand/k21-lockup-white.svg"
                alt="K21"
                className="hidden md:block h-[96px] lg:h-[112px] w-auto transition-opacity duration-150 group-hover:opacity-90"
              />
            </a>

            {/* Center: nav */}
            <nav className="hidden md:flex flex-1 items-center justify-center gap-2">
              {[
                { label: "Crédito", icon: CreditCard, href: "#" },
                { label: "Reportes", icon: BarChart3, href: "#" },
                { label: "Transferencias", icon: ArrowLeftRight, href: "#" },
                { label: "Actividad", icon: Activity, href: hrefs?.activity ?? "#" },
                { label: "Ajustes", icon: SlidersHorizontal, href: "#" },
              ].map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  className="k21-btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
                >
                  <Icon size={16} className="text-neutral-400" />
                  <span>{label}</span>
                </a>
              ))}
            </nav>

            {/* Right: active company + avatar */}
            <div className="relative flex items-center gap-3 shrink-0">
              <div className="hidden sm:block text-right">
                <div className="text-xs text-neutral-500">Cuenta activa</div>
                <div className="text-xs text-neutral-300">{activeCompanyName}</div>
              </div>

              <button
                type="button"
                className="h-10 w-10 rounded-full border flex items-center justify-center hover:opacity-90 active:opacity-80"
                style={{
                  borderColor: "var(--k21-orange)",
                  backgroundColor: "rgba(10, 10, 10, 1)",
                }}
                onClick={() => setAccountMenuOpen((v) => !v)}
                aria-label="Abrir menú de cuenta"
                title="Cuenta"
              >
                <img
                  src="/brand/k21-mark-white.svg"
                  alt=""
                  className="h-5 w-5"
                />
              </button>

              {accountMenuOpen && (
                <>
                  {/* backdrop para cerrar al click afuera */}
                  <button
                    type="button"
                    className="fixed inset-0 z-40"
                    onClick={() => setAccountMenuOpen(false)}
                    aria-label="Cerrar menú"
                  />

                  <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-white/10 bg-neutral-950 shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="text-xs text-neutral-500">Cuenta activa</div>
                      <div className="text-sm text-neutral-200 mt-0.5">{activeCompanyName}</div>
                    </div>

                    <div className="p-2 space-y-1">
                      {/* Crear empresa (placeholder) */}
                      <button
                        type="button"
                        disabled
                        className="w-full text-left rounded-xl px-3 py-2 text-sm text-neutral-500 cursor-not-allowed opacity-70"
                        title="Próximamente"
                      >
                        Crear empresa
                      </button>

                      {/* Divider */}
                      <div className="my-1 h-px bg-white/10" />

                      {/* Logout */}
                      <button
                        type="button"
                        className="w-full text-left rounded-xl px-3 py-2 text-sm text-neutral-200 hover:bg-white/5"
                        onClick={() => signOut({ callbackUrl: "/" })}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* MAIN GRID */}
        <main className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <section className="lg:col-span-1 space-y-6">
            {/* CLP CARD */}
            <div className="k21-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wide">CLP</div>
                  <div className="text-sm font-medium text-neutral-200">Pesos</div>
                </div>
              </div>

              <div className="mt-4 text-2xl font-semibold tracking-tight">
                {formatCLP(clp)}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  className={canClick() ? "k21-btn-primary w-full h-10" : "k21-btn-disabled w-full h-10"}
                  title={canClick() ? "" : "Completa onboarding para operar"}
                  onClick={() => go(hrefs?.depositCLP)}
                >
                  Depositar
                </button>
                <button
                  className={canClick() ? "k21-btn-secondary w-full h-10" : "k21-btn-disabled w-full h-10"}
                  title={canClick() ? "" : "Completa onboarding para operar"}
                  onClick={() => go(hrefs?.withdrawCLP)}
                >
                  Retirar
                </button>
              </div>
            </div>

            {/* BTC CARD */}
            <div className="k21-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-neutral-500">BTC</div>
                <div className="text-sm font-medium text-neutral-100">Bitcoin</div>
              </div>

              <button
                className="k21-btn-secondary text-xs"
                onClick={() => setBtcUnit((u) => (u === "BTC" ? "SATS" : "BTC"))}
              >
                {btcUnit === "BTC" ? "Ver en sats" : "Ver en BTC"}
              </button>
            </div>

            <div className="mt-4 text-2xl font-semibold tracking-tight">
              {btcUnit === "BTC"
                ? formatBTC(btc)
                : `${Math.round(btc * 100_000_000).toLocaleString("es-CL")} sats`}
            </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  className={canClick() ? "k21-btn-primary w-full h-10" : "k21-btn-disabled w-full h-10"}
                  title={canClick() ? "" : "Completa onboarding para operar"}
                  onClick={() => go(hrefs?.buyBTC)}
                >
                  Comprar (BTC)
                </button>
                <button
                  className={canClick() ? "k21-btn-secondary w-full h-10" : "k21-btn-disabled w-full h-10"}
                  title={canClick() ? "" : "Completa onboarding para operar"}
                  onClick={() => go(hrefs?.sellBTC)}
                >
                  Vender (BTC)
                </button>
              </div>

              <div className="mt-3 text-xs text-neutral-500">
                Toggle BTC/sats
              </div>
            </div>

            {/* USDT CARD */}
            <div className="k21-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-neutral-500">USDT</div>
                  <div className="text-sm font-medium text-neutral-100">Dólares</div>
                </div>
              </div>

              <div className="mt-4 text-2xl font-semibold tracking-tight">
                {formatUsdtClient(usd)}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  className={canClick() ? "k21-btn-primary w-full h-10" : "k21-btn-disabled w-full h-10"}
                  title={canClick() ? "" : "Completa onboarding para operar"}
                  onClick={() => go(hrefs?.buyUSD)}
                >
                  Comprar (USDT)
                </button>
                <button
                  className={canClick() ? "k21-btn-secondary w-full h-10" : "k21-btn-disabled w-full h-10"}
                  title={canClick() ? "" : "Completa onboarding para operar"}
                  onClick={() => go(hrefs?.sellUSD)}
                >
                  Vender (USDT)
                </button>
              </div>
            </div>

            {/* TOTAL VALUE */}
            <div className="k21-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-neutral-400">Valor total</p>
                  <div className="mt-2 text-3xl font-semibold tracking-tight">
                    {total}
                  </div>

                  <div className="mt-3 flex gap-2">
                    {(["CLP", "BTC", "USDT"] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuote(q)}
                        className={quote === q ? "k21-toggle-active" : "k21-toggle"}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <section className="lg:col-span-2 space-y-6">
            {/* SPOT PRICES */}
            <div className="k21-card p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm text-neutral-400">Precios spot</h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="k21-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-neutral-500">BTC/CLP</div>
                    <span className="text-[11px] text-neutral-500">Fuente: Buda</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {formatCLP(btcClpSpot)}
                  </div>
                </div>

                <div className="k21-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-neutral-500">USDT/CLP</div>
                    <span className="text-[11px] text-neutral-500">Fuente: Buda</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {formatCLP(usdtClpSpot)}
                  </div>
                </div>
              </div>
            </div>

            <BtcClpChart />

            {/* LAST TRANSACTIONS */}
            <div className="k21-card p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm text-neutral-400">Últimas transacciones</h2>
                <button
                  type="button"
                  className="k21-btn-secondary text-xs !px-3 !py-2 h-10"
                  onClick={() => go(hrefs?.activity)}
                >
                  Ver todo
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                {attachmentError && (
                  <div className="mb-3 text-xs text-red-300">{attachmentError}</div>
                )}
                <table className="w-full text-sm">
                  <thead className="text-neutral-500 border-b border-white/10">
                    <tr>
                      <th className="py-2 text-left">Fecha</th>
                      <th className="py-2 text-left">Tipo</th>
                      <th className="py-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(liveMovements.length ? liveMovements.slice(0, 3) : []).map((m) => (
                      <tr key={m.id} className="border-b border-white/10 last:border-0">
                        <td className="py-3">
                          {new Date(m.createdAt).toLocaleString("es-CL")}
                        </td>
                        <td className="py-3">
                          <span className="k21-pill border-white/10 bg-white/5 text-neutral-200">
                            {m.type === "deposit" ? "Compra" : m.type === "withdraw" ? "Venta" : "Ajuste"}{" "}
                            {displayAsset(m.assetCode)}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-neutral-200">
                          {(() => {
                            const amt =
                              m.assetCode === "CLP" && m.executedQuoteAmount != null
                                ? m.executedQuoteAmount
                                : m.amount;

                            return m.assetCode === "CLP"
                              ? formatCLP(n(amt))
                              : m.assetCode === "USD"
                              ? formatUsdtClient(amt)
                              : formatBTC(n(amt));
                          })()}
                          {m.attachmentUrl ? (
                            <div className="mt-1">
                              <button
                                type="button"
                                onClick={() => openAttachment(m.id, m.attachmentUrl as string)}
                                disabled={attachmentBusyId === m.id}
                                className="text-[11px] text-neutral-400 underline hover:text-neutral-200 disabled:opacity-50"
                                title="Abrir comprobante"
                              >
                                {attachmentBusyId === m.id ? "Abriendo…" : "Ver comprobante"}
                              </button>
                            </div>
                          ) : null}
                        </td>
                        
                      </tr>
                    ))}

                    {!liveMovements.length && (
                      <tr className="border-b border-white/10 last:border-0">
                        <td colSpan={3} className="py-6 text-center text-sm text-neutral-500">
                          Aún no hay movimientos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nota admin (sin ruido) */}
            {isAdmin ? null : null}
          </section>
        </main>
      </div>
      {/* MODAL: New Movement */}
        {movementModal?.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* backdrop */}
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              onClick={() => setMovementModal(null)}
              aria-label="Cerrar"
            />

            {/* panel */}
            <div className="relative z-10 w-full max-w-lg">
              <div className="k21-card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div className="text-sm text-neutral-300">Nueva operación</div>
                  <button
                    type="button"
                    className="k21-btn-secondary h-9 !px-3 !py-2 text-xs"
                    onClick={() => setMovementModal(null)}
                  >
                    Cerrar
                  </button>
                </div>

                <MovementForm
                  mode={movementModal.mode}
                  assetCode={movementModal.assetCode}
                  variant="modal"
                  onClose={() => setMovementModal(null)}
                />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
