import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { Container } from "@/components/site/Container";

type FooterTone = "dark" | "light";

type FooterLink = {
  href: string;
  label: string;
};

type MarketingFooterProps = {
  calendlyHref?: string;
  className?: string;
  compactMobile?: boolean;
  contactEmail: string;
  legalLinks?: FooterLink[];
  navLinks?: FooterLink[];
  tone?: FooterTone;
};

const defaultNavLinks: FooterLink[] = [
  { href: "/", label: "Inicio" },
  { href: "/consulting", label: "Consulting" },
  { href: "/auth/login", label: "Plataforma" },
  { href: "/auth/login", label: "Entrar" },
];

function FooterLinkItem({ href, label }: FooterLink) {
  return (
    <Link
      href={href}
      className="text-sm text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      {label}
    </Link>
  );
}

export function MarketingFooter({
  calendlyHref,
  className,
  compactMobile = false,
  contactEmail,
  legalLinks,
  navLinks = defaultNavLinks,
  tone = "dark",
}: MarketingFooterProps) {
  const logoSrc =
    tone === "dark"
      ? "/brand/k21-lockup-white-tight.svg"
      : "/brand/k21-lockup-dark-tight.svg";

  return (
    <footer className={cn(compactMobile ? "border-t border-border/80 pt-6 sm:pt-10" : "border-t border-border/80 pt-8 sm:pt-10", className)}>
      <Container
        width="wide"
        className={cn(
          compactMobile
            ? "grid gap-6 px-5 pb-8 sm:gap-9 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(220px,0.56fr)_minmax(220px,0.64fr)] lg:items-start lg:gap-10 lg:px-8"
            : "grid gap-8 px-5 pb-10 sm:gap-9 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(220px,0.56fr)_minmax(220px,0.64fr)] lg:items-start lg:gap-10 lg:px-8",
        )}
      >
        <div className={cn("grid", compactMobile ? "gap-3" : "gap-4")}>
          <Link
            href="/"
            className="flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
          >
            <Image
              src={logoSrc}
              alt="Kapa21"
              width={365}
              height={53}
              className={cn(
                "h-auto object-contain object-left",
                compactMobile ? "w-[5.35rem] sm:w-[6rem] lg:w-[6.45rem]" : "w-[5.8rem] sm:w-[6rem] lg:w-[6.45rem]",
              )}
              unoptimized
            />
          </Link>

          <div className={cn("grid text-sm text-foreground-muted", compactMobile ? "gap-1.5 leading-5 sm:leading-6" : "gap-2 leading-6")}>
            <p>© {new Date().getFullYear()} Kapa21. Infraestructura financiera sobre Bitcoin para empresas.</p>
            <p>
              Contacto:{" "}
              <a
                className="text-foreground transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                href={`mailto:${contactEmail}`}
              >
                {contactEmail}
              </a>
            </p>
          </div>
        </div>

        <div className={cn("grid", compactMobile ? "gap-2.5" : "gap-3")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
            Navegación
          </p>
          <nav
            className={cn(compactMobile ? "grid grid-cols-2 gap-x-4 gap-y-1.5 lg:grid-cols-1 lg:gap-2" : "grid gap-2")}
            aria-label="Navegación del footer"
          >
            {navLinks.map((link) => (
              <FooterLinkItem key={`${link.href}-${link.label}`} {...link} />
            ))}
          </nav>
        </div>

        <div className={cn("grid", compactMobile ? "gap-2.5" : "gap-3")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
            Contacto
          </p>
          <div className={cn("grid text-sm text-foreground-muted", compactMobile ? "gap-1.5" : "gap-2")}>
            <a
              href={`mailto:${contactEmail}`}
              className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Escribir a Kapa21
            </a>
            {calendlyHref ? (
              <a
                href={calendlyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Agendar una reunión
              </a>
            ) : null}
            {legalLinks?.length ? (
              <div className={cn("grid", compactMobile ? "gap-1.5 pt-2.5" : "gap-2 pt-3")}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                  Legales
                </p>
                {legalLinks.map((link) => (
                  <FooterLinkItem key={`${link.href}-${link.label}`} {...link} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </footer>
  );
}
