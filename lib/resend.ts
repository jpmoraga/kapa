import { Resend } from "resend";

let cachedResend: Resend | null = null;

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY missing");
  }

  if (!cachedResend) {
    cachedResend = new Resend(apiKey);
  }

  return cachedResend;
}
