export type MiningModalityKey = "fractional" | "tokenized" | "asic-hosting";

export const GENERAL_MINING_WHATSAPP_TEXT =
  "Hola, quiero conocer las alternativas de minería Bitcoin disponibles a través de Kapa21.";

export const MINING_MAIL_SUBJECT = "Minería Bitcoin | Kapa21";
export const FRACTIONAL_LAUNCH_OFFER_WHATSAPP_TEXT =
  "Hola, quiero acceder a la oferta de minería fraccionada de 15 meses por USD 15 para 1 TH/s.";

const modalityWhatsAppText: Record<MiningModalityKey, string> = {
  fractional:
    "Hola, quiero consultar sobre minería fraccionada y entender cómo funciona esta alternativa a través de Kapa21.",
  tokenized:
    "Hola, quiero consultar sobre minería tokenizada y conocer sus condiciones operativas a través de Kapa21.",
  "asic-hosting":
    "Hola, quiero cotizar alternativas de equipos ASIC con hosting y entender qué opción puede calzar conmigo.",
};

export function getModalityWhatsAppText(key: MiningModalityKey) {
  return modalityWhatsAppText[key];
}

export function buildAsicQuoteText(model: string) {
  return `Hola, quiero cotizar el ${model} y conocer sus condiciones de operación y hosting.`;
}
