import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type MiningModalityCardProps = {
  body: string;
  ctaHref: string;
  ctaLabel: string;
  highlight?: boolean;
  keyPoints: string[];
  subtitle: string;
  title: string;
};

export function MiningModalityCard({
  body,
  ctaHref,
  ctaLabel,
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

      <div className="mt-auto">
        <Button
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          variant={highlight ? "primary" : "secondary"}
          className="min-h-11 w-full rounded-full px-4 text-sm"
        >
          {ctaLabel}
        </Button>
      </div>
    </Card>
  );
}
