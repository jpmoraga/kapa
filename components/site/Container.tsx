import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ContainerWidth = "normal" | "wide";

type ContainerOwnProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  width?: ContainerWidth;
};

type ContainerProps<T extends ElementType> = ContainerOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof ContainerOwnProps<T>>;

const widthClassNames: Record<ContainerWidth, string> = {
  normal: "max-w-[var(--content-width)]",
  wide: "max-w-[var(--content-width-wide)]",
};

export function Container<T extends ElementType = "div">({
  as,
  children,
  className,
  width = "normal",
  ...rest
}: ContainerProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        widthClassNames[width],
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
