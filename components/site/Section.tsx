import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ThemeName = "platform" | "consulting" | "partnership";
type ToneName = "default" | "inverse" | "muted" | "accent";
type SectionSpacing = "none" | "sm" | "md" | "lg";

type SectionOwnProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  spacing?: SectionSpacing;
  theme?: ThemeName;
  tone?: ToneName;
};

type SectionProps<T extends ElementType> = SectionOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof SectionOwnProps<T>>;

const spacingClassNames: Record<SectionSpacing, string> = {
  none: "",
  sm: "py-12 sm:py-16",
  md: "py-16 sm:py-20 lg:py-24",
  lg: "py-20 sm:py-24 lg:py-32",
};

export function Section<T extends ElementType = "section">({
  as,
  children,
  className,
  spacing = "md",
  theme,
  tone = "default",
  ...rest
}: SectionProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      className={cn(
        "bg-background text-foreground transition-colors duration-200 motion-reduce:transition-none",
        spacingClassNames[spacing],
        className,
      )}
      data-theme={theme}
      data-tone={tone}
      {...rest}
    >
      {children}
    </Component>
  );
}
