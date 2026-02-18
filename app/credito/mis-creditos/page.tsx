"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/k21/ConfirmModal";
import { LTV_MARKERS, LTV_SEGMENTS, ltvBadge, ltvTone } from "@/lib/credito/ltv";

function parseNumberLike(input: string | number | null | undefined) {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const compact = raw.replace(/\s+/g, "");
  const sign = compact.includes("-") ? "-" : "";
  let cleaned = compact.replace(/[^0-9,.-]/g, "");
  cleaned = cleaned.replace(/-/g, "");
  if (!cleaned) return null;

  const dotCount = (cleaned.match(/\./g) ?? []).length;
  const commaCount = (cleaned.match(/,/g) ?? []).length;
  let normalized = cleaned;

  if (dotCount > 0 && commaCount > 0) {
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    const decimalSep = lastDot > lastComma ? "." : ",";
    const thousandSep = decimalSep === "." ? "," : ".";
    const withoutThousand = cleaned.split(thousandSep).join("");
    const lastDecimal = withoutThousand.lastIndexOf(decimalSep);
    if (lastDecimal >= 0) {
      const intPart = withoutThousand.slice(0, lastDecimal).split(decimalSep).join("");
      const fracPart = withoutThousand.slice(lastDecimal + 1).split(decimalSep).join("");
      normalized = `${intPart}.${fracPart}`;
    } else {
      normalized = withoutThousand;
    }
  } else if (dotCount > 0 || commaCount > 0) {
    const sep = dotCount > 0 ? "." : ",";
    const count = sep === "." ? dotCount : commaCount;
    if (count === 1) {
      const idx = cleaned.indexOf(sep);
      const digitsRight = cleaned.length - idx - 1;
      if (digitsRight >= 1 && digitsRight <= 3) {
        normalized = cleaned.replace(sep, ".");
      } else {
        normalized = cleaned.replace(sep, "");
      }
    } else {
      normalized = cleaned.split(sep).join("");
    }
  }

  if (!/[0-9]/.test(normalized)) return null;
  const numeric = Number(`${sign}${normalized}`);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatClpNumber(n: number) {
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("es-CL");
}

function formatClp(n: number | null) {
  if (n === null || !Number.isFinite(n)) return "—";
  return `$${formatClpNumber(n)} CLP`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function truncateId(id: string, head = 4, tail = 3) {
  if (!id) return "";
  if (id.length <= head + tail + 3) return id;
  return `${id.slice(0, head)}...${id.slice(-tail)}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function parseDateLike(value?: string | number | Date | null) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function statusBadge(status: string) {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "CREATED") {
    return { label: "Creado", cls: "border-sky-500/30 bg-sky-500/10 text-sky-300" };
  }
  if (normalized === "APPROVED") {
    return { label: "Aprobado", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" };
  }
  if (normalized === "DISBURSED") {
    return { label: "Vigente", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" };
  }
  if (normalized === "CLOSED") {
    return { label: "Pagado", cls: "border-white/10 bg-white/5 text-neutral-200" };
  }
  return { label: normalized || "—", cls: "border-white/10 bg-white/5 text-neutral-400" };
}

export default function MisCreditosPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loans, setLoans] = useState<any[]>([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [loansError, setLoansError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [disbursing, setDisbursing] = useState<Record<string, boolean>>({});
  const [paying, setPaying] = useState<Record<string, boolean>>({});
  const [collateralLoading, setCollateralLoading] = useState<Record<string, boolean>>({});
  const [collateralModalOpen, setCollateralModalOpen] = useState(false);
  const [collateralAction, setCollateralAction] = useState<"ADD" | "WITHDRAW" | null>(null);
  const [collateralLoanId, setCollateralLoanId] = useState<string | null>(null);
  const [collateralSats, setCollateralSats] = useState("");
  const [spotBtcClp, setSpotBtcClp] = useState<number | null>(null);
  const spotLogRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState<string | undefined>(undefined);
  const [confirmTone, setConfirmTone] = useState<"neutral" | "danger" | "success">("neutral");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | {
    type: "GRANT" | "PAY";
    loanId: string;
  }>(null);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const userId = typeof data?.user?.id === "string" ? data.user.id : null;
      setCurrentUserId(userId);
      const activeCompanyId = data?.activeCompanyId ?? null;
      if (!activeCompanyId) {
        setIsAdmin(false);
        return;
      }
      const companies = Array.isArray(data?.companies) ? data.companies : [];
      const membership = companies.find((c: any) => c.companyId === activeCompanyId);
      const role = String(membership?.role ?? "").toLowerCase();
      setIsAdmin(role === "admin" || role === "owner");
    } catch {
      setIsAdmin(false);
      setCurrentUserId(null);
    }
  }, []);

  const loadLoans = useCallback(async () => {
    setLoansLoading(true);
    setLoansError(null);
    try {
      const res = await fetch("/api/credito/loans", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setLoansError(data?.error ?? "No pudimos cargar créditos.");
        return;
      }
      setLoansError(null);
      setLoans(Array.isArray(data?.loans) ? data.loans : []);
    } catch {
      setLoansError("No pudimos cargar créditos.");
    } finally {
      setLoansLoading(false);
    }
  }, []);

  const loadSpot = useCallback(async () => {
    try {
      const res = await fetch("/api/prices/spot?pair=BTC_CLP", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (process.env.NODE_ENV !== "production" && !spotLogRef.current) {
          console.debug("SPOT_FETCH_FAILED", { status: res.status, data });
          spotLogRef.current = true;
        }
        setSpotBtcClp(null);
        return;
      }
      const raw = data?.price ?? data?.spot ?? data?.value ?? data?.last ?? data?.btcClp;
      const parsed = parseNumberLike(raw);
      setSpotBtcClp(parsed !== null && parsed > 0 ? parsed : null);
    } catch {
      setSpotBtcClp(null);
    }
  }, []);

  useEffect(() => {
    void loadSession();
    void loadLoans();
    void loadSpot();
  }, [loadLoans, loadSession, loadSpot]);

  const activeStatuses = useMemo(() => new Set(["CREATED", "APPROVED", "DISBURSED"]), []);
  const visibleLoans = useMemo(
    () => loans.filter((loan) => activeStatuses.has(String(loan?.status ?? ""))),
    [loans, activeStatuses]
  );

  const principalTotal = useMemo(() => {
    return visibleLoans.reduce((acc, loan) => {
      const principal = parseNumberLike(loan?.principalClp);
      return principal !== null ? acc + principal : acc;
    }, 0);
  }, [visibleLoans]);

  const activeCount = useMemo(() => {
    return visibleLoans.length;
  }, [visibleLoans]);

  const avgLtv = useMemo(() => {
    const weighted = visibleLoans.reduce(
      (acc, loan) => {
        const principal = parseNumberLike(loan?.principalClp);
        const ltv = parseNumberLike(loan?.ltvTarget);
        if (principal === null || ltv === null) return acc;
        return { sum: acc.sum + principal, weighted: acc.weighted + principal * ltv };
      },
      { sum: 0, weighted: 0 }
    );
    if (weighted.sum <= 0) return null;
    return weighted.weighted / weighted.sum;
  }, [visibleLoans]);

  const ltvMetrics = useMemo(() => {
    const map = new Map<string, { ltv: number | null }>();
    if (!spotBtcClp) {
      return { map, weightedLtv: null as number | null, ticks: [] as number[] };
    }

    let principalSum = 0;
    let collateralSum = 0;
    const ticks: number[] = [];

    visibleLoans.forEach((loan) => {
      const principal = parseNumberLike(loan?.principalClp);
      const collateralSats = parseNumberLike(loan?.collateralSatsTotal);
      if (principal === null || collateralSats === null || collateralSats <= 0) {
        map.set(loan.id, { ltv: null });
        return;
      }
      const collateralBtc = collateralSats / 1e8;
      const collateralValueClp = collateralBtc * spotBtcClp;
      if (!Number.isFinite(collateralValueClp) || collateralValueClp <= 0) {
        map.set(loan.id, { ltv: null });
        return;
      }
      const ltv = principal / collateralValueClp;
      if (Number.isFinite(ltv)) {
        ticks.push(ltv);
        principalSum += principal;
        collateralSum += collateralValueClp;
        map.set(loan.id, { ltv });
      } else {
        map.set(loan.id, { ltv: null });
      }
    });

    const weightedLtv = collateralSum > 0 ? principalSum / collateralSum : null;
    return { map, weightedLtv, ticks };
  }, [spotBtcClp, visibleLoans]);

  const avgLtvPct =
    ltvMetrics.weightedLtv !== null
      ? ltvMetrics.weightedLtv * 100
      : avgLtv !== null
        ? avgLtv * 100
        : null;
  const badge = ltvBadge(avgLtvPct);
  const summaryReady = !loansLoading && !loansError;
  const weightedLtvPct = ltvMetrics.weightedLtv !== null ? ltvMetrics.weightedLtv * 100 : null;
  const weightedLtvClamped =
    weightedLtvPct !== null ? Math.min(Math.max(weightedLtvPct, 0), 100) : null;
  const riskTone = ltvTone(weightedLtvPct);
  const riskTitle = visibleLoans.length === 1 ? "Riesgo de este crédito" : "Riesgo agregado";
  const showRiskTicks = visibleLoans.length > 1;
  const collateralSatsValue = useMemo(() => {
    const parsed = parseNumberLike(collateralSats);
    if (parsed === null || !Number.isFinite(parsed)) return null;
    if (!Number.isInteger(parsed) || parsed <= 0) return null;
    return parsed;
  }, [collateralSats]);
  const collateralClpValue = useMemo(() => {
    if (collateralSatsValue === null || spotBtcClp === null) return null;
    return (collateralSatsValue / 1e8) * spotBtcClp;
  }, [collateralSatsValue, spotBtcClp]);
  const collateralSubmitting = collateralLoanId
    ? Boolean(collateralLoading[collateralLoanId])
    : false;

  const openCollateralModal = useCallback((action: "ADD" | "WITHDRAW", loanId: string) => {
    setCollateralAction(action);
    setCollateralLoanId(loanId);
    setCollateralSats("");
    setCollateralModalOpen(true);
  }, []);

  const closeCollateralModal = useCallback(() => {
    if (collateralSubmitting) return;
    setCollateralModalOpen(false);
    setCollateralAction(null);
    setCollateralLoanId(null);
    setCollateralSats("");
  }, [collateralSubmitting]);

  const handleCollateralSubmit = useCallback(async () => {
    if (!collateralAction || !collateralLoanId) return;
    if (collateralLoading[collateralLoanId]) return;
    const sats = collateralSatsValue;
    if (sats === null) {
      setNotice({ type: "error", message: "Sats inválidos. Debe ser un entero mayor a 0." });
      return;
    }

    setCollateralLoading((prev) => ({ ...prev, [collateralLoanId]: true }));
    setNotice(null);
    try {
      const actionPath = collateralAction === "ADD" ? "add" : "withdraw";
      const res = await fetch(
        `/api/credito/loans/${collateralLoanId}/collateral/${actionPath}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sats }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        const baseMessage =
          data?.error ??
          (collateralAction === "ADD"
            ? "No se pudo agregar garantía."
            : "No se pudo retirar garantía.");
        const code =
          typeof data?.code === "string" && data.code.trim() ? ` (${data.code.trim()})` : "";
        setNotice({ type: "error", message: `${baseMessage}${code}` });
        return;
      }
      setNotice({
        type: "success",
        message:
          collateralAction === "ADD"
            ? "Garantía agregada (stub)."
            : "Garantía retirada (stub).",
      });
      closeCollateralModal();
    } catch {
      setNotice({
        type: "error",
        message:
          collateralAction === "ADD"
            ? "No se pudo agregar garantía. (COLLATERAL_ERROR)"
            : "No se pudo retirar garantía. (COLLATERAL_ERROR)",
      });
    } finally {
      setCollateralLoading((prev) => ({ ...prev, [collateralLoanId]: false }));
    }
  }, [
    closeCollateralModal,
    collateralAction,
    collateralLoanId,
    collateralLoading,
    collateralSatsValue,
  ]);

  const handleGrantCredit = useCallback(
    async (loan: any) => {
      if (!loan?.id) return;
      if (disbursing[loan.id]) return;
      setDisbursing((prev) => ({ ...prev, [loan.id]: true }));
      setNotice(null);
      try {
        let status = String(loan.status ?? "");
        if (status === "CREATED") {
          const approveRes = await fetch(`/api/credito/loans/${loan.id}/approve`, {
            method: "POST",
          });
          const approveData = await approveRes.json().catch(() => ({}));
          if (!approveRes.ok || !approveData?.ok) {
            const baseMessage = approveData?.error ?? "No se pudo aprobar el crédito.";
            const code =
              typeof approveData?.code === "string" && approveData.code.trim()
                ? ` (${approveData.code.trim()})`
                : "";
            setNotice({ type: "error", message: `${baseMessage}${code}` });
            return false;
          }
          status = "APPROVED";
        }

        if (status === "APPROVED") {
          const res = await fetch(`/api/credito/loans/${loan.id}/disburse`, { method: "POST" });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.ok) {
            const baseMessage = data?.error ?? "No se pudo otorgar el crédito.";
            const code =
              typeof data?.code === "string" && data.code.trim() ? ` (${data.code.trim()})` : "";
            setNotice({ type: "error", message: `${baseMessage}${code}` });
            return false;
          }
          const baseMessage =
            data?.kind === "idempotent"
              ? "Ya estaba otorgado (idempotente)."
              : "Crédito otorgado.";
          const warning =
            typeof data?.warning === "string" && data.warning.trim()
              ? `\n${data.warning.trim()}`
              : "";
          setNotice({ type: "success", message: `${baseMessage}${warning}` });
          await loadLoans();
          router.refresh();
          return true;
        }
      } catch {
        setNotice({ type: "error", message: "No se pudo otorgar el crédito. (DISBURSE_ERROR)" });
        return false;
      } finally {
        setDisbursing((prev) => ({ ...prev, [loan.id]: false }));
      }
      return false;
    },
    [disbursing, loadLoans, router]
  );

  const handlePay = useCallback(
    async (loan: any) => {
      if (!loan?.id) return;
      if (paying[loan.id]) return;
      setPaying((prev) => ({ ...prev, [loan.id]: true }));
      setNotice(null);
      try {
        const res = await fetch(`/api/credito/loans/${loan.id}/pay`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          const baseMessage = data?.error ?? "No se pudo registrar el pago.";
          const code =
            typeof data?.code === "string" && data.code.trim() ? ` (${data.code.trim()})` : "";
          setNotice({ type: "error", message: `${baseMessage}${code}` });
          return false;
        }
        setNotice({ type: "success", message: "Pago registrado." });
        await loadLoans();
        router.refresh();
        return true;
      } catch {
        setNotice({ type: "error", message: "No se pudo registrar el pago. (PAY_ERROR)" });
        return false;
      } finally {
        setPaying((prev) => ({ ...prev, [loan.id]: false }));
      }
      return false;
    },
    [loadLoans, paying, router]
  );

  const openConfirm = useCallback(
    (action: { type: "GRANT" | "PAY"; loanId: string }) => {
      if (!action.loanId) return;
      if (action.type === "GRANT") {
        setConfirmTitle("Otorgar crédito");
        setConfirmDesc("Esto suma CLP al saldo interno del cliente.");
        setConfirmTone("neutral");
      } else {
        setConfirmTitle("Registrar pago");
        setConfirmDesc("Se cerrará el crédito y se registrará interés.");
        setConfirmTone("neutral");
      }
      setPendingAction(action);
      setConfirmOpen(true);
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!pendingAction) return;
    const loan = loans.find((item) => item?.id === pendingAction.loanId);
    if (!loan) {
      setConfirmOpen(false);
      setPendingAction(null);
      return;
    }
    setConfirmLoading(true);
    const ok =
      pendingAction.type === "GRANT" ? await handleGrantCredit(loan) : await handlePay(loan);
    setConfirmLoading(false);
    if (ok) {
      setConfirmOpen(false);
      setPendingAction(null);
    }
  }, [handleGrantCredit, handlePay, loans, pendingAction]);

  const sortedLoans = useMemo(() => {
    return [...visibleLoans].sort((a, b) => {
      const aRaw = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bRaw = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aTime = Number.isFinite(aRaw) ? aRaw : 0;
      const bTime = Number.isFinite(bRaw) ? bRaw : 0;
      return bTime - aTime;
    });
  }, [visibleLoans]);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="k21-card p-6">
          <div className="text-sm text-white/60">Kapa21</div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Mis créditos</h1>
          <p className="mt-2 text-sm text-white/60">Gestión y desembolso de créditos.</p>
        </div>

        {loansError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <div>{loansError}</div>
            <button
              type="button"
              className="k21-btn-secondary mt-3 px-3 py-1.5 text-xs"
              onClick={() => loadLoans()}
            >
              Reintentar
            </button>
          </div>
        )}

        {notice && (
          <div
            className={`mt-4 whitespace-pre-line rounded-xl border p-3 text-sm ${
              notice.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {notice.message}
          </div>
        )}

        <section className="k21-card mt-6 p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Resumen</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">Total principal CLP</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {summaryReady ? formatClp(principalTotal) : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">Créditos activos</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {summaryReady ? activeCount : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">LTV promedio</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {summaryReady && avgLtvPct !== null ? `${avgLtvPct.toFixed(1)}%` : "—"}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {ltvMetrics.weightedLtv !== null
                  ? "Ponderado por colateral"
                  : "LTV objetivo (legacy)"}
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-neutral-500">Riesgo</div>
              <div className="mt-3">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="k21-card mt-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{riskTitle}</div>
            <div className="text-xs text-neutral-500">
              Spot BTC/CLP: {spotBtcClp !== null ? formatClpNumber(spotBtcClp) : "—"}
            </div>
          </div>
          {spotBtcClp === null ? (
            <div className="mt-3 text-sm text-neutral-400">Riesgo: — (sin precio spot)</div>
          ) : ltvMetrics.ticks.length === 0 || weightedLtvPct === null ? (
            <div className="mt-3 text-sm text-neutral-400">Riesgo: — (sin colateral)</div>
          ) : (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-neutral-200">
                <span>LTV ponderado</span>
                <span className="font-semibold text-white">{weightedLtvPct.toFixed(1)}%</span>
              </div>
              <div className="relative mt-3 h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
                {LTV_SEGMENTS.map((segment) => (
                  <div
                    key={`${segment.from}-${segment.to}`}
                    className={`absolute inset-y-0 ${segment.cls}`}
                    style={{ left: `${segment.from}%`, width: `${segment.to - segment.from}%` }}
                  />
                ))}
                <div
                  className={`absolute top-0 h-3 w-0.5 ${riskTone.markerCls}`}
                  style={{ left: `${weightedLtvClamped ?? 0}%` }}
                />
                <div
                  className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border ${riskTone.dotCls}`}
                  style={{ left: `${weightedLtvClamped ?? 0}%` }}
                />
                {showRiskTicks &&
                  ltvMetrics.ticks.map((tick, idx) => {
                    const left = clamp(tick * 100, 0, 100);
                    return (
                      <span
                        key={`${tick}-${idx}`}
                        className="absolute top-0 h-3 w-px bg-white/40"
                        style={{ left: `${left}%` }}
                      />
                    );
                  })}
              </div>
              <div className="relative mt-2 h-4 text-[10px] text-neutral-500">
                {LTV_MARKERS.map((p) => (
                  <span
                    key={p}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${p}%` }}
                  >
                    {p}%
                  </span>
                ))}
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                Basado en colateral y spot actual.
              </div>
            </div>
          )}
        </section>

        <section className="k21-card mt-6 p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Créditos</div>
          {loansLoading ? (
            <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-neutral-400">
              Cargando créditos...
            </div>
          ) : loansError ? null : sortedLoans.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">No tienes créditos vigentes</div>
              <div className="mt-1 text-sm text-neutral-400">
                Cuando tengas créditos creados o desembolsados, aparecerán aquí.
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {sortedLoans.map((loan) => {
                const principal = parseNumberLike(loan.principalClp);
                const ltvTarget = parseNumberLike(loan.ltvTarget);
                const ltvDyn = ltvMetrics.map.get(loan.id)?.ltv ?? null;
                const status = String(loan.status ?? "");
                const badge = statusBadge(status);
                const isDisbursed = status === "DISBURSED";
                const isClosed = status === "CLOSED";
                const isDisbursing = Boolean(disbursing[loan.id]);
                const isPaying = Boolean(paying[loan.id]);
                const isCollateralBusy = Boolean(collateralLoading[loan.id]);
                const canGrant = isAdmin && (status === "CREATED" || status === "APPROVED");
                const isBorrower =
                  typeof currentUserId === "string" && loan?.userId === currentUserId;
                const canPay = isDisbursed && (isBorrower || isAdmin);
                const canCollateral = true;
                const dueDate = parseDateLike(
                  loan?.dueAt ??
                    loan?.maturesAt ??
                    loan?.endsAt ??
                    loan?.maturityAt ??
                    loan?.maturityDate ??
                    loan?.expiresAt ??
                    loan?.dueDate
                );
                const daysToDue = dueDate
                  ? Math.ceil((dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
                  : null;
                const canRenew =
                  isDisbursed && daysToDue !== null && Number.isFinite(daysToDue) && daysToDue <= 7;
                const renewHint = dueDate
                  ? "Disponible 7 días antes del vencimiento"
                  : "Disponible cerca del vencimiento";
                const hasActions = canGrant || canPay || canCollateral || canRenew;
                const truncatedId = loan.id ? truncateId(loan.id) : "";
                return (
                  <div
                    key={loan.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-white">Crédito</div>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        {truncatedId ? (
                          <>
                            <span title={loan.id}>{truncatedId}</span>
                            <button
                              type="button"
                              className="text-[11px] text-neutral-300 underline hover:text-white"
                              title={`Copiar ${loan.id}`}
                              onClick={() => {
                                if (!loan.id) return;
                                if (!navigator?.clipboard) return;
                                void navigator.clipboard.writeText(loan.id);
                              }}
                            >
                              Copiar
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-neutral-500">
                          Principal
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">
                          {principal !== null ? `$${formatClpNumber(principal)} CLP` : "—"}
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">
                          Plazo: {loan.termMonths ?? "—"} meses
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-neutral-500">
                          Condiciones
                        </div>
                        <div className="mt-2 text-sm text-neutral-200">
                          APR:{" "}
                          {parseNumberLike(loan.interestApr) !== null
                            ? `${(parseNumberLike(loan.interestApr)! * 100).toFixed(2)}%`
                            : "—"}
                        </div>
                        <div className="mt-2 text-sm text-neutral-200">
                          LTV:{" "}
                          {ltvDyn !== null && Number.isFinite(ltvDyn)
                            ? `${(ltvDyn * 100).toFixed(1)}%`
                            : ltvTarget !== null
                              ? `${Math.round(ltvTarget * 100)}% (objetivo, legacy)`
                              : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-neutral-500">Fechas</div>
                        <div className="mt-2 text-sm text-neutral-200">
                          Creado: {formatDateTime(loan.createdAt)}
                        </div>
                        {loan.disbursedAt ? (
                          <div className="mt-1 text-sm text-neutral-200">
                            Desembolsado: {formatDateTime(loan.disbursedAt)}
                          </div>
                        ) : null}
                        {loan.paidAt || loan.closedAt ? (
                          <div className="mt-1 text-sm text-neutral-200">
                            Pagado: {formatDateTime(loan.paidAt ?? loan.closedAt)}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                      {canCollateral ? (
                        <button
                          className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                          disabled={isDisbursing || isPaying || isCollateralBusy}
                          onClick={() => openCollateralModal("ADD", loan.id)}
                        >
                          Agregar garantía
                        </button>
                      ) : null}
                      {canCollateral ? (
                        <button
                          className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                          disabled={isDisbursing || isPaying || isCollateralBusy}
                          onClick={() => openCollateralModal("WITHDRAW", loan.id)}
                        >
                          Retirar garantía
                        </button>
                      ) : null}
                      <div className="flex flex-col items-end">
                        <button
                          className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                          disabled={!canRenew}
                          type="button"
                        >
                          Renovar crédito
                        </button>
                        {!canRenew ? (
                          <span className="mt-1 text-[11px] text-neutral-500">{renewHint}</span>
                        ) : null}
                      </div>
                      {canGrant ? (
                        <button
                          className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                          disabled={isDisbursing || isPaying}
                          onClick={() => openConfirm({ type: "GRANT", loanId: loan.id })}
                        >
                          {isDisbursing ? "Otorgando..." : "Otorgar crédito"}
                        </button>
                      ) : null}
                      {canPay ? (
                        <button
                          className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                          disabled={isPaying || isDisbursing}
                          onClick={() => openConfirm({ type: "PAY", loanId: loan.id })}
                        >
                          {isPaying ? "Pagando..." : "Pagar"}
                        </button>
                      ) : null}
                      {!hasActions && !isClosed ? (
                        <span className="text-xs text-neutral-500">—</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {collateralModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeCollateralModal}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
            <div className="text-lg font-semibold text-white">
              {collateralAction === "WITHDRAW" ? "Retirar garantía" : "Agregar garantía"}
            </div>
            <div className="mt-1 text-sm text-neutral-400">
              Ingresa la cantidad de sats para continuar.
            </div>
            <label className="mt-4 block text-xs uppercase tracking-wide text-neutral-500">
              Sats
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="ej: 100000"
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-white/20 focus:outline-none"
              value={collateralSats}
              onChange={(event) => setCollateralSats(event.target.value)}
              disabled={collateralSubmitting}
              min={1}
            />
            <div className="mt-2 text-xs text-neutral-500">
              Equivalente: {collateralClpValue !== null ? formatClp(collateralClpValue) : "—"}
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                onClick={closeCollateralModal}
                disabled={collateralSubmitting}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="k21-btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                onClick={handleCollateralSubmit}
                disabled={collateralSubmitting}
                type="button"
              >
                {collateralSubmitting ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmModal
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDesc}
        tone={confirmTone}
        loading={confirmLoading}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirm}
        onClose={() => {
          if (confirmLoading) return;
          setConfirmOpen(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
}
