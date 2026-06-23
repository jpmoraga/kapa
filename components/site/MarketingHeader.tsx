import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { Container } from "@/components/site/Container";
import { Button } from "@/components/ui/Button";

type HeaderTone = "dark" | "light";
type ActiveItem = "home" | "consulting" | "platform";

type NavItem = {
  active?: ActiveItem;
  current?: ActiveItem | boolean;
  href: string;
  label: string;
  rel?: string;
  target?: string;
};

type HeaderAction = {
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  href?: string;
  label: string;
  rel?: string;
  target?: string;
  title?: string;
  variant?: "primary" | "secondary" | "ghost";
};

type MarketingHeaderProps = {
  active?: ActiveItem;
  className?: string;
  compactMobile?: boolean;
  contactHref?: string;
  ctaHref?: string;
  ctaLabel?: string;
  loginHref?: string;
  loginLabel?: string;
  mobileNavItems?: NavItem[];
  navItems?: NavItem[];
  primaryAction?: HeaderAction;
  secondaryAction?: HeaderAction;
  showLogin?: boolean;
  tone?: HeaderTone;
};

const defaultDesktopNavItems: NavItem[] = [
  { active: "home", href: "/", label: "Inicio" },
  { active: "consulting", href: "/consulting", label: "Consulting" },
  { active: "platform", href: "/auth/login", label: "Plataforma" },
];

const defaultMobileNavItems: NavItem[] = [
  { active: "consulting", href: "/consulting", label: "Consulting" },
  { active: "platform", href: "/auth/login", label: "Plataforma" },
];

function NavLink({
  active,
  current,
  href,
  label,
  mobile = false,
  rel,
  target,
}: NavItem & {
  current?: ActiveItem | boolean;
  mobile?: boolean;
}) {
  const isCurrent =
    typeof current === "boolean" ? current : active !== undefined && active === current;

  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      rel={rel}
      target={target}
      className={cn(
        "rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        mobile
          ? "min-w-0 px-1.5 py-1 text-center text-[0.71rem] font-medium sm:px-2 sm:text-[0.73rem]"
          : "px-3 py-2 text-sm font-medium",
        isCurrent ? "text-foreground" : "text-foreground-muted hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

function renderAction(action: HeaderAction) {
  const {
    ariaLabel,
    className,
    disabled,
    href,
    label,
    rel,
    target,
    title,
    variant = "primary",
  } = action;

  const resolvedClassName = cn(
    "min-h-10 rounded-full px-3 text-[0.84rem] sm:min-h-10 sm:px-3.5 sm:text-sm lg:min-h-11 lg:px-4",
    className,
  );

  if (disabled || !href) {
    return (
      <Button
        aria-disabled={true}
        aria-label={ariaLabel}
        className={resolvedClassName}
        disabled
        title={title}
        variant={variant}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      aria-label={ariaLabel}
      className={resolvedClassName}
      href={href}
      rel={rel}
      target={target}
      title={title}
      variant={variant}
    >
      {label}
    </Button>
  );
}

export function MarketingHeader({
  active,
  className,
  compactMobile = false,
  contactHref = "#contacto",
  ctaHref,
  ctaLabel = "Agendar reunión",
  loginHref = "/auth/login",
  loginLabel = "Entrar",
  mobileNavItems,
  navItems,
  primaryAction,
  secondaryAction,
  showLogin = true,
  tone = "dark",
}: MarketingHeaderProps) {
  const lockupSrc =
    tone === "dark"
      ? "/brand/k21-lockup-white-tight.svg"
      : "/brand/k21-lockup-dark-tight.svg";

  const resolvedDesktopNavItems = navItems ?? defaultDesktopNavItems;
  const resolvedMobileNavItems = mobileNavItems ?? defaultMobileNavItems;
  const shouldAppendContact = navItems === undefined;
  const shouldAppendMobileContact = mobileNavItems === undefined;
  const resolvedPrimaryAction =
    primaryAction ??
    (ctaHref
      ? {
          href: ctaHref,
          label: ctaLabel,
          rel: "noopener noreferrer",
          target: "_blank",
          variant: "primary" as const,
        }
      : undefined);

  return (
    <header>
      <Container
        width="wide"
        className={cn(
          compactMobile
            ? "px-5 pt-2.5 sm:px-6 sm:pt-4 lg:px-8 lg:pt-8"
            : "px-5 pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pt-8",
          className,
        )}
      >
        <div className={cn("grid lg:gap-3", compactMobile ? "gap-1.5 sm:gap-2" : "gap-2 sm:gap-3")}>
          <div className={cn("flex items-center justify-between lg:gap-5", compactMobile ? "gap-2 sm:gap-2.5" : "gap-2.5 sm:gap-3")}>
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
                {resolvedDesktopNavItems.map((item) => (
                  <NavLink key={item.label} current={active} {...item} />
                ))}
                {shouldAppendContact ? (
                  <Link
                    href={contactHref}
                    className="rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    Contacto
                  </Link>
                ) : null}
              </nav>

              {showLogin ? (
                <Link
                  href={loginHref}
                  className="inline-flex min-h-9 items-center justify-center rounded-full px-2.5 text-[0.84rem] font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:min-h-10 sm:px-3.5 sm:text-sm lg:min-h-11 lg:px-4"
                >
                  {loginLabel}
                </Link>
              ) : null}
              {secondaryAction ? renderAction(secondaryAction) : null}
              {resolvedPrimaryAction ? renderAction(resolvedPrimaryAction) : null}
            </div>
          </div>

          <nav
            className={cn(
              "lg:hidden",
              compactMobile
                ? "grid grid-cols-4 gap-1 pb-px"
                : "flex items-center gap-0.5 overflow-x-auto pb-px",
            )}
            aria-label="Navegación secundaria"
          >
            {resolvedMobileNavItems.map((item) => (
              <NavLink key={item.label} current={active} mobile {...item} />
            ))}
            {shouldAppendMobileContact ? (
              <Link
                href={contactHref}
                className="rounded-full px-2.25 py-1 text-[0.73rem] font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Contacto
              </Link>
            ) : null}
          </nav>
        </div>
      </Container>
    </header>
  );
}
