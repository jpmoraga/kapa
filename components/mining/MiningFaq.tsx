import { miningFaqItems } from "@/data/mining/faq";
import { Container } from "@/components/site/Container";
import { Section } from "@/components/site/Section";
import { SectionHeading } from "@/components/site/SectionHeading";

export function MiningFaq() {
  return (
    <Section tone="inverse" spacing="md" id="preguntas" className="py-12 sm:py-16 lg:py-24">
      <Container width="wide" className="grid gap-6 px-5 sm:px-6 lg:gap-10 lg:px-8">
        <SectionHeading
          eyebrow="PREGUNTAS FRECUENTES"
          title="Antes de participar"
          className="gap-3 [&_h2]:max-w-3xl [&_h2]:text-[2.02rem] [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.04em] sm:[&_h2]:text-[2.38rem] lg:[&_h2]:text-[3.08rem]"
        />

        <div className="grid gap-2.5 sm:gap-3">
          {miningFaqItems.map((item) => (
            <details
              key={item.question}
              className="group rounded-[1rem] border border-border bg-surface-elevated shadow-none sm:rounded-[1.15rem] sm:shadow-[var(--shadow)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left text-[0.98rem] font-semibold leading-6 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:px-6 sm:py-5 sm:text-base">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="inline-flex size-7 items-center justify-center rounded-full border border-border text-xs text-foreground-muted sm:size-8 sm:text-sm"
                >
                  +
                </span>
              </summary>
              <div className="border-t border-border px-4 pb-4 pt-3.5 sm:px-6 sm:pb-6 sm:pt-4.5">
                <p className="max-w-4xl text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
