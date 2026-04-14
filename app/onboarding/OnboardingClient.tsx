"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import DocumentStep from "./_steps/DocumentStep";
import PersonalStep from "./_steps/PersonalStep";
import AcceptTermsStep from "./_steps/AcceptTermsStep";
import BankStep from "./_steps/BankStep";

type Step = "document" | "personal" | "bank" | "terms";

const STEP_SET = new Set<Step>(["document", "personal", "bank", "terms"]);
type PerfStore = { navStart?: number; from?: string };

export default function OnboardingClient() {
  const sp = useSearchParams();
  const perfEnabled = process.env.NEXT_PUBLIC_DEBUG_PERF === "1";
  const showDebug = process.env.NEXT_PUBLIC_SHOW_ONBOARDING_DEBUG === "1";

  const urlStep = sp.get("step");
  const normalizedStep = urlStep === "ocr" ? "document" : urlStep;
  const step = STEP_SET.has(normalizedStep as Step) ? (normalizedStep as Step) : "document";

  useEffect(() => {
    if (!perfEnabled) return;
    const perf = (globalThis as typeof globalThis & { __k21Perf?: PerfStore }).__k21Perf;
    const now = performance.now();
    const deltaMs = perf?.navStart ? Math.round(now - perf.navStart) : null;

    console.info("perf:onboarding_render", {
      step,
      from: perf?.from ?? null,
      deltaMs,
    });
  }, [perfEnabled, step]);

  // Dev nav temporal (me lo dejaste claro que te gustó)
  const DevNav = showDebug ? (
    <div className="fixed bottom-4 right-4 z-[9999] flex gap-2">
      <button
        type="button"
        disabled
        className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white border border-white/15 opacity-60 cursor-not-allowed"
      >
        Documento
      </button>
      <button
        type="button"
        disabled
        className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white border border-white/15 opacity-60 cursor-not-allowed"
      >
        Personal
      </button>
      <button
        type="button"
        disabled
        className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white border border-white/15 opacity-60 cursor-not-allowed"
      >
        Banco
      </button>
      <button
        type="button"
        disabled
        className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white border border-white/15 opacity-60 cursor-not-allowed"
      >
        Términos
      </button>
    </div>
  ) : null;

  return (
    <>
      {step === "document" && <DocumentStep />}

      {step === "personal" && <PersonalStep />}

      {step === "bank" && <BankStep />}

      {step === "terms" && <AcceptTermsStep />}

      {DevNav}
    </>
  );
}
