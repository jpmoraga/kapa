export const CONTACT_EMAIL = "contacto@kapa21.cl";
export const CALENDLY_URL = "https://calendly.com/contacto-kapa21/30min";
export const WHATSAPP_NUMBER = "56971381604";

export function buildWhatsAppUrl(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function buildMailtoUrl(subject?: string) {
  if (!subject) {
    return `mailto:${CONTACT_EMAIL}`;
  }

  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
