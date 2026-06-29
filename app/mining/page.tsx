import type { Metadata } from "next";

import { AsicCatalog } from "@/components/mining/AsicCatalog";
import { Kapa21Role } from "@/components/mining/Kapa21Role";
import { MiningClientProfile } from "@/components/mining/MiningClientProfile";
import { MiningComparison } from "@/components/mining/MiningComparison";
import { MiningFaq } from "@/components/mining/MiningFaq";
import { MiningFinalCta } from "@/components/mining/MiningFinalCta";
import { MiningHero } from "@/components/mining/MiningHero";
import { MiningModalities } from "@/components/mining/MiningModalities";
import { MiningProcess } from "@/components/mining/MiningProcess";
import { MiningStructuredData } from "@/components/mining/MiningStructuredData";
import { MiningThesis } from "@/components/mining/MiningThesis";
import { MiningVariables } from "@/components/mining/MiningVariables";
import { OperatingPartner } from "@/components/mining/OperatingPartner";
import { MarketingFooter } from "@/components/site/MarketingFooter";
import { MarketingHeader } from "@/components/site/MarketingHeader";
import { Section } from "@/components/site/Section";
import {
  FRACTIONAL_LAUNCH_OFFER_WHATSAPP_TEXT,
  GENERAL_MINING_WHATSAPP_TEXT,
  MINING_MAIL_SUBJECT,
  getModalityWhatsAppText,
} from "@/data/mining/cta";
import {
  CALENDLY_URL,
  CONTACT_EMAIL,
  buildMailtoUrl,
  buildWhatsAppUrl,
} from "@/lib/publicContact";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kapa21.cl";
const PAGE_PATH = "/mining";
const PAGE_TITLE = "Minería Bitcoin | Kapa21";
const PAGE_DESCRIPTION =
  "Kapa21 te ayuda a evaluar minería fraccionada, fracción de ASIC y ASIC propio con hosting internacional en Emiratos Árabes Unidos.";

const heroPrimaryHref = buildWhatsAppUrl(GENERAL_MINING_WHATSAPP_TEXT);
const heroSecondaryHref = "#modalidades";
const fractionalHref = buildWhatsAppUrl(FRACTIONAL_LAUNCH_OFFER_WHATSAPP_TEXT);
const tokenizedHref = buildWhatsAppUrl(getModalityWhatsAppText("tokenized"));
const hostingHref = buildWhatsAppUrl(getModalityWhatsAppText("asic-hosting"));
const mailtoHref = buildMailtoUrl(MINING_MAIL_SUBJECT);
const pageUrl = `${SITE_URL}${PAGE_PATH}`;

const headerNavItems = [
  { href: "/", label: "Inicio" },
  { href: "/consulting", label: "Consulting" },
  { href: "/mining", label: "Minería", current: true },
  { href: "#contacto", label: "Contacto" },
] as const;

const headerMobileNavItems = [
  { href: "/consulting", label: "Consulting" },
  { href: "/mining", label: "Minería", current: true },
  { href: "#contacto", label: "Contacto" },
] as const;

const footerNavLinks = [
  { href: "/", label: "Inicio" },
  { href: "/consulting", label: "Consulting" },
  { href: "/mining", label: "Minería" },
  { href: "/auth/login", label: "Entrar" },
] as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_PATH,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: "website",
    url: PAGE_PATH,
    siteName: "Kapa21",
    locale: "es_CL",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default function MiningPage() {
  return (
    <main data-theme="partnership" className="min-h-screen bg-background text-foreground">
      <MiningStructuredData
        pageDescription={PAGE_DESCRIPTION}
        pageTitle={PAGE_TITLE}
        pageUrl={pageUrl}
        siteUrl={SITE_URL}
      />

      <Section
        tone="default"
        spacing="none"
        className="overflow-hidden pt-0 pb-12 sm:pb-20 lg:pb-20"
        style={{
          backgroundImage:
            "radial-gradient(920px circle at 15% 10%, rgba(247, 147, 26, 0.16), transparent 38%), radial-gradient(760px circle at 84% 16%, rgba(45, 53, 110, 0.32), transparent 30%), linear-gradient(180deg, #171a1f 0%, #161920 100%)",
        }}
      >
        <MarketingHeader
          tone="dark"
          compactMobile
          hideLoginOnMobile
          mobileNavColumns={3}
          contactHref="#contacto"
          navItems={[...headerNavItems]}
          mobileNavItems={[...headerMobileNavItems]}
          primaryAction={{
            href: heroPrimaryHref,
            label: "Hablar con Kapa21",
            rel: "noopener noreferrer",
            target: "_blank",
            variant: "primary",
            className:
              "min-h-11 max-w-[10rem] px-3 text-[0.78rem] leading-[1.08] text-center sm:min-h-10 sm:max-w-none sm:px-3.5 sm:text-sm lg:min-h-11 lg:px-4",
          }}
        />
        <MiningHero primaryCtaHref={heroPrimaryHref} secondaryCtaHref={heroSecondaryHref} />
      </Section>

      <MiningThesis />
      <Kapa21Role />
      <MiningModalities
        fractionalHref={fractionalHref}
        tokenizedHref={tokenizedHref}
        hostingHref={hostingHref}
      />
      <MiningComparison ctaHref={heroPrimaryHref} />
      <AsicCatalog />
      <MiningProcess />
      <OperatingPartner />
      <MiningVariables />
      <MiningClientProfile />
      <MiningFaq />
      <MiningFinalCta
        contactEmail={CONTACT_EMAIL}
        primaryCtaHref={heroPrimaryHref}
        secondaryCtaHref={CALENDLY_URL}
        tertiaryCtaHref={mailtoHref}
      />

      <MarketingFooter
        tone="dark"
        compactMobile
        contactEmail={CONTACT_EMAIL}
        calendlyHref={CALENDLY_URL}
        navLinks={[...footerNavLinks]}
      />
    </main>
  );
}
