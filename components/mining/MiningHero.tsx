import Image from "next/image";

import { Container } from "@/components/site/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type MiningHeroProps = {
  primaryCtaHref: string;
  secondaryCtaHref: string;
};

const heroConcepts = [
  {
    title: "Capacidad",
    body: "Escala desde tickets bajos hasta ASIC propio, según tu presupuesto y horizonte.",
  },
  {
    title: "Operación",
    body: "Hosting internacional en Emiratos Árabes Unidos, con costos energéticos competitivos.",
  },
  {
    title: "Acompañamiento",
    body: "Kapa21 acompaña la evaluación y coordina el proceso comercial de punta a punta.",
  },
] as const;

const heroTrustSignals = [
  "Desde tickets bajos",
  "Activación hasta 7 días",
  "Uptime contractual 95%",
  "Producción a wallet en ASIC propio",
] as const;

export function MiningHero({ primaryCtaHref, secondaryCtaHref }: MiningHeroProps) {
  return (
    <Container
      width="wide"
      className="grid gap-6 px-5 pb-4 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:items-start lg:gap-11 lg:px-8 lg:pb-10 lg:pt-8"
    >
      <div className="grid gap-4 sm:gap-5">
        <Badge
          variant="outline"
          className="justify-start border-accent/35 px-2.25 py-1 text-[0.7rem] tracking-[0.14em] text-accent sm:text-[0.74rem]"
        >
          KAPA21 MINING
        </Badge>

        <div className="grid gap-3 sm:gap-4">
          <h1 className="max-w-5xl text-balance text-[clamp(2.8rem,12vw,4.4rem)] leading-[0.96] font-semibold tracking-[-0.05em] text-foreground sm:text-[3.35rem] lg:text-[4.7rem]">
            Minería de Bitcoin en Emiratos Árabes, con energía competitiva
          </h1>
          <p className="max-w-[34rem] text-[1rem] leading-6 text-foreground-muted sm:text-[1.08rem] sm:leading-7 lg:max-w-[43rem] lg:text-[1.26rem] lg:leading-9">
            Accede a minería fraccionada, fracción de ASIC por vida útil del equipo o
            ASIC propio con hosting internacional.
          </p>
        </div>

        <div className="grid max-w-sm gap-2 sm:flex sm:max-w-none sm:flex-wrap sm:gap-3">
          <Button
            href={primaryCtaHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="min-h-11 rounded-full px-4 text-sm sm:w-auto sm:min-h-11 sm:px-4"
          >
            Hablar con Kapa21
          </Button>
          <Button
            href={secondaryCtaHref}
            variant="secondary"
            className="min-h-11 rounded-full px-4 text-sm sm:w-auto sm:min-h-11 sm:px-4"
          >
            Ver alternativas
          </Button>
        </div>

        <div className="flex max-w-[23rem] items-center gap-2 rounded-[1.05rem] border border-[#ffb31e]/20 bg-[#23264f]/70 px-3 py-2 text-[0.84rem] leading-5 text-foreground shadow-none sm:max-w-fit sm:gap-3 sm:rounded-full sm:px-3.5 sm:py-2.5 sm:text-sm sm:shadow-[var(--shadow)]">
          <Image
            src="/mining/partners/andes-solarhash-symbol-blue-bg.jpg"
            alt="Símbolo Andes SolarHash"
            width={32}
            height={32}
            className="size-7 rounded-full border border-white/8 object-cover sm:size-8"
            sizes="32px"
          />
          <span className="font-medium">Operación minera junto a Andes SolarHash</span>
        </div>
      </div>

      <Card
        variant="elevated"
        className="relative overflow-hidden rounded-[1.2rem] border-[#3a4265] p-4 shadow-none sm:rounded-[1.3rem] sm:p-6 sm:shadow-[var(--shadow)] lg:p-8"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-[#ffb31e]/60 to-transparent sm:inset-x-8 sm:top-8"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-4 size-28 rounded-full bg-[#2d356e]/35 blur-3xl sm:top-5 sm:size-40"
        />
        <div className="relative grid gap-3.5 sm:gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
            <Badge
              variant="outline"
              className="justify-start border-[#ffb31e]/30 px-2 py-1 text-[0.66rem] tracking-[0.14em] text-[#ffb31e] sm:px-2.25 sm:text-[0.7rem]"
            >
              Kapa21 primero
            </Badge>
            <span className="text-[0.82rem] text-foreground-muted sm:text-sm">Partner operativo coordinado</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {heroTrustSignals.map((signal) => (
              <span
                key={signal}
                className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.76rem] font-medium text-foreground-muted sm:text-[0.8rem]"
              >
                {signal}
              </span>
            ))}
          </div>

          <div className="grid gap-2.5 sm:gap-3">
            {heroConcepts.map((item, index) => (
              <div
                key={item.title}
                className="grid gap-2 rounded-[0.95rem] border border-border bg-background/70 p-3 backdrop-blur-sm sm:gap-3 sm:p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-muted sm:text-[11px]">
                    {item.title}
                  </span>
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent text-[10px] font-semibold tracking-[0.12em] text-accent-foreground sm:size-8 sm:text-[11px]">
                    0{index + 1}
                  </span>
                </div>
                <p className="text-[0.95rem] leading-6 text-foreground-muted sm:text-base sm:leading-7">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Container>
  );
}
