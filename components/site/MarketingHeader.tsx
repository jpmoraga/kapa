import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { Container } from "@/components/site/Container";
import { Button } from "@/components/ui/Button";

type HeaderTone = "dark" | "light";
type ActiveItem = "home" | "consulting" | "platform";

type MarketingHeaderProps = {
  active?: ActiveItem;
  className?: string;
  contactHref?: string;
  ctaHref: string;
  ctaLabel?: string;
  tone?: HeaderTone;
};

type NavItem = {
  active?: ActiveItem;
  href: string;
  label: string;
};

const desktopNavItems: NavItem[] = [
  { active: "home", href: "/", label: "Inicio" },
  { active: "consulting", href: "/consulting", label: "Consulting" },
  { active: "platform", href: "/auth/login", label: "Plataforma" },
];

const mobileNavItems: NavItem[] = [
  { active: "consulting", href: "/consulting", label: "Consulting" },
  { active: "platform", href: "/auth/login", label: "Plataforma" },
];

function NavLink({
  active,
  current,
  href,
  label,
  mobile = false,
}: NavItem & {
  current?: ActiveItem;
  mobile?: boolean;
}) {
  const isCurrent = active !== undefined && active === current;

  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        mobile
          ? "px-2.25 py-1 text-[0.73rem] font-medium"
          : "px-3 py-2 text-sm font-medium",
        isCurrent ? "text-foreground" : "text-foreground-muted hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function MarketingHeader({
  active,
  className,
  contactHref = "#contacto",
  ctaHref,
  ctaLabel = "Agendar reunión",
  tone = "dark",
}: MarketingHeaderProps) {
  const lockupSrc =
    tone === "dark"
      ? "/brand/k21-lockup-white-tight.svg"
      : "/brand/k21-lockup-dark-tight.svg";

  return (
    <header>
      <Container
        width="wide"
        className={cn("px-5 pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pt-8", className)}
      >
        <div className="grid gap-2 sm:gap-3">
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 lg:gap-5">
            <Link
              href="/"
              className="flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
            >
              <Image
                src={lockupSrc}
                alt="Kapa21"
                width={365}
                height={53}
                priority
                className="h-auto w-[6.4rem] object-contain object-left sm:w-[6.85rem] lg:w-[7.75rem]"
                unoptimized
              />
            </Link>

            <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-4">
              <nav
                className="hidden items-center gap-1 lg:flex"
                aria-label="Navegación principal"
              >
                {desktopNavItems.map((item) => (
                  <NavLink key={item.label} current={active} {...item} />
                ))}
                <Link
                  href={contactHref}
                  className="rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  Contacto
                </Link>
              </nav>

              <Link
                href="/auth/login"
                className="inline-flex min-h-9 items-center justify-center rounded-full px-2.5 text-[0.84rem] font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:min-h-10 sm:px-3.5 sm:text-sm lg:min-h-11 lg:px-4"
              >
                Entrar
              </Link>
              <Button
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                className="min-h-10 rounded-full px-3 text-[0.84rem] sm:min-h-10 sm:px-3.5 sm:text-sm lg:min-h-11 lg:px-4"
              >
                {ctaLabel}
              </Button>
            </div>
          </div>

          <nav
            className="flex items-center gap-0.5 overflow-x-auto pb-px lg:hidden"
            aria-label="Navegación secundaria"
          >
            {mobileNavItems.map((item) => (
              <NavLink key={item.label} current={active} mobile {...item} />
            ))}
            <Link
              href={contactHref}
              className="rounded-full px-2.25 py-1 text-[0.73rem] font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              Contacto
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
}
