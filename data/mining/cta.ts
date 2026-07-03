export type MiningModalityKey = "fractional" | "asic-hosting";

export const GENERAL_MINING_WHATSAPP_TEXT =
  "Hola, quiero conocer las alternativas de minería Bitcoin disponibles a través de Kapa21.";

export const MINING_MAIL_SUBJECT = "Minería Bitcoin | Kapa21";
export const FRACTIONAL_PLANS_WHATSAPP_TEXT =
  "Hola, quiero consultar por los planes de minería fraccionada de 15 y 27 meses a través de Kapa21.";

const modalityWhatsAppText: Record<MiningModalityKey, string> = {
  fractional:
    "Hola, quiero consultar por los planes de minería fraccionada y entender cómo funcionan a través de Kapa21.",
  "asic-hosting":
    "Hola, quiero cotizar un ASIC propio con hosting internacional y entender qué opción puede calzar conmigo.",
};

export function getModalityWhatsAppText(key: MiningModalityKey) {
  return modalityWhatsAppText[key];
}

export function buildAsicQuoteText(model: string) {
  return `Hola, quiero cotizar el ${model} y conocer sus condiciones de operación y hosting.`;
}
