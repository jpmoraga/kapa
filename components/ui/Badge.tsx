import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "accent" | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variantClassNames: Record<BadgeVariant, string> = {
  default: "border-border bg-surface text-foreground-muted",
  accent: "border-accent bg-accent text-accent-foreground",
  outline: "border-border bg-transparent text-foreground",
};

export function Badge({ children, className, variant = "default", ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        variantClassNames[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
