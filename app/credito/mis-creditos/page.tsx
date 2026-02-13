"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

function riskBadge(avgLtvPct: number | null) {
  if (avgLtvPct === null || !Number.isFinite(avgLtvPct)) {
    return { label: "Sin datos", cls: "border-white/10 bg-white/5 text-neutral-400" };
  }
  if (avgLtvPct < 50) {
    return { label: "Bajo", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" };
  }
  if (avgLtvPct <= 65) {
    return { label: "Medio", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" };
  }
  return { label: "Alto", cls: "border-red-500/30 bg-red-500/10 text-red-300" };
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
  const [disbursing, setDisbursing] = useState<Record<string, boolean>>({});

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
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

  useEffect(() => {
    void loadSession();
    void loadLoans();
  }, [loadLoans, loadSession]);

  const principalTotal = useMemo(() => {
    return loans.reduce((acc, loan) => {
      const principal = parseNumberLike(loan?.principalClp);
      return principal !== null ? acc + principal : acc;
    }, 0);
  }, [loans]);

  const activeCount = useMemo(() => {
    const active = new Set(["CREATED", "APPROVED", "DISBURSED"]);
    return loans.filter((loan) => active.has(String(loan?.status ?? ""))).length;
  }, [loans]);

  const avgLtv = useMemo(() => {
    const weighted = loans.reduce(
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
  }, [loans]);

  const avgLtvPct = avgLtv !== null ? avgLtv * 100 : null;
  const badge = riskBadge(avgLtvPct);
  const summaryReady = !loansLoading && !loansError;

  const handleDisburse = useCallback(
    async (loan: any) => {
      if (!loan?.id) return;
      if (disbursing[loan.id]) return;
      const principal = parseNumberLike(loan.principalClp);
      const clpLabel = principal !== null ? `$${formatClpNumber(principal)} CLP` : "este monto";
      const confirmed = window.confirm(
        `Otorgar crédito por ${clpLabel}? Esto sumará CLP al saldo interno del cliente`
      );
      if (!confirmed) return;

      setDisbursing((prev) => ({ ...prev, [loan.id]: true }));
      setNotice(null);
      try {
        const res = await fetch(`/api/credito/loans/${loan.id}/disburse`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          setNotice({ type: "error", message: data?.error ?? "No se pudo otorgar el crédito." });
          return;
        }
        const baseMessage =
          data?.kind === "idempotent" ? "Ya estaba otorgado (idempotente)." : "Crédito otorgado.";
        const warning =
          typeof data?.warning === "string" && data.warning.trim()
            ? `\n${data.warning.trim()}`
            : "";
        setNotice({ type: "success", message: `${baseMessage}${warning}` });
        await loadLoans();
        router.refresh();
      } catch {
        setNotice({ type: "error", message: "No se pudo otorgar el crédito." });
      } finally {
        setDisbursing((prev) => ({ ...prev, [loan.id]: false }));
      }
    },
    [disbursing, loadLoans, router]
  );

  const sortedLoans = useMemo(() => {
    return [...loans].sort((a, b) => {
      const aRaw = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bRaw = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      const aTime = Number.isFinite(aRaw) ? aRaw : 0;
      const bTime = Number.isFinite(bRaw) ? bRaw : 0;
      return bTime - aTime;
    });
  }, [loans]);

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
              <div className="mt-1 text-xs text-neutral-500">Ponderado por principal</div>
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

        <section className="k21-card mt-6 p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Tabla de créditos</div>
          {loansLoading ? (
            <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-neutral-400">
              Cargando créditos...
            </div>
          ) : loansError ? null : sortedLoans.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white">Aún no tienes créditos</div>
              <div className="mt-1 text-sm text-neutral-400">
                Cuando solicites y se otorgue un crédito, aparecerá aquí.
              </div>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Principal</th>
                    <th className="py-2 pr-3">Plazo</th>
                    <th className="py-2 pr-3">LTV</th>
                    <th className="py-2 pr-3">Creado</th>
                    <th className="py-2 pr-3">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-200">
                  {sortedLoans.map((loan) => {
                    const principal = parseNumberLike(loan.principalClp);
                    const status = String(loan.status ?? "");
                    const showDisburse =
                      isAdmin &&
                      status !== "DISBURSED" &&
                      (status === "CREATED" || status === "APPROVED");
                    const isLoading = Boolean(disbursing[loan.id]);
                    return (
                      <tr key={loan.id} className="border-t border-white/5">
                        <td className="py-3 pr-3 text-xs text-neutral-400">{loan.id}</td>
                        <td className="py-3 pr-3">{status || "—"}</td>
                        <td className="py-3 pr-3">
                          {principal !== null ? `$${formatClpNumber(principal)} CLP` : "—"}
                        </td>
                        <td className="py-3 pr-3">{loan.termMonths ?? "—"} meses</td>
                        <td className="py-3 pr-3">
                          {parseNumberLike(loan.ltvTarget) !== null
                            ? `${Math.round(parseNumberLike(loan.ltvTarget)! * 100)}%`
                            : "—"}
                        </td>
                        <td className="py-3 pr-3 text-xs text-neutral-400">
                          {loan.createdAt ? new Date(loan.createdAt).toLocaleString() : "—"}
                        </td>
                        <td className="py-3 pr-3">
                          {showDisburse ? (
                            <button
                              className="k21-btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                              disabled={isLoading}
                              onClick={() => handleDisburse(loan)}
                            >
                              {isLoading ? "Otorgando..." : "Otorgar crédito"}
                            </button>
                          ) : (
                            <span className="text-xs text-neutral-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
