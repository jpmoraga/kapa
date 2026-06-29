import { miningFaqItems } from "@/data/mining/faq";

type MiningStructuredDataProps = {
  pageDescription: string;
  pageTitle: string;
  pageUrl: string;
  siteUrl: string;
};

export function MiningStructuredData({
  pageDescription,
  pageTitle,
  pageUrl,
  siteUrl,
}: MiningStructuredDataProps) {
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageTitle,
    description: pageDescription,
    url: pageUrl,
    inLanguage: "es-CL",
    isPartOf: {
      "@type": "WebSite",
      name: "Kapa21",
      url: siteUrl,
    },
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Minería de Bitcoin en Emiratos Árabes con Kapa21",
    serviceType: "Orientación comercial para minería Bitcoin",
    description: pageDescription,
    url: pageUrl,
    areaServed: "CL",
    availableLanguage: "es-CL",
    provider: {
      "@type": "Organization",
      name: "Kapa21",
      url: siteUrl,
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: miningFaqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
