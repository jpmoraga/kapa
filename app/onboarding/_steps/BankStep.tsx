"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import OnboardingShell from "../_components/OnboardingShell";
import { onboardingCopy as copy } from "../_copy";
import {
  ONBOARDING_ACCOUNT_TYPES,
  ONBOARDING_BANKS,
} from "@/lib/onboardingBank";

type PerfStore = { navStart?: number; from?: string };

export default function BankStep() {
  const router = useRouter();
  const perfEnabled = process.env.NEXT_PUBLIC_DEBUG_PERF === "1";

  const [bank, setBank] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = bank && accountType && /^\d{4,20}$/.test(accountNumber.trim());

  async function submitBank() {
    setSaving(true);
    setError(null);

    if (perfEnabled) {
      const now = performance.now();
      (globalThis as typeof globalThis & { __k21Perf?: PerfStore }).__k21Perf = {
        navStart: now,
        from: "bank",
      };
      console.info("perf:onboarding_click", {
        step: "bank",
        t: Math.round(now),
      });
    }

    const attempt = async () => {
      const res = await fetch("/api/onboarding/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bank,
          accountType,
          accountNumber,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data?.error ?? "Error guardando cuenta bancaria";
        const err = new Error(message);
        (err as Error & { status?: number }).status = res.status;
        throw err;
      }
    };

    try {
      await attempt();
      router.push("/onboarding?step=terms");
    } catch (e: any) {
      const status = e?.status;
      if (!status || status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        try {
          await attempt();
          router.push("/onboarding?step=terms");
          return;
        } catch (err: any) {
          setError(err?.message ?? "Error guardando cuenta bancaria");
        }
      } else {
        setError(e?.message ?? "Error guardando cuenta bancaria");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingShell title={copy.bank.title} subtitle={copy.bank.subtitle}>
      <div className="grid gap-3">
        <div>
          <label className="text-xs text-neutral-400">{copy.bank.bankLabel}</label>
          <select
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-white/10"
          >
            <option value="" className="bg-neutral-900">
              {copy.bank.bankPlaceholder}
            </option>
            {ONBOARDING_BANKS.map((bankOption) => (
              <option
                key={bankOption.value}
                value={bankOption.value}
                className="bg-neutral-900"
              >
                {bankOption.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-400">{copy.bank.typeLabel}</label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-white/10"
          >
            <option value="" className="bg-neutral-900">
              {copy.bank.typePlaceholder}
            </option>
            {ONBOARDING_ACCOUNT_TYPES.map((typeOption) => (
              <option
                key={typeOption.value}
                value={typeOption.value}
                className="bg-neutral-900"
              >
                {typeOption.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-400">{copy.bank.numberLabel}</label>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d]/g, ""))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-white/10"
            placeholder={copy.bank.numberPlaceholder}
            inputMode="numeric"
          />
        </div>

        <div className="mt-2 text-xs text-neutral-500">{copy.bank.note}</div>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={() => router.back()} className="k21-btn-secondary flex-1 h-11">
          {copy.bank.btnBack}
        </button>
        <button
          disabled={!isReady || saving}
          className="k21-btn-primary flex-1 h-11 disabled:opacity-60"
          title={!isReady ? copy.bank.btnContinueDisabled : undefined}
          onClick={submitBank}
        >
          {saving ? "Guardando..." : copy.bank.btnContinue}
        </button>
      </div>

      {error && <div className="mt-3 text-sm text-red-200">{error}</div>}
    </OnboardingShell>
  );
}
