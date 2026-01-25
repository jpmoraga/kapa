"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import PersonalPage from "./personal/page";
import AcceptTermsPage from "./accept-terms/page";
import OcrPage from "./ocr/page"; // ✅ ESTE ES EL OCR REAL (carpeta /ocr)
import BankPage from "./bank/page";

type Step = "ocr" | "personal" | "bank" | "terms";

const STEP_SET = new Set<Step>(["ocr", "personal", "bank", "terms"]);
type PerfStore = { navStart?: number; from?: string };

export default function OnboardingClient() {
  const sp = useSearchParams();
  const perfEnabled = process.env.NEXT_PUBLIC_DEBUG_PERF === "1";
  const showDebug = process.env.NEXT_PUBLIC_SHOW_ONBOARDING_DEBUG === "1";

  const urlStep = sp.get("step");
  const step = STEP_SET.has(urlStep as Step) ? (urlStep as Step) : "ocr";

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
        OCR
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
        Bank
      </button>
      <button
        type="button"
        disabled
        className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white border border-white/15 opacity-60 cursor-not-allowed"
      >
        Terms
      </button>
    </div>
  ) : null;

  return (
    <>
      {step === "ocr" && <OcrPage />}

      {step === "personal" && <PersonalPage />}

      {step === "bank" && <BankPage />}

      {step === "terms" && <AcceptTermsPage />}

      {DevNav}
    </>
  );
}
