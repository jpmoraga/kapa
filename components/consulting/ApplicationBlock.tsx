import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type ApplicationBlockProps = {
  className?: string;
  concepts: string[];
  description: string;
  order: string;
  question: string;
  title: string;
  variant?: "default" | "elevated" | "highlight";
};

export function ApplicationBlock({
  className,
  concepts,
  description,
  order,
  question,
  title,
  variant = "default",
}: ApplicationBlockProps) {
  return (
    <Card variant={variant} className={cn("rounded-[1.25rem] p-5 sm:p-6 lg:p-8", className)}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.56fr)] lg:gap-7">
        <div className="grid gap-3.5">
          <Badge
            variant="outline"
            className="justify-start border-accent/30 px-2.25 py-1 text-[0.7rem] tracking-[0.14em] text-accent"
          >
            {order} · Aplicación
          </Badge>
          <div className="grid gap-3">
            <h3 className="max-w-2xl text-[1.56rem] leading-[1.04] font-semibold tracking-[-0.035em] text-foreground sm:text-[1.72rem] lg:text-[2.08rem]">
              {title}
            </h3>
            <p className="max-w-2xl text-[1.01rem] leading-[1.6] text-foreground-muted sm:text-[1.06rem] sm:leading-7">
              {description}
            </p>
            <p className="max-w-2xl text-[1.01rem] leading-[1.55] font-medium tracking-[-0.01em] text-foreground sm:text-[1.08rem] sm:leading-7">
              {question}
            </p>
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
