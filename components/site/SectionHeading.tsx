import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  align?: "left" | "center";
  className?: string;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function SectionHeading({
  align = "left",
  className,
  description,
  eyebrow,
  title,
}: SectionHeadingProps) {
  const isCentered = align === "center";

  return (
    <div className={cn("grid gap-4", isCentered && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <div className={cn("grid gap-3", isCentered && "justify-items-center")}>
        <h2 className="max-w-4xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-3xl text-base leading-7 text-foreground-muted sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
