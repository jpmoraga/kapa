import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type MiningModalityCardProps = {
  body: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
  commercialBadge?: string;
  commercialCaption?: string;
  commercialHighlight?: string;
  commercialValue?: string;
  highlight?: boolean;
  keyPoints: string[];
  subtitle: string;
  title: string;
};

export function MiningModalityCard({
  body,
  ctaHref,
  ctaLabel,
  secondaryCtaHref,
  secondaryCtaLabel,
  commercialBadge,
  commercialCaption,
  commercialHighlight,
  commercialValue,
  highlight = false,
  keyPoints,
  subtitle,
  title,
}: MiningModalityCardProps) {
  return (
    <Card
      variant={highlight ? "highlight" : "elevated"}
      className="grid h-full gap-4 rounded-[1.08rem] p-4 shadow-none sm:gap-5 sm:p-6 sm:shadow-[var(--shadow)]"
    >
      <div className="grid gap-2.5">
        <Badge
          variant={highlight ? "accent" : "outline"}
          className={highlight ? "justify-start" : "justify-start border-accent/30 text-accent"}
        >
          {title}
        </Badge>
        <div className="grid gap-2">
          <p className="text-[1.08rem] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[1.18rem]">
            {subtitle}
          </p>
          <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
            {body}
          </p>
        </div>
      </div>

      {commercialValue || commercialCaption || commercialHighlight ? (
        <div
          className={
            highlight
              ? "grid gap-2.5 rounded-[1rem] border border-accent/30 bg-background/70 p-3.5 sm:p-4"
              : "grid gap-2.5 rounded-[1rem] border border-accent/20 bg-accent/[0.08] p-3.5 sm:p-4"
          }
        >
          {commercialBadge ? (
            <Badge
              variant={highlight ? "outline" : "accent"}
              className={
                highlight
                  ? "w-fit justify-start border-accent/30 px-2 py-1 text-[0.64rem] tracking-[0.14em] text-accent sm:px-2.25 sm:text-[0.68rem]"
                  : "w-fit justify-start px-2 py-1 text-[0.64rem] tracking-[0.14em] sm:px-2.25 sm:text-[0.68rem]"
              }
            >
              {commercialBadge}
            </Badge>
          ) : null}

          {commercialValue ? (
            <div className="grid gap-0.5">
              <p className="text-[1.24rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[1.45rem]">
                {commercialValue}
              </p>
              {commercialCaption ? (
                <p className="text-[0.92rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-6">
                  {commercialCaption}
                </p>
              ) : null}
            </div>
          ) : commercialCaption ? (
            <p className="text-[0.92rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-6">
              {commercialCaption}
            </p>
          ) : null}

          {commercialHighlight ? (
            <p className="text-[0.95rem] font-medium leading-6 text-foreground sm:text-base sm:leading-6">
              {commercialHighlight}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
          Datos clave
        </p>
        <ul className="grid gap-2 text-[0.98rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
          {keyPoints.map((item) => (
            <li key={item} className="grid grid-cols-[auto_1fr] gap-2.5">
              <span aria-hidden="true" className="mt-[0.55rem] size-1.5 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          variant={highlight ? "primary" : "secondary"}
          className="min-h-11 w-full rounded-full px-4 text-sm sm:w-auto"
        >
          {ctaLabel}
        </Button>
        {secondaryCtaHref && secondaryCtaLabel ? (
          <Button
            href={secondaryCtaHref}
            variant="secondary"
            className="min-h-11 w-full rounded-full border-[#ded6c8] bg-[#f7f2ea] px-4 text-sm font-semibold text-foreground shadow-none hover:border-[#cfc4b2] hover:bg-[#efe7db] sm:w-auto"
          >
            {secondaryCtaLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
