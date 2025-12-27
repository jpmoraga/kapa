"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { TreasuryMovementStatus } from "@prisma/client";


type Unit = "BTC" | "sats";
type AssetCode = "BTC" | "CLP" | "USD";
type MovementStatus = TreasuryMovementStatus;

type Movement = {
  id: string;
  assetCode: AssetCode;
  type: "deposit" | "withdraw" | "adjust";
  amount: string;
  note: string | null;
  createdAt: string;
  status: MovementStatus;
  executedPrice?: string | null;
  executedQuoteCode?: AssetCode | null;
  executedSource?: string | null;
  executedAt?: string | null;
};

type PendingMovement = {
  id: string;
  assetCode: AssetCode;
  type: string;
  amount: string;
  note: string | null;
  createdAt: string;
  createdByUserId?: string | null;
  attachmentUrl?: string | null;
};

type QuoteCurrency = "CLP" | "USDT" | "BTC";

const SATS_PER_BTC = 100_000_000;

function labelType(t: string) {
  return t === "deposit" ? "Compra" : t === "withdraw" ? "Venta" : "Ajuste";
}
function signForType(t: string) {
  return t === "withdraw" ? "-" : "+";
}
function badgeClass(t: string) {
  if (t === "withdraw") return "bg-red-500/10 text-red-400 border-red-500/20";
  if (t === "deposit") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
}

function uiAsset(code: AssetCode) {
  return code === "USD" ? "USDT" : code;
}

function uiAssetLabel(code: AssetCode) {
  if (code === "BTC") return "Bitcoin";
  if (code === "CLP") return "Pesos";
  return "Dólares";
}

function statusPill(status: MovementStatus) {
  if (status === "APPROVED") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (status === "REJECTED") return "bg-red-500/10 text-red-300 border-red-500/20";
  return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
}

function statusLabel(status: MovementStatus) {
  if (status === "APPROVED") return "Aprobado";
  if (status === "REJECTED") return "Rechazado";
  return "Operación pendiente";
}

function formatBTC(amountStr: string, unit: Unit) {
  const n = Number(String(amountStr).replace(",", "."));
  if (!Number.isFinite(n)) return unit === "BTC" ? "0 BTC" : "0 sats";
  if (unit === "BTC") return `${n} BTC`;
  const sats = Math.round(n * SATS_PER_BTC);
  return `${sats.toLocaleString("es-CL")} sats`;
}

function formatCLP(n: number) {
  if (!Number.isFinite(n)) return "$0 CLP";
  return `$${Math.round(n).toLocaleString("es-CL")} CLP`;
}

