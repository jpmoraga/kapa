import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

type CardVariant = "default" | "elevated" | "highlight";

type CardOwnProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
};

type CardProps<T extends ElementType> = CardOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps<T>>;

const variantClassNames: Record<CardVariant, string> = {
  default: "bg-surface",
  elevated: "bg-surface-elevated",
  highlight: "bg-surface-elevated border-accent/35",
};

export function Card<T extends ElementType = "div">({
  as,
  children,
  className,
  variant = "default",
  ...rest
}: CardProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={cn(
        "rounded-[var(--radius-lg)] border border-border p-6 text-foreground shadow-[var(--shadow)]",
        variantClassNames[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
