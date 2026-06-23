import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

type DiagnosticStep = {
  description: string;
  title: string;
};

type DiagnosticStepsProps = {
  outcomes: string[];
  steps: DiagnosticStep[];
};

export function DiagnosticSteps({ outcomes, steps }: DiagnosticStepsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(290px,0.92fr)] lg:items-start lg:gap-9">
      <ol className="grid gap-3 sm:gap-3.5">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="grid grid-cols-[auto_1fr] gap-3 rounded-[1rem] border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow)] sm:px-5 sm:py-4"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-9 sm:text-xs">
              0{index + 1}
            </span>
            <div className="grid gap-2">
              <h3 className="text-[1rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.12rem]">
                {step.title}
              </h3>
              <p className="text-[0.94rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-7">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <Card variant="elevated" className="grid gap-3.5 rounded-[1.12rem] p-5 sm:p-6">
        <Badge
          variant="outline"
          className="justify-start border-accent/30 px-2.25 py-1 text-[0.7rem] tracking-[0.14em] text-accent"
        >
          El diagnóstico responde
        </Badge>
        <ul className="grid gap-2.5 text-[0.94rem] leading-6 text-foreground-muted sm:text-[0.98rem] sm:leading-7">
          {outcomes.map((outcome) => (
            <li key={outcome} className="grid grid-cols-[auto_1fr] gap-3">
              <span aria-hidden="true" className="mt-2 size-2 rounded-full bg-accent" />
              <span>{outcome}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