function formatUSD(n: number) {
  if (!Number.isFinite(n)) return "$0.00 USD";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

function formatFiat(amountStr: string, code: "CLP" | "USD") {
  const n = Number(String(amountStr).replace(",", "."));
  if (!Number.isFinite(n)) return code === "CLP" ? "$0 CLP" : "$0.00 USD";
  if (code === "CLP") return formatCLP(n);
  return formatUSD(n);
}

type PriceInfo = {
  price: number | null;
  source: string | null;
  cached: boolean;
  stale: boolean;
};

async function fetchPriceInfo(pair: "BTC_CLP" | "USDT_CLP"): Promise<PriceInfo> {
  try {
    const res = await fetch(`/api/prices/current?pair=${pair}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { price: null, source: null, cached: false, stale: false };

    const p = Number(json?.price);
    return {
      price: Number.isFinite(p) ? p : null,
      source: typeof json?.source === "string" ? json.source : null,
      cached: Boolean(json?.cached),
      stale: Boolean(json?.stale),
    };
  } catch {
    return { price: null, source: null, cached: false, stale: false };
  }
}

function formatDateCL(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type OnboardingStatus = {
  hasProfile: boolean;
  termsAccepted: boolean;
  canOperate: boolean;
};

function OnboardingStatusBanner({ onboarding }: { onboarding: OnboardingStatus }) {
  const ok = onboarding?.canOperate;
  const missing: string[] = [];
  if (!onboarding?.hasProfile) missing.push("Perfil");
  if (!onboarding?.termsAccepted) missing.push("Términos");

  return (
    <div
      className={[
        "rounded-xl border px-4 py-3 text-sm",
        ok
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
          : "border-yellow-500/20 bg-yellow-500/10 text-yellow-200",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">
          {ok ? "Onboarding completo ✅" : "Onboarding incompleto ⚠️"}
        </div>

        {!ok ? (
          <div className="text-xs opacity-90">
            Falta: {missing.join(" · ")}
          </div>
        ) : (
          <div className="text-xs opacity-90">Puedes operar</div>
        )}
      </div>
    </div>
  );
}

export default function DashboardClient({
  balances,
  movements,
  isAdmin,
  onboarding,
}: {
  balances: Record<AssetCode, string>;
  movements: Movement[];
  isAdmin: boolean;
  onboarding: OnboardingStatus;
}) {
  const router = useRouter();

  

  async function handleSignOut() {
    await signOut({ callbackUrl: "/auth/login" });
  }

  const needsProfile = !onboarding?.hasProfile;
  const needsTerms = !onboarding?.termsAccepted;

  function onboardingCtaHref() {
    if (needsProfile) return "/onboarding/profile";
    if (needsTerms) return "/onboarding/accept-terms";
    return "/dashboard";
  }

  function onboardingCtaLabel() {
    if (needsProfile) return "Completar perfil";
    if (needsTerms) return "Aceptar términos";
    return "OK";
  }

  // ✅ defaults SSR-safe
  const [hydrated, setHydrated] = useState(false);
  const [unit, setUnit] = useState<Unit>("BTC");
  const [activeAsset, setActiveAsset] = useState<AssetCode>("CLP");
  const [quote, setQuote] = useState<QuoteCurrency>("CLP");

  // ✅ Load preferences AFTER mount (evita hydration mismatch)
  useEffect(() => {
    setHydrated(true);

    const savedUnit = localStorage.getItem("unit") as Unit | null;
    if (savedUnit === "BTC" || savedUnit === "sats") setUnit(savedUnit);

    const savedAsset = localStorage.getItem("activeAsset") as AssetCode | null;
    if (savedAsset === "BTC" || savedAsset === "CLP" || savedAsset === "USD") setActiveAsset(savedAsset);

    const savedQuote = localStorage.getItem("quoteCurrency") as QuoteCurrency | null;
    if (savedQuote === "CLP" || savedQuote === "USDT" || savedQuote === "BTC") setQuote(savedQuote);
  }, []);

  function rememberActiveAsset() {
    try {
      localStorage.setItem("activeAsset", activeAsset);
    } catch {}
  }

  // Prices (Fase 3)
  const [btcClp, setBtcClp] = useState<number | null>(null);
  const [usdtClp, setUsdtClp] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const [btcClpInfo, setBtcClpInfo] = useState<PriceInfo | null>(null);
  const [usdtClpInfo, setUsdtClpInfo] = useState<PriceInfo | null>(null);

  // PENDINGS (admin)
  const [pending, setPending] = useState<PendingMovement[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  // ✅ Persist selectors
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("activeAsset", activeAsset);
  }, [activeAsset, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("quoteCurrency", quote);
  }, [quote, hydrated]);

  function toggleUnit() {
    const next: Unit = unit === "BTC" ? "sats" : "BTC";
    setUnit(next);
    localStorage.setItem("unit", next);
  }

  const portfolio = useMemo(() => {
    return {
      BTC: { enabled: true, label: "Bitcoin", value: balances.BTC ?? "0" },
      CLP: { enabled: true, label: "Pesos", value: balances.CLP ?? "0" },
      USD: { enabled: true, label: "Dólares", value: balances.USD ?? "0" },
    } as const;
  }, [balances]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => m.assetCode === activeAsset).slice(0, 30);
  }, [movements, activeAsset]);

  const pendingForActiveAsset = useMemo(() => {
    return pending.filter((p) => p.assetCode === activeAsset);
  }, [pending, activeAsset]);

  function unitParamForAsset(asset: AssetCode) {
    if (asset !== "BTC") return "";
    return `&unit=${unit}`;
  }

  function newMovementHref(type: "deposit" | "withdraw") {
    return `/treasury/new-movement?type=${type}&assetCode=${activeAsset}${unitParamForAsset(activeAsset)}`;
  }

  function adjustHref() {
    return `/treasury/adjust?assetCode=${activeAsset}${unitParamForAsset(activeAsset)}`;
  }

  async function loadPending() {
    if (!isAdmin) return;
    setPendingLoading(true);
    setPendingError(null);
    try {
      const res = await fetch("/api/treasury/movements/pending", { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPendingError(data?.error ?? "No pude cargar pendientes");
        setPending([]);
        return;
      }
      setPending(Array.isArray(data?.pending) ? data.pending : []);
    } catch (e: any) {
      setPendingError(e?.message ?? "No pude cargar pendientes");
      setPending([]);
    } finally {
      setPendingLoading(false);
    }
  }

  async function loadPrices() {
    setPriceLoading(true);
    try {
      const [i1, i2] = await Promise.all([fetchPriceInfo("BTC_CLP"), fetchPriceInfo("USDT_CLP")]);

      setBtcClp(i1.price);
      setUsdtClp(i2.price);

      setBtcClpInfo(i1);
      setUsdtClpInfo(i2);
    } finally {
      setPriceLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function refreshAll() {
    await Promise.all([loadPending(), loadPrices()]);
    router.refresh();
  }

  async function approve(id: string) {
    setActingId(id);
    setPendingError(null);
    try {
      const res = await fetch(`/api/treasury/movements/${id}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.log("ERROR APPROVE RAW RESPONSE:", data);
        setPendingError(JSON.stringify(data));
        return;
      }
      await refreshAll();
    } finally {
      setActingId(null);
    }
  }

  async function reject(id: string) {
    setActingId(id);
    setPendingError(null);
    try {
      const res = await fetch(`/api/treasury/movements/${id}/reject`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.message === "string"
            ? data.message
            : "Error aprobando movimiento";
      
        setPendingError(msg);
        return;
      } 
      await refreshAll();
    } finally {
      setActingId(null);
    }
  }

  function missingPriceReasonForQuote(q: QuoteCurrency) {
    if (!btcClp && (q === "CLP" || q === "USDT")) return "Falta BTC/CLP";
    if (!usdtClp && (q === "CLP" || q === "BTC")) return "Falta USDT/CLP";
    if (q === "USDT" && (!btcClp || !usdtClp)) return "Falta BTC/CLP o USDT/CLP";
    return null;
  }

  function totalLabelSuffix() {
    const reason = missingPriceReasonForQuote(quote);
    return reason ? " (parcial)" : "";
  }

  // ===== Valorización total =====
  const totals = useMemo(() => {
    const btc = Number(String(portfolio.BTC.value).replace(",", "."));
    const clp = Number(String(portfolio.CLP.value).replace(",", "."));
    const usd = Number(String(portfolio.USD.value).replace(",", "."));

    const bClp = btcClp;
    const uClp = usdtClp;

    const safeBtc = Number.isFinite(btc) ? btc : 0;
    const safeClp = Number.isFinite(clp) ? clp : 0;
    const safeUsd = Number.isFinite(usd) ? usd : 0;

    const totalCLP = safeClp + (uClp ? safeUsd * uClp : 0) + (bClp ? safeBtc * bClp : 0);

    const totalUSD =
      (uClp ? safeClp / uClp : 0) + safeUsd + (bClp && uClp ? safeBtc * (bClp / uClp) : 0);

    const totalBTC = safeBtc + (bClp ? safeClp / bClp : 0) + (bClp && uClp ? safeUsd * (uClp / bClp) : 0);

    return {
      CLP: totalCLP,
      USD: totalUSD,
      BTC: totalBTC,
      missingPrices: !(bClp && uClp),
    };
  }, [portfolio, btcClp, usdtClp]);

  // ===== Valorización por asset =====
  const perAsset = useMemo(() => {
    const btc = Number(String(portfolio.BTC.value).replace(",", "."));
    const clp = Number(String(portfolio.CLP.value).replace(",", "."));
    const usd = Number(String(portfolio.USD.value).replace(",", "."));

    const safeBtc = Number.isFinite(btc) ? btc : 0;
    const safeClp = Number.isFinite(clp) ? clp : 0;
    const safeUsd = Number.isFinite(usd) ? usd : 0;

    const bClp = btcClp;
    const uClp = usdtClp;

    const btcValue = {
      CLP: bClp ? safeBtc * bClp : null,
      USD: bClp && uClp ? safeBtc * (bClp / uClp) : null,
      BTC: safeBtc,
    };

    const clpValue = {
      CLP: safeClp,
      USD: uClp ? safeClp / uClp : null,
      BTC: bClp ? safeClp / bClp : null,
    };

    const usdValue = {
      CLP: uClp ? safeUsd * uClp : null,
      USD: safeUsd,
      BTC: bClp && uClp ? safeUsd * (uClp / bClp) : null,
    };

    return { btcValue, clpValue, usdValue };
  }, [portfolio, btcClp, usdtClp]);

  function renderTotal() {
    if (quote === "CLP") return formatCLP(totals.CLP);
    if (quote === "USDT") return formatUSD(totals.USD);
    return `${totals.BTC.toLocaleString("en-US", { maximumFractionDigits: 8 })} BTC`;
  }

  function priceBadge(info: PriceInfo | null) {
    if (!info || !info.source) return null;

    const isManual = info.source.toLowerCase().includes("manual");
    const isStale = Boolean(info.stale) || info.source.toLowerCase().includes("stale");

    const label = isManual ? "manual" : isStale ? "stale" : "buda";

    const cls = isManual
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : isStale
      ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
      : "border-neutral-700 bg-neutral-900 text-neutral-200";

    return (
      <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
        {label}
      </span>
    );
  }

  function assetValueInQuote(asset: AssetCode) {
    const btc = Number(String(portfolio.BTC.value).replace(",", "."));
    const clp = Number(String(portfolio.CLP.value).replace(",", "."));
    const usd = Number(String(portfolio.USD.value).replace(",", "."));

    const safeBtc = Number.isFinite(btc) ? btc : 0;
    const safeClp = Number.isFinite(clp) ? clp : 0;
    const safeUsd = Number.isFinite(usd) ? usd : 0;

    const btcInClp = btcClp ? safeBtc * btcClp : null;
    const usdInClp = usdtClp ? safeUsd * usdtClp : null;

    if (quote === "CLP") {
      if (asset === "CLP") return { value: safeClp, missing: false };
      if (asset === "BTC") return { value: btcInClp ?? 0, missing: !btcClp };
      return { value: usdInClp ?? 0, missing: !usdtClp };
    }

    if (quote === "USDT") {
      const clpToUsd = usdtClp ? safeClp / usdtClp : null;
      const btcToUsd = btcClp && usdtClp ? (safeBtc * btcClp) / usdtClp : null;

      if (asset === "USD") return { value: safeUsd, missing: false };
      if (asset === "CLP") return { value: clpToUsd ?? 0, missing: !usdtClp };
      return { value: btcToUsd ?? 0, missing: !(btcClp && usdtClp) };
    }

    const clpToBtc = btcClp ? safeClp / btcClp : null;
    const usdToBtc = btcClp && usdtClp ? (safeUsd * usdtClp) / btcClp : null;

    if (asset === "BTC") return { value: safeBtc, missing: false };
    if (asset === "CLP") return { value: clpToBtc ?? 0, missing: !btcClp };
    return { value: usdToBtc ?? 0, missing: !(btcClp && usdtClp) };
  }

  function formatQuoteValue(n: number) {
    if (quote === "CLP") return formatCLP(n);
    if (quote === "USDT") return formatUSD(n);
    return `${n.toLocaleString("en-US", { maximumFractionDigits: 8 })} BTC`;
  }

  function movementValueInQuote(m: Movement): string {
    const amt = Number(String(m.amount).replace(",", "."));
    if (!Number.isFinite(amt)) return "—";

    const signed = (m.type === "withdraw" ? -1 : 1) * amt;

    // ✅ Si está APROBADO y tenemos precio congelado en CLP, úsalo (solo cuando quote = CLP)
    if (m.status === "APPROVED" && m.executedPrice && quote === "CLP") {
      const px = Number(String(m.executedPrice).replace(",", "."));
      if (Number.isFinite(px)) {
        if (m.assetCode === "CLP") return formatCLP(signed);
        return formatCLP(signed * px);
      }
    }

    const b = btcClp; // CLP por BTC
    const u = usdtClp; // CLP por USD(USDT)

    const toCLP = () => {
      if (m.assetCode === "CLP") return signed;
      if (m.assetCode === "USD") return u ? signed * u : null;
      return b ? signed * b : null; // BTC
    };

    const toUSD = () => {
      if (m.assetCode === "USD") return signed;
      if (m.assetCode === "CLP") return u ? signed / u : null;
      return b && u ? signed * (b / u) : null; // BTC
    };

    const toBTC = () => {
      if (m.assetCode === "BTC") return signed;
      if (m.assetCode === "CLP") return b ? signed / b : null;
      return b && u ? signed * (u / b) : null; // USD
    };

    if (quote === "CLP") {
      const v = toCLP();
      return v === null ? "—" : formatCLP(v);
    }
    if (quote === "USDT") {
      const v = toUSD();
      return v === null ? "—" : formatUSD(v);
    }
    const v = toBTC();
    if (v === null) return "—";
    return `${v.toLocaleString("en-US", { maximumFractionDigits: 8 })} BTC`;
  }

  function missingPriceReason(m: Movement): string | null {
    const b = btcClp;
    const u = usdtClp;

    if (quote === "CLP") {
      if (m.assetCode === "BTC" && !b) return "Falta BTC/CLP";
      if (m.assetCode === "USD" && !u) return "Falta USDT/CLP";
      return null;
    }

    if (quote === "USDT") {
      if (m.assetCode === "CLP" && !u) return "Falta USDT/CLP";
      if (m.assetCode === "BTC" && !(b && u)) return "Falta BTC/CLP o USDT/CLP";
      return null;
    }

    if (m.assetCode === "CLP" && !b) return "Falta BTC/CLP";
    if (m.assetCode === "USD" && !(b && u)) return "Falta BTC/CLP o USDT/CLP";
    return null;
  }

  return (
    <>
                {/* ONBOARDING GUIDE */}
                {!onboarding.canOperate && (
                  <OnboardingGateModal
                  onboarding={onboarding}
                  onGoProfile={() => router.push("/onboarding/profile")}
                  onGoTerms={() => router.push("/onboarding/accept-terms")}
                  onAccepted={async () => {
                    await refreshAll();
                  }}
                />
                )}
      {/* LEFT: PORTFOLIO + ACCIONES */}
      <section className="rounded-2xl bg-black p-6 shadow-lg lg:col-span-1 border border-neutral-800">
      <OnboardingStatusBanner onboarding={onboarding} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-400">Valor total total{totalLabelSuffix()}</p>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{renderTotal()}</div>

            {totals.missingPrices && (
              <div className="mt-2 text-xs text-yellow-300/90">
                Valorización parcial: {missingPriceReasonForQuote(quote) ?? "Falta algún precio"}.
                <span className="ml-2 text-yellow-100/80">Usa “Actualizar” para reintentar.</span>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {(["CLP", "BTC", "USDT"] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuote(q)}
                  className={[
                    "rounded-lg border px-2 py-1 text-xs",
                    quote === q ? "border-neutral-600 bg-neutral-900" : "border-neutral-800 bg-neutral-950 hover:bg-neutral-900",
                  ].join(" ")}
                >
                  {q}
                </button>
              ))}

              <button
                type="button"
                onClick={refreshAll}
                className="ml-auto text-xs rounded-lg border border-neutral-700 px-2 py-1 hover:bg-neutral-800 disabled:opacity-50"
                disabled={priceLoading || pendingLoading}
                title="Refresca precios + pendientes + dashboard"
              >
                {priceLoading || pendingLoading ? "Actualizando…" : "Actualizar"}
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-400">
                <span>Bitcoin</span>
                <span>
                  {quote === "CLP" && perAsset.btcValue.CLP !== null && formatCLP(perAsset.btcValue.CLP)}
                  {quote === "USDT" && perAsset.btcValue.USD !== null && formatUSD(perAsset.btcValue.USD)}
                  {quote === "BTC" && `${perAsset.btcValue.BTC.toFixed(8)} BTC`}
                </span>
              </div>

              <div className="flex justify-between text-neutral-400">
                <span>Pesos (CLP)</span>
                <span>
                  {quote === "CLP" && formatCLP(perAsset.clpValue.CLP)}
                  {quote === "USDT" && perAsset.clpValue.USD !== null && formatUSD(perAsset.clpValue.USD)}
                  {quote === "BTC" && perAsset.clpValue.BTC !== null && `${perAsset.clpValue.BTC.toFixed(8)} BTC`}
                </span>
              </div>

              <div className="flex justify-between text-neutral-400">
                <span>Dólares (USDT)</span>
                <span>
                  {quote === "CLP" && perAsset.usdValue.CLP !== null && formatCLP(perAsset.usdValue.CLP)}
                  {quote === "USDT" && formatUSD(perAsset.usdValue.USD)}
                  {quote === "BTC" && perAsset.usdValue.BTC !== null && `${perAsset.usdValue.BTC.toFixed(8)} BTC`}
                </span>
              </div>
            </div>
          </div>

          {hydrated && activeAsset === "BTC" && (
            <button
              onClick={toggleUnit}
              className="text-xs rounded-lg border border-neutral-700 px-2 py-1 hover:bg-neutral-800"
              type="button"
              title="Cambiar unidad BTC/sats"
            >
              {unit === "BTC" ? "Ver en sats" : "Ver en BTC"}
            </button>
          )}
        </div>

        {/* TABS assets */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {(["BTC", "CLP", "USD"] as const).map((a) => {
            const enabled = portfolio[a].enabled;
            const active = activeAsset === a;

            return (
              <button
                key={a}
                type="button"
                disabled={!enabled}
                onClick={() => setActiveAsset(a)}
                className={[
                  "rounded-xl border px-3 py-2 text-left transition",
                  enabled ? "hover:bg-neutral-900" : "opacity-40 cursor-not-allowed",
                  active ? "border-neutral-600 bg-neutral-900" : "border-neutral-800 bg-neutral-950",
                ].join(" ")}
              >
                <div className="text-xs text-neutral-400">{uiAsset(a)}</div>
                <div className="text-sm font-medium text-neutral-100">{uiAssetLabel(a)}</div>
              </button>
            );
          })}
        </div>

        {/* Balance principal */}
        <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="text-xs text-neutral-400">Balance {uiAsset(activeAsset)}</div>

          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {activeAsset === "BTC"
              ? formatBTC(portfolio.BTC.value, unit)
              : activeAsset === "CLP"
              ? formatFiat(portfolio.CLP.value, "CLP")
              : formatFiat(portfolio.USD.value, "USD")}
          </div>
        </div>

        {/* DESGLOSE POR ASSET (en moneda quote) */}
        <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-400">Desglose por asset</div>
            <div className="text-[11px] text-neutral-500">en {quote}</div>
          </div>

          <div className="mt-3 space-y-2">
            {(["BTC", "CLP", "USD"] as const).map((a) => {
              const r = assetValueInQuote(a);

              return (
                <div key={a} className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">{uiAsset(a)}</span>

                  {r.missing ? (
                    <span
                      className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-[11px] text-yellow-200"
                      title="Falta precio para convertir este asset"
                    >
                      Sin precio
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-neutral-100">{formatQuoteValue(r.value)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-6 flex flex-col gap-3">
        <a
            href={onboarding.canOperate ? newMovementHref("deposit") : onboardingCtaHref()}
            className={[
              "rounded-xl px-4 py-2 font-medium",
              onboarding.canOperate
                ? "bg-white text-black hover:opacity-90"
                : "bg-white/40 text-black/70 cursor-not-allowed",
            ].join(" ")}
            onPointerDown={rememberActiveAsset}
            onClick={rememberActiveAsset}
            title={onboarding.canOperate ? "" : "Completa el onboarding para operar"}
          >
            Comprar ({uiAsset(activeAsset)})
          </a>

          <a
            href={onboarding.canOperate ? newMovementHref("withdraw") : onboardingCtaHref()}
            className={[
              "rounded-xl border px-4 py-2",
              onboarding.canOperate
                ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                : "border-red-500/20 text-red-300/50 cursor-not-allowed",
            ].join(" ")}
            onPointerDown={rememberActiveAsset}
            onClick={rememberActiveAsset}
            title={onboarding.canOperate ? "" : "Completa el onboarding para operar"}
          >
            Vender ({uiAsset(activeAsset)})
          </a>

          {isAdmin && (
          <a
            href={onboarding.canOperate ? adjustHref() : onboardingCtaHref()}
            className={[
              "rounded-xl border px-4 py-2 text-sm",
              onboarding.canOperate
                ? "border-neutral-700 hover:bg-neutral-800"
                : "border-neutral-800 text-neutral-400 cursor-not-allowed",
            ].join(" ")}
            onPointerDown={rememberActiveAsset}
            onClick={rememberActiveAsset}
            title={onboarding.canOperate ? "" : "Completa el onboarding para operar"}
          >
            Ajuste manual ({uiAsset(activeAsset)})
          </a>
        )}

        <a href="/select-company" className="rounded-xl border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800">
          Cambiar empresa
        </a>

        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800"
        >
          Sign out
        </button>
        </div>
      </section>

      {/* RIGHT: MOVIMIENTOS + PENDIENTES */}
      <section className="rounded-2xl bg-neutral-950 p-6 shadow-lg lg:col-span-2 border border-neutral-800">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm text-neutral-400">Movimientos ({uiAsset(activeAsset)})</h2>
          <div className="text-xs text-neutral-500 flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center">
              <span>{btcClp ? `BTC/CLP ${formatCLP(btcClp)}` : "BTC/CLP —"}</span>
              {priceBadge(btcClpInfo)}
            </div>

            <span className="text-neutral-700">·</span>

            <div className="flex items-center">
              <span>{usdtClp ? `USDT/CLP ${formatCLP(usdtClp)}` : "USDT/CLP —"}</span>
              {priceBadge(usdtClpInfo)}
            </div>
          </div>
        </div>

        {/* PENDIENTES (solo admin) */}
        {isAdmin && (
          <div className="mt-4 rounded-2xl border border-neutral-800 bg-black/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-neutral-400">Pendientes de aprobación</div>
                <div className="text-[11px] text-neutral-500">Se aprueban/rechazan por asset activo</div>
              </div>

              <button
                type="button"
                onClick={loadPending}
                className="text-xs rounded-lg border border-neutral-700 px-2 py-1 hover:bg-neutral-800 disabled:opacity-50"
                disabled={pendingLoading}
              >
                {pendingLoading ? "Actualizando…" : "Actualizar"}
              </button>
            </div>

            {pendingError && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {pendingError}
              </div>
            )}

            {pendingLoading ? (
              <div className="mt-3 text-sm text-neutral-500">Cargando pendientes…</div>
            ) : pendingForActiveAsset.length === 0 ? (
              <div className="mt-3 text-sm text-neutral-500">No hay pendientes para {activeAsset}.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {pendingForActiveAsset.map((p) => {
                  const amt =
                    p.assetCode === "BTC"
                      ? formatBTC(p.amount, unit)
                      : p.assetCode === "CLP"
                      ? formatFiat(p.amount, "CLP")
                      : formatFiat(p.amount, "USD");

                  const t = String(p.type);

                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(t)}`}>
                            {labelType(t)} {uiAsset(p.assetCode)}
                          </span>
                          <span className="text-xs text-neutral-500">{formatDateCL(p.createdAt)}</span>
                        </div>

                        <div className="mt-1 text-sm font-medium">
                          {signForType(t)}
                          {amt}
                        </div>

                        <div className="mt-1 text-xs text-neutral-500 truncate">{p.note || "—"}</div>

                        {p.attachmentUrl ? (
                          <a
                            href={p.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-xs text-neutral-300 underline hover:text-white"
                            title="Abrir comprobante"
                          >
                            📎 Ver comprobante
                          </a>
                        ) : null}
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => reject(p.id)}
                          disabled={actingId === p.id}
                          className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {actingId === p.id ? "…" : "Rechazar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => approve(p.id)}
                          disabled={actingId === p.id}
                          className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-black hover:opacity-90 disabled:opacity-50"
                        >
                          {actingId === p.id ? "…" : "Aprobar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ÚLTIMOS MOVIMIENTOS */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-neutral-500 border-b border-neutral-800">
              <tr>
                <th className="py-2 text-left">Fecha</th>
                <th className="py-2 text-left">Tipo</th>
                <th className="py-2 text-right">Monto</th>
                <th className="py-2 text-right">Valor ({quote})</th>
                <th className="py-2 text-left">Nota</th>
                <th className="py-2 text-left">Estado</th>
              </tr>
            </thead>

            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-neutral-500">
                    No hay movimientos todavía
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const t = m.type;
                  const amountFormatted =
                    m.assetCode === "BTC"
                      ? formatBTC(m.amount, unit)
                      : m.assetCode === "CLP"
                      ? formatFiat(m.amount, "CLP")
                      : formatFiat(m.amount, "USD");

                  return (
                    <tr key={m.id} className="border-b border-neutral-900 last:border-0">
                      <td className="py-3">{formatDateCL(m.createdAt)}</td>

                      <td className="py-3">
                        <span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(t)}`}>
                          {labelType(t)} {uiAsset(m.assetCode)}
                        </span>
                      </td>

                      <td className="py-3 text-right font-medium">
                        {signForType(t)}
                        {amountFormatted}
                      </td>

                      <td className="py-3 text-right">
                        {missingPriceReason(m) ? (
                          <span
                            className="inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-200"
                            title={missingPriceReason(m) ?? ""}
                          >
                            Sin precio
                          </span>
                        ) : (
                          <span className="text-neutral-200">{movementValueInQuote(m)}</span>
                        )}
                      </td>

                      <td className="py-3 text-neutral-400">{m.note || "—"}</td>

                      <td className="py-3">
                        <span className={`rounded-full border px-2 py-1 text-xs ${statusPill(m.status)}`}>
                          {statusLabel(m.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function OnboardingGateModal({
  onboarding,
  onGoProfile,
  onGoTerms,
  onAccepted,
}: {
  onboarding: {
    canOperate: boolean;
    hasProfile: boolean;
    termsAccepted: boolean;
  };
  onGoProfile: () => void;
  onGoTerms: () => void;
  onAccepted: () => Promise<void>;
}) {
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function acceptTerms() {
    setLoadingTerms(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/accept-terms", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "No se pudo aceptar términos");
        return;
      }

      await onAccepted();
    } catch {
      setError("Error de red");
    } finally {
      setLoadingTerms(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay bloqueante */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">Completa tu onboarding</h2>
        <p className="mt-1 text-sm text-white/60">
          Para operar necesitas completar estos pasos.
        </p>

        <div className="mt-5 space-y-3">
          {/* Paso perfil */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <div>
              <div className="text-sm font-medium text-white">Perfil personal</div>
              <div className="text-xs text-white/60">
                {onboarding.hasProfile ? "Listo ✅" : "Falta completar"}
              </div>
            </div>

            {!onboarding.hasProfile ? (
              <button
                onClick={onGoProfile}
                className="rounded-lg bg-white px-3 py-2 text-black text-sm"
              >
                Completar
              </button>
            ) : (
              <span className="text-xs text-white/50">Completado</span>
            )}
          </div>

          {/* Paso términos */}
          {/* Paso términos */}
<div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
  <div>
    <div className="text-sm font-medium text-white">Términos y condiciones</div>
    <div className="text-xs text-white/60">
      {onboarding.termsAccepted ? "Aceptados ✅" : "Falta aceptar"}
    </div>
  </div>

  {!onboarding.termsAccepted ? (
    <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={onGoTerms}
      className="rounded-lg bg-white px-3 py-2 text-black text-sm hover:opacity-90"
    >
      Leer y aceptar
    </button>
  </div>
  ) : (
    <span className="text-xs text-white/50">Aceptado</span>
  )}
</div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-white/40">
          Este bloqueo es intencional: sin onboarding no se puede operar.
        </div>
      </div>
    </div>
  );
}
