import Link, { type LinkProps } from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  JSX,
  ReactNode,
} from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonBaseProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type ButtonLinkProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> &
  Omit<LinkProps, "href" | "className"> & {
    href: LinkProps["href"];
  };

type ButtonNativeProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

const baseClassName = cn(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-4 py-2.5 text-sm font-semibold",
  "transition-colors transition-shadow duration-200 motion-reduce:transition-none",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "disabled:pointer-events-none disabled:opacity-50",
);

const variantClassNames: Record<ButtonVariant, string> = {
  primary: cn(
    "border-accent bg-accent text-accent-foreground",
    "shadow-[var(--shadow)] hover:opacity-95",
  ),
  secondary: cn(
    "border-border bg-surface text-foreground",
    "hover:bg-surface-elevated",
  ),
  ghost: cn(
    "border-transparent bg-transparent text-foreground",
    "hover:border-border hover:bg-surface",
  ),
};

export function Button(props: ButtonLinkProps): JSX.Element;
export function Button(props: ButtonNativeProps): JSX.Element;
export function Button(props: ButtonLinkProps | ButtonNativeProps) {
  const { children, className, variant = "primary", ...rest } = props;
  const resolvedClassName = cn(baseClassName, variantClassNames[variant], className);

  if ("href" in props && props.href !== undefined) {
    const { href, ...linkProps } = rest as Omit<ButtonLinkProps, keyof ButtonBaseProps>;

    return (
      <Link href={href} className={resolvedClassName} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest as Omit<
    ButtonNativeProps,
    keyof ButtonBaseProps
  >;

  return (
    <button type={type} className={resolvedClassName} {...buttonProps}>
      {children}
    </button>
  );
}
