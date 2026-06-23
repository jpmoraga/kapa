"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type LandingHeaderProps = {
  comingSoon?: boolean;
};

export function LandingHeader({ comingSoon = false }: LandingHeaderProps) {
  const pathname = usePathname();
  const isConsulting = pathname === "/consulting";
  const navLabel = isConsulting ? "Inicio" : "Consulting";
  const navHref = isConsulting ? "/" : "/consulting";

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/k21-lockup-white.svg"
            alt="Kapa 21"
            width={420}
            height={120}
            priority
            className="h-24 w-auto sm:h-28 md:h-32"
          />
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <nav className="flex items-center gap-3 text-xs text-neutral-300 sm:text-sm">
            <Link
              href={navHref}
              className="hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {navLabel}
            </Link>
          </nav>
          {comingSoon ? (
            <>
              <button title="Sitio en construcción" disabled className="k21-btn-disabled">
                Entrar
              </button>
              <button title="Sitio en construcción" disabled className="k21-btn-disabled">
                Crear cuenta
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="k21-btn-secondary">
                Entrar
              </Link>
              <Link href="/auth/register" className="k21-btn-primary">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
