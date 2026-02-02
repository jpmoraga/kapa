import { prisma } from "@/lib/prisma";
import { validate as isUuid } from "uuid";
import { envFlag, parseAllowlist } from "@/lib/env";
import { approveClpDepositBySlip, rejectClpDepositBySlip } from "@/lib/treasury/manualClpDeposits";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function normalizeWhatsAppNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("whatsapp:") ? trimmed : `whatsapp:${trimmed}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twimlResponse(message: string | null, status = 200) {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new Response(body, {
    status,
    headers: { "content-type": "text/xml; charset=utf-8" },
  });
}

/**
 * Espera mensajes tipo:
 *  - "aprobar <slipId> <monto>"
 *  - "rechazar <slipId>"
 *  - "help"
 *
 * Responde con TwiML para evitar reintentos de Twilio.
 */
async function handleWebhook(req: Request) {
  const url = new URL(req.url);
  const tokenParam = url.searchParams.get("token");
  const tokenHeader = req.headers.get("x-webhook-token");
  const webhookToken = process.env.TWILIO_WEBHOOK_TOKEN;

  let from = "";
  let bodyRaw = "";

  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      from = (params.get("From") || "").toString();
      bodyRaw = (params.get("Body") || "").toString();
    } else {
      const form = await req.formData();
      from = (form.get("From") || "").toString();
      bodyRaw = (form.get("Body") || "").toString();
    }
  } else {
    from = (url.searchParams.get("From") || "").toString();
    bodyRaw = (url.searchParams.get("Body") || "").toString();
  }

  const body = bodyRaw.trim().toLowerCase();
  const hasToken = Boolean(tokenParam || tokenHeader);
  let finalStatus = 200;

  console.info("whatsapp:webhook_inbound", {
    method: req.method,
    url: req.url,
    hasToken,
    from,
    bodyRaw,
  });

  try {
    const correlationId =
      req.headers.get("x-correlation-id") ??
      req.headers.get("x-request-id") ??
      randomUUID();

    const approvalsEnabled = envFlag("FEATURE_WHATSAPP_APPROVAL", false);
    if (!approvalsEnabled) {
      console.warn("whatsapp:approvals_disabled");
      finalStatus = 200;
      return twimlResponse("OK", finalStatus);
    }

    if (!webhookToken) {
      console.error("whatsapp:webhook_token_missing");
      finalStatus = 500;
      return twimlResponse("Webhook token missing", finalStatus);
    }
    if (tokenParam !== webhookToken && tokenHeader !== webhookToken) {
      console.warn("whatsapp:webhook_token_invalid");
      finalStatus = 401;
      return twimlResponse("Unauthorized", finalStatus);
    }

    const allowlistRaw = parseAllowlist(process.env.WHATSAPP_ADMIN_ALLOWLIST);
    const fallbackAdmin =
      process.env.ADMIN_WHATSAPP_TO ?? process.env.WHATSAPP_ADMIN_TO ?? "";
    if (fallbackAdmin) allowlistRaw.push(fallbackAdmin);

    const allowlist = new Set(
      allowlistRaw.map((n) => normalizeWhatsAppNumber(n)).filter(Boolean)
    );

    if (!allowlist.size || !allowlist.has(normalizeWhatsAppNumber(from))) {
      finalStatus = 200;
      return twimlResponse("OK", finalStatus);
    }

    // HELP
    if (body === "help" || body === "ayuda" || body === "?") {
      finalStatus = 200;
      return twimlResponse(
        [
          "Comandos:",
          "aprobar <slipId> [monto_clp]",
          "rechazar <slipId>",
        ].join("\n")
      );
    }

    // Parse comandos
    const parts = bodyRaw.trim().split(/\s+/);
    const cmd = (parts[0] || "").toLowerCase();

    // aprobar <slipId> [monto]
    if (cmd === "aprobar" || cmd === "approve") {
      const slipId = parts[1];
      const amountStr = parts[2];

      if (!slipId) {
        finalStatus = 200;
        return twimlResponse("❌ Formato: aprobar <slipId> [monto_clp]", finalStatus);
      }

      if (!isUuid(slipId)) {
        finalStatus = 200;
        return twimlResponse("❌ slipId inválido (debe ser UUID).", finalStatus);
      }

      const amountProvided = amountStr ?? null;
      let amountClp: number | null = null;
      let amountSource: string | null = null;

      if (amountStr) {
        const parsedAmount = Number(String(amountStr).replace(/[^\d]/g, ""));
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          console.error("whatsapp:approve_fail", { slipId, error: "invalid_amount" });
          finalStatus = 200;
          return twimlResponse("❌ Monto inválido. Usa números enteros en CLP.", finalStatus);
        }
        amountClp = Math.round(parsedAmount);
        amountSource = "provided";
      } else {
        const slipForAmount = await prisma.depositSlip.findUnique({
          where: { id: slipId },
          select: { notes: true, parsedAmountClp: true, declaredAmountClp: true },
        });

        if (!slipForAmount) {
          console.error("whatsapp:approve_fail", { slipId, error: "slip_not_found" });
          finalStatus = 200;
          return twimlResponse("❌ slipId inválido (no encontrado).", finalStatus);
        }

        if (slipForAmount.parsedAmountClp != null) {
          amountClp = Number(slipForAmount.parsedAmountClp);
          amountSource = "parsedAmountClp";
        } else if (slipForAmount.declaredAmountClp != null) {
          amountClp = Number(slipForAmount.declaredAmountClp);
          amountSource = "declaredAmountClp";
        }

      }

      console.info("whatsapp:approve_cmd", {
        slipId,
        amountProvided,
        amountClp,
        source: amountSource ?? "unknown",
      });

      if (!amountClp || !Number.isFinite(amountClp) || amountClp <= 0) {
        console.error("whatsapp:approve_fail", { slipId, error: "missing_amount" });
        finalStatus = 200;
        return twimlResponse(`❌ Falta monto. Responde: aprobar ${slipId} 2000`, finalStatus);
      }

      try {
        await approveClpDepositBySlip({
          slipId,
          amountClp,
          channel: "whatsapp",
          actorUserId: null,
          correlationId,
        });

        console.info("whatsapp:approve_ok", { slipId, amountClp });
        finalStatus = 200;
        return twimlResponse(
          `✅ Aprobado ${slipId} por ${Math.round(amountClp)} CLP`,
          finalStatus
        );
      } catch (e: any) {
        console.error("Approve error:", e?.message || e);
        console.error("whatsapp:approve_fail", { slipId, error: e?.message || String(e) });
        finalStatus = 200;
        return twimlResponse(`❌ Error aprobando\n${e?.message || "unknown"}`, finalStatus);
      }
    }

    // rechazar <slipId>
    if (cmd === "rechazar" || cmd === "reject") {
      const slipId = parts[1];

      if (!slipId) {
        finalStatus = 200;
        return twimlResponse("❌ Formato: rechazar <slipId>", finalStatus);
      }

      if (!isUuid(slipId)) {
        finalStatus = 200;
        return twimlResponse(
          "❌ slipId inválido (debe ser UUID). Ej: rechazar d3febf9e-...",
          finalStatus
        );
      }

      try {
        await rejectClpDepositBySlip({
          slipId,
          channel: "whatsapp",
          actorUserId: null,
          correlationId,
        });

        finalStatus = 200;
        return twimlResponse(`✅ Rechazado\nslipId: ${slipId}\nstatus: rejected`, finalStatus);
      } catch (e: any) {
        console.error("Reject error:", e?.message || e);
        finalStatus = 200;
        return twimlResponse(`❌ Error rechazando\n${e?.message || "unknown"}`, finalStatus);
      }
    }

    // default
    finalStatus = 200;
    return twimlResponse('No entendí. Escribe "help".', finalStatus);
  } catch (e: any) {
    console.error("TWILIO WEBHOOK ERROR:", e?.message || e);
    // Twilio quiere 200 igual
    finalStatus = 200;
    return twimlResponse("Error", finalStatus);
  } finally {
    console.info("whatsapp:webhook_outbound", {
      method: req.method,
      url: req.url,
      status: finalStatus,
      hasToken,
      from,
      bodyRaw,
    });
  }
}

export async function POST(req: Request) {
  return handleWebhook(req);
}

export async function GET(req: Request) {
  return handleWebhook(req);
}
