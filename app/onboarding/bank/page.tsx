"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import OnboardingShell from "../_components/OnboardingShell";
import { onboardingCopy as copy } from "../_copy";

type BankOption = { value: string; label: string };

export default function BankPage() {
  const router = useRouter();

  const banks = useMemo<BankOption[]>(
    () => [
      { value: "", label: copy.bank.bankPlaceholder },
      { value: "banco-de-chile", label: "Banco de Chile" },
      { value: "santander", label: "Banco Santander" },
      { value: "bancoestado", label: "BancoEstado" },
      { value: "bci", label: "BCI" },
      { value: "itau", label: "Itaú" },
      { value: "scotiabank", label: "Scotiabank" },
      { value: "security", label: "Banco Security" },
      { value: "bice", label: "Banco BICE" },
      { value: "internacional", label: "Banco Internacional" },
      { value: "consorcio", label: "Banco Consorcio" },
      { value: "falabella", label: "Banco Falabella" },
      { value: "ripley", label: "Banco Ripley" },
      { value: "coopeuch", label: "Coopeuch" },
      { value: "hsbc", label: "HSBC" },
    ],
    []
  );

  const accountTypes = useMemo<BankOption[]>(
    () => [
      { value: "", label: copy.bank.typePlaceholder },
      { value: "corriente", label: "Cuenta Corriente" },
      { value: "vista", label: "Cuenta Vista" },
      { value: "rut", label: "Cuenta RUT" },
      { value: "ahorro", label: "Cuenta de Ahorro" },
    ],
    []
  );

  const [bank, setBank] = useState("");
  const [accountType, setAccountType] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const isReady = bank && accountType && accountNumber.trim().length >= 4;

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
            {banks.map((b) => (
              <option key={b.value} value={b.value} className="bg-neutral-900">
                {b.label}
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
            {accountTypes.map((t) => (
              <option key={t.value} value={t.value} className="bg-neutral-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-400">{copy.bank.numberLabel}</label>
          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
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
          disabled={!isReady}
          className="k21-btn-primary flex-1 h-11 disabled:opacity-60"
          title={!isReady ? copy.bank.btnContinueDisabled : undefined}
          onClick={async () => {
            try {
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
                alert(data?.error ?? "Error guardando cuenta bancaria");
                return;
              }

              router.refresh();
            } catch (e) {
              alert("Error inesperado guardando cuenta bancaria");
            }
          }}
        >
          {copy.bank.btnContinue}
        </button>
      </div>
    </OnboardingShell>
  );
}
