"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../_components/OnboardingShell";
import { onboardingCopy as copy } from "../_copy";

type PerfStore = { navStart?: number; from?: string };

export default function AcceptTermsPage() {
  const router = useRouter();
  const perfEnabled = process.env.NEXT_PUBLIC_DEBUG_PERF === "1";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const termsRef = useRef<HTMLDivElement | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  useEffect(() => {
    const el = termsRef.current;
    if (!el) return;

    const onScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      if (atBottom) setHasScrolledToBottom(true);
    };

    onScroll();

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  async function onAccept() {
    setLoading(true);
    setError(null);

    try {
      if (perfEnabled) {
        const now = performance.now();
        (globalThis as typeof globalThis & { __k21Perf?: PerfStore }).__k21Perf = {
          navStart: now,
          from: "terms",
        };
        console.info("perf:onboarding_click", {
          step: "terms",
          t: Math.round(now),
        });
      }
      const res = await fetch("/api/onboarding/accept-terms", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as any)?.error ?? copy.terms.defaultError);
        return;
      }

      router.refresh();
    } catch {
      setError(copy.terms.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <OnboardingShell title={copy.terms.title} subtitle={copy.terms.subtitle}>
      <div
        ref={termsRef}
        className="max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-neutral-200"
      >
        <p className="text-neutral-300">{copy.terms.intro}</p>

        <ul className="mt-3 list-disc pl-5 text-neutral-300">
          {copy.terms.bullets.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      {!hasScrolledToBottom && (
        <div className="mt-2 text-xs text-neutral-500">{copy.terms.scrollHint}</div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={onAccept}
          disabled={loading || !hasScrolledToBottom}
          title={!hasScrolledToBottom ? copy.terms.scrollHint : undefined}
          className="k21-btn-primary flex-1 h-11 disabled:opacity-60"
        >
          {loading ? copy.terms.saving : copy.terms.btnAccept}
        </button>

        <button onClick={() => router.back()} className="k21-btn-secondary flex-1 h-11">
          {copy.terms.btnBack}
        </button>
      </div>
    </OnboardingShell>
  );
}
