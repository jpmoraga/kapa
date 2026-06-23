import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type AudienceBlockProps = {
  body: string;
  concepts: string[];
  ctaHref: string;
  ctaLabel: string;
  eyebrow: string;
  question: string;
  title: string;
  tone?: "light" | "dark";
  external?: boolean;
};

export function AudienceBlock({
  body,
  concepts,
  ctaHref,
  ctaLabel,
  eyebrow,
  question,
  title,
  tone = "light",
  external = false,
}: AudienceBlockProps) {
  return (
    <Card
      variant={tone === "dark" ? "highlight" : "elevated"}
      className="rounded-[1.3rem] p-5 sm:p-6 lg:p-8"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.55fr)] lg:gap-7">
        <div className="grid gap-3.5">
          <Badge
            variant="outline"
            className="justify-start border-accent/30 px-2.25 py-1 text-[0.7rem] tracking-[0.14em] text-accent"
          >
            {eyebrow}
          </Badge>
          <div className="grid gap-3">
            <h3 className="max-w-2xl text-[1.56rem] leading-[1.04] font-semibold tracking-[-0.035em] text-foreground sm:text-[1.72rem] lg:text-[2.08rem]">
              {title}
            </h3>
            <p className="max-w-2xl text-[1.01rem] leading-[1.6] text-foreground-muted sm:text-[1.06rem] sm:leading-7">
              {body}
            </p>
            <p className="max-w-2xl text-[1.01rem] leading-[1.55] font-medium tracking-[-0.01em] text-foreground sm:text-[1.08rem] sm:leading-7">
              {question}
            </p>
          </div>
          <div>
            <Button
              href={ctaHref}
              rel={external ? "noopener noreferrer" : undefined}
              target={external ? "_blank" : undefined}
              variant={tone === "dark" ? "primary" : "secondary"}
              className="min-h-11 rounded-full px-4"
            >
              {ctaLabel}
            </Button>
          </div>
        </div>

        <div className="grid content-start gap-2.5 lg:pl-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
            Miramos
          </p>
          <div className="flex flex-wrap gap-2">
            {concepts.map((concept) => (
              <Badge
                key={concept}
                variant="default"
                className="justify-start border-border/90 bg-background px-2.25 py-1 text-[0.68rem] tracking-[0.14em] text-foreground-muted"
              >
                {concept}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
