import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";
import { validate as isUuid } from "uuid";
import { envFlag, parseAllowlist, requireEnv } from "@/lib/env";
import { approveClpDepositBySlip, rejectClpDepositBySlip } from "@/lib/treasury/manualClpDeposits";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

function normalizeWhatsAppNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("whatsapp:") ? trimmed : `whatsapp:${trimmed}`;
}

/**
 * Espera mensajes tipo:
 *  - "aprobar <slipId> <monto>"
 *  - "rechazar <slipId>"
 *  - "help"
 *
 * Responde por WhatsApp usando Twilio SDK.
 */
export async function POST(req: Request) {
  try {
    const correlationId =
      req.headers.get("x-correlation-id") ??
      req.headers.get("x-request-id") ??
      randomUUID();

    const form = await req.formData();

    const from = (form.get("From") || "").toString(); // "whatsapp:+569..."
    const bodyRaw = (form.get("Body") || "").toString();
    const body = bodyRaw.trim().toLowerCase();

    console.log("[TWILIO WHATSAPP INBOUND]", { from, bodyRaw });

    const approvalsEnabled = envFlag("FEATURE_WHATSAPP_APPROVAL", false);
    if (!approvalsEnabled) {
      console.warn("whatsapp:approvals_disabled");
      return NextResponse.json({ ok: true });
    }

    const url = new URL(req.url);
    const tokenParam = url.searchParams.get("token");
    const tokenHeader = req.headers.get("x-webhook-token");
    const webhookToken = process.env.TWILIO_WEBHOOK_TOKEN;
    if (!webhookToken) {
      console.error("whatsapp:webhook_token_missing");
      return NextResponse.json({ error: "Webhook token missing" }, { status: 500 });
    }
    if (tokenParam !== webhookToken && tokenHeader !== webhookToken) {
      console.warn("whatsapp:webhook_token_invalid");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowlistRaw = parseAllowlist(process.env.WHATSAPP_ADMIN_ALLOWLIST);
    const fallbackAdmin =
      process.env.ADMIN_WHATSAPP_TO ?? process.env.WHATSAPP_ADMIN_TO ?? "";
    if (fallbackAdmin) allowlistRaw.push(fallbackAdmin);

    const allowlist = new Set(
      allowlistRaw.map((n) => normalizeWhatsAppNumber(n)).filter(Boolean)
    );

    if (!allowlist.size || !allowlist.has(normalizeWhatsAppNumber(from))) {
      return NextResponse.json({ ok: true });
    }

    const sid = requireEnv(["TWILIO_ACCOUNT_SID"], "TWILIO_ACCOUNT_SID");
    const token = requireEnv(["TWILIO_AUTH_TOKEN"], "TWILIO_AUTH_TOKEN");
    const waFrom = requireEnv(["TWILIO_WHATSAPP_FROM", "TWILIO_FROM"], "TWILIO_WHATSAPP_FROM");

    const client = twilio(sid, token);

    const reply = async (text: string) => {
      await client.messages.create({
        from: waFrom,
        to: from,
        body: text,
      });
    };

    // HELP
    if (body === "help" || body === "ayuda" || body === "?") {
      await reply(
        [
          "Comandos:",
          "aprobar <slipId> [monto_clp]",
          "rechazar <slipId>",
        ].join("\n")
      );
      return NextResponse.json({ ok: true });
    }

    // Parse comandos
    const parts = bodyRaw.trim().split(/\s+/);
    const cmd = (parts[0] || "").toLowerCase();

    // aprobar <slipId> [monto]
    if (cmd === "aprobar" || cmd === "approve") {
      const slipId = parts[1];
      const amountStr = parts[2];

      if (!slipId) {
        await reply("❌ Formato: aprobar <slipId> [monto_clp]");
        return NextResponse.json({ ok: true });
      }

      if (!isUuid(slipId)) {
        await reply("❌ slipId inválido (debe ser UUID).");
        return NextResponse.json({ ok: true });
      }

      const amountProvided = amountStr ?? null;
      let amountClp: number | null = null;
      let amountSource: string | null = null;

      if (amountStr) {
        const parsedAmount = Number(String(amountStr).replace(/[^\d]/g, ""));
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          console.error("whatsapp:approve_fail", { slipId, error: "invalid_amount" });
          await reply("❌ Monto inválido. Usa números enteros en CLP.");
          return NextResponse.json({ ok: true });
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
          await reply("❌ slipId inválido (no encontrado).");
          return NextResponse.json({ ok: true });
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
        await reply(`❌ Falta monto. Responde: aprobar ${slipId} 2000`);
        return NextResponse.json({ ok: true });
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
        await reply(`✅ Aprobado ${slipId} por ${Math.round(amountClp)} CLP`);
      } catch (e: any) {
        console.error("Approve error:", e?.message || e);
        console.error("whatsapp:approve_fail", { slipId, error: e?.message || String(e) });
        await reply(`❌ Error aprobando\n${e?.message || "unknown"}`);
      }

      return NextResponse.json({ ok: true });
    }

    // rechazar <slipId>
    if (cmd === "rechazar" || cmd === "reject") {
      const slipId = parts[1];

      if (!slipId) {
        await reply("❌ Formato: rechazar <slipId>");
        return NextResponse.json({ ok: true });
      }

      if (!isUuid(slipId)) {
        await reply("❌ slipId inválido (debe ser UUID). Ej: rechazar d3febf9e-...");
        return NextResponse.json({ ok: true });
      }

      try {
        await rejectClpDepositBySlip({
          slipId,
          channel: "whatsapp",
          actorUserId: null,
          correlationId,
        });

        await reply(`✅ Rechazado\nslipId: ${slipId}\nstatus: rejected`);
      } catch (e: any) {
        console.error("Reject error:", e?.message || e);
        await reply(`❌ Error rechazando\n${e?.message || "unknown"}`);
      }

      return NextResponse.json({ ok: true });
    }

    // default
    await reply('No entendí. Escribe "help".');
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("TWILIO WEBHOOK ERROR:", e?.message || e);
    // Twilio quiere 200 igual
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
