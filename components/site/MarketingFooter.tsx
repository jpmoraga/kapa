import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Instagram,
  Linkedin,
  Newspaper,
  User,
} from "lucide-react";

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
  { href: "/mining", label: "Minería" },
  { href: "/auth/login", label: "Entrar" },
];

const ecosystemLinks = {
  bookKindle: "https://a.co/d/02tdNI0l",
  bookPrint: "https://a.co/d/0b5iYtrn",
  juanInstagram: "https://www.instagram.com/jpmoraga/",
  juanLinkedin: "https://www.linkedin.com/in/juanpablomoraga/",
  juanNewsletter:
    "https://www.linkedin.com/newsletters/bitcoin-ia-y-m%C3%A1s-all%C3%A1-7312143641307709440/",
  juanX: "https://x.com/jp_moraga",
  kapa21Instagram: "https://www.instagram.com/kapa21_cl/",
  kapa21Linkedin: "https://www.linkedin.com/company/kapa21/",
} as const;

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

function FooterExternalPill({
  href,
  icon,
  label,
}: FooterLink & { icon: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/78 px-3 py-2 text-sm text-foreground-muted transition-colors transition-shadow duration-200",
        "hover:border-accent/30 hover:bg-surface hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
      )}
    >
      <span className="inline-flex size-6 items-center justify-center rounded-full border border-border/70 bg-surface-elevated text-foreground-muted">
        {icon}
      </span>
      <span>{label}</span>
      <ArrowUpRight className="size-3.5 text-foreground-muted/80" strokeWidth={2} />
    </a>
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
        <div
          className={cn(
            "grid gap-4 rounded-[1.15rem] border border-border/80 bg-surface/45 px-4 py-4 sm:px-5 sm:py-5 lg:col-span-3",
            compactMobile ? "sm:gap-5" : "sm:gap-6",
          )}
        >
          <div className="grid gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
              Ecosistema Kapa21
            </p>
            <p className="max-w-3xl text-sm leading-6 text-foreground-muted">
              Canales oficiales, contenidos públicos y referencias editoriales sobre Bitcoin, IA y tesorería.
            </p>
          </div>

          <div className="grid gap-3.5 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)_minmax(0,0.96fr)] lg:gap-4">
            <div className="grid gap-4 rounded-[1rem] border border-border/75 bg-background/72 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <p className="text-sm font-semibold text-foreground">Kapa21</p>
                  <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-sm">
                    Canales oficiales
                  </p>
                </div>
                <span className="inline-flex size-9 items-center justify-center rounded-full border border-accent/20 bg-accent/[0.08] text-accent">
                  <Building2 className="size-4" strokeWidth={2} />
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <FooterExternalPill
                  href={ecosystemLinks.kapa21Linkedin}
                  label="LinkedIn"
                  icon={<Linkedin className="size-3.5" strokeWidth={2} />}
                />
                <FooterExternalPill
                  href={ecosystemLinks.kapa21Instagram}
                  label="Instagram"
                  icon={<Instagram className="size-3.5" strokeWidth={2} />}
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-[1rem] border border-border/75 bg-background/72 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <p className="text-sm font-semibold text-foreground">
                    Juan Pablo Moraga
                  </p>
                  <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-sm">
                    Contenidos y redes personales
                  </p>
                </div>
                <span className="inline-flex size-9 items-center justify-center rounded-full border border-accent/20 bg-accent/[0.08] text-accent">
                  <User className="size-4" strokeWidth={2} />
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <FooterExternalPill
                  href={ecosystemLinks.juanLinkedin}
                  label="LinkedIn"
                  icon={<Linkedin className="size-3.5" strokeWidth={2} />}
                />
                <FooterExternalPill
                  href={ecosystemLinks.juanInstagram}
                  label="Instagram"
                  icon={<Instagram className="size-3.5" strokeWidth={2} />}
                />
                <FooterExternalPill
                  href={ecosystemLinks.juanX}
                  label="X"
                  icon={
                    <span className="text-[0.68rem] font-semibold leading-none tracking-[0.12em] text-foreground-muted">
                      X
                    </span>
                  }
                />
              </div>

              <a
                href={ecosystemLinks.juanNewsletter}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "grid gap-1 rounded-[0.95rem] border border-accent/20 bg-accent/[0.08] px-3.5 py-3 transition-colors duration-200",
                  "hover:border-accent/30 hover:bg-accent/[0.12]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      Bitcoin, IA y m&aacute;s all&aacute;
                    </span>
                    <span className="text-[0.78rem] leading-5 text-foreground-muted sm:text-[0.82rem]">
                      Newsletter en LinkedIn
                    </span>
                  </div>
                  <span className="inline-flex size-8 items-center justify-center rounded-full border border-accent/20 bg-background/78 text-accent">
                    <Newspaper className="size-3.5" strokeWidth={2} />
                  </span>
                </div>
              </a>
            </div>

            <div className="grid gap-4 rounded-[1rem] border border-border/75 bg-background/72 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <p className="text-sm font-semibold text-foreground">
                    Bitcoin, un imperativo moral
                  </p>
                  <p className="text-[0.82rem] leading-5 text-foreground-muted sm:text-sm">
                    Libro de Juan Pablo Moraga
                  </p>
                </div>
                <span className="inline-flex size-9 items-center justify-center rounded-full border border-accent/20 bg-accent/[0.08] text-accent">
                  <BookOpen className="size-4" strokeWidth={2} />
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <FooterExternalPill
                  href={ecosystemLinks.bookPrint}
                  label="Amazon físico"
                  icon={<BookOpen className="size-3.5" strokeWidth={2} />}
                />
                <FooterExternalPill
                  href={ecosystemLinks.bookKindle}
                  label="Kindle"
                  icon={<BookOpen className="size-3.5" strokeWidth={2} />}
                />
              </div>
            </div>
          </div>
        </div>

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
