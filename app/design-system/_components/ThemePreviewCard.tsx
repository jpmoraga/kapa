import Image from "next/image";

import { Container } from "@/components/site/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ThemeName = "platform" | "consulting" | "partnership";

type PaletteToken = {
  label: string;
  value: string;
};

type ThemePreviewCardProps = {
  description: string;
  logoSrc: string;
  note: string;
  palette: PaletteToken[];
  status: string;
  theme: ThemeName;
  title: string;
};

export function ThemePreviewCard({
  description,
  logoSrc,
  note,
  palette,
  status,
  theme,
  title,
}: ThemePreviewCardProps) {
  return (
    <div data-theme={theme}>
      <Card className="h-full p-0">
        <div className="border-b border-border px-6 py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <Image src={logoSrc} alt="Kapa21" width={170} height={42} unoptimized />
            <Badge variant="accent">{status}</Badge>
          </div>
          <div className="grid gap-3">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="text-sm leading-7 text-foreground-muted">{description}</p>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {palette.map((token) => (
              <div
                key={token.label}
                className="rounded-[var(--radius-md)] border border-border bg-surface-elevated px-3 py-3"
              >
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
                  {token.label}
                </span>
                <strong className="mt-2 block text-sm text-foreground">{token.value}</strong>
              </div>
            ))}
          </div>

          <p className="text-sm leading-7 text-foreground-muted">{note}</p>

          <Container width="wide" className="px-0">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </Container>
        </div>
      </Card>
    </div>
  );
}
