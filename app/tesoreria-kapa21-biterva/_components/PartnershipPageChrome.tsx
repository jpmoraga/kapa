import Image from "next/image";
import Link from "next/link";
import { ScrollToFormButton } from "./ScrollToFormButton";

export const PARTNERSHIP_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.kapa21.cl";

export const PARTNERSHIP_PAGE_BACKGROUND =
  "min-h-screen bg-[radial-gradient(1200px_circle_at_20%_10%,rgba(247,147,26,0.12),transparent_45%),radial-gradient(900px_circle_at_80%_20%,rgba(255,255,255,0.06),transparent_40%),linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,1))] text-neutral-100";

export const PARTNERSHIP_LOGOS = {
  kapa21: "/brand/k21-lockup-white.svg",
  biterva: null,
} as const;

type PartnershipHeaderProps = {
  ctaLabel?: string;
  showServicesLink?: boolean;
};

export function PartnershipHeader({
  ctaLabel = "Postular conversación",
  showServicesLink = true,
}: PartnershipHeaderProps) {
  return (
    <header className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center" aria-label="Ir al inicio de Kapa21">
          <Image
            src={PARTNERSHIP_LOGOS.kapa21}
            alt="Kapa21"
            width={420}
            height={120}
            priority
            className="h-16 w-auto sm:h-20"
          />
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-3">
          {showServicesLink && (
            <Link
              href="/servicios"
              className="text-sm text-neutral-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Servicios
            </Link>
          )}
          <ScrollToFormButton className="k21-btn-secondary">{ctaLabel}</ScrollToFormButton>
        </div>
      </div>
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-neutral-500">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-neutral-300 sm:text-lg">{description}</p>
      )}
    </div>
  );
}

export function LogoSlot({
  src,
  alt,
  placeholder,
}: {
  src?: string | null;
  alt: string;
  placeholder: string;
}) {
  if (src) {
    return (
      <div className="flex h-[4.5rem] items-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <Image src={src} alt={alt} width={240} height={72} className="h-10 w-auto sm:h-12" />
      </div>
    );
  }

  return (
    <div className="flex h-[4.5rem] min-w-[11rem] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-4 text-center text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">
      {placeholder}
    </div>
  );
}

export function PartnershipFooter() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl border-t border-white/10 px-6 py-6 text-xs text-neutral-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>© {new Date().getFullYear()} Kapa21</div>
        <div>contacto@kapa21.cl</div>
        <div className="flex items-center gap-3">
          <Link className="transition hover:text-neutral-300" href="/">
            Inicio
          </Link>
          <Link className="transition hover:text-neutral-300" href="/servicios">
            Servicios
          </Link>
        </div>
      </div>
    </footer>
  );
}
