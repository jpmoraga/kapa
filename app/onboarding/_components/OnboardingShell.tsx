"use client";

import Link from "next/link";

export default function OnboardingShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto w-full max-w-xl px-6 py-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 opacity-90 hover:opacity-100"
          >
            <img
                src="/brand/k21-mark-white.svg"
                alt="K21"
                className="h-10 w-10"
                />
                <div className="text-sm text-neutral-500">Kapa21 ·  </div>
          </Link>

          {/* espacio futuro (si quieres poner progreso o ayuda) */}
          <div className="text-xs text-neutral-500" />
        </div>

        {/* Card */}
        <div className="k21-card p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>
            ) : null}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}