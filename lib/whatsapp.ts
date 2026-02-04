import twilio from "twilio";
import { prisma } from "@/lib/prisma";

type DepositSlipWhatsAppInput = {
  slipId: string;
  companyId: string | null;
  amount: string;
  currency: string;
  status?: string | null;
  ocrStatus?: string | null;
};

type TwilioWhatsAppConfig = {
  sid: string;
  token: string;
  from: string;
  to: string;
};

let cachedTwilioClient: ReturnType<typeof twilio> | null = null;

function normalizeWhatsAppNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("whatsapp:") ? trimmed : `whatsapp:${trimmed}`;
}

function extractMovementId(notes: string | null | undefined) {
  if (!notes) return null;
  const m = notes.match(/movementId:([a-zA-Z0-9_-]+)/);
  return m?.[1] ?? null;
}

function getRequiredEnv(
  keys: string[],
  missing: string[],
  label: string,
  context: { slipId: string; companyId: string | null; amount: string; status: string }
) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  missing.push(label);
  console.warn("whatsapp:missing_env", {
    slipId: context.slipId,
    companyId: context.companyId,
    amount: context.amount,
    status: context.status,
    missing: [label],
  });
  return null;
}

function getWhatsAppConfig(context: {
  slipId: string;
  companyId: string | null;
  amount: string;
  status: string;
}): TwilioWhatsAppConfig | null {
  const missing: string[] = [];
  const sid = getRequiredEnv(["TWILIO_ACCOUNT_SID"], missing, "TWILIO_ACCOUNT_SID", context);
  const token = getRequiredEnv(["TWILIO_AUTH_TOKEN"], missing, "TWILIO_AUTH_TOKEN", context);
  const fromRaw = getRequiredEnv(
    ["TWILIO_WHATSAPP_FROM", "TWILIO_FROM"],
    missing,
    "TWILIO_WHATSAPP_FROM|TWILIO_FROM",
    context
  );
  const toRaw = getRequiredEnv(
    ["ADMIN_WHATSAPP_TO", "WHATSAPP_ADMIN_TO"],
    missing,
    "ADMIN_WHATSAPP_TO|WHATSAPP_ADMIN_TO",
    context
  );

  if (missing.length) {
    return null;
  }

  return {
    sid: sid as string,
    token: token as string,
    from: normalizeWhatsAppNumber(fromRaw as string),
    to: normalizeWhatsAppNumber(toRaw as string),
  };
}

function buildDepositSlipMessage(opts: {
  slipId: string;
  companyId: string | null;
  amount: string | null;
  currency: string;
  status: string;
  ocrStatus?: string | null;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || null;
  const link = baseUrl ? `${baseUrl.replace(/\/$/, "")}/treasury/pending` : null;
  const amountLine = opts.amount ? `${opts.amount} ${opts.currency}` : "unknown";
  const statusLower = String(opts.status || "").toLowerCase();
  const isPending = statusLower !== "approved" && statusLower !== "rejected";

  const lines = [
    isPending ? "🧾 Depósito pendiente" : "🧾 Depósito actualizado",
    `slipId: ${opts.slipId}`,
    `empresa: ${opts.companyId ?? "unknown"}`,
    `monto: ${amountLine}`,
    `estado: ${opts.status}${opts.ocrStatus ? ` / ocr: ${opts.ocrStatus}` : ""}`,
    link ? `link: ${link}` : null,
  ];

  if (isPending) {
    lines.push("", "Responde:", `aprobar ${opts.slipId}`, `rechazar ${opts.slipId}`);
  }

  return lines.filter(Boolean).join("\n");
}

export async function sendDepositSlipWhatsApp(input: DepositSlipWhatsAppInput) {
  try {
    const slip = await prisma.depositSlip.findUnique({
      where: { id: input.slipId },
      select: {
        notes: true,
        status: true,
        ocrStatus: true,
        parsedAmountClp: true,
        declaredAmountClp: true,
      },
    });

    if (!slip) {
      console.error("whatsapp:send_error", {
        slipId: input.slipId,
        companyId: input.companyId,
        amount: input.amount,
        status: input.status ?? "unknown",
        error: "SLIP_NOT_FOUND",
      });
      return { ok: false, error: "SLIP_NOT_FOUND" };
    }

    if (slip.notes?.includes("whatsapp_sent")) {
      console.info("whatsapp:skip_sent", {
        slipId: input.slipId,
        companyId: input.companyId,
        amount: input.amount,
        status: input.status ?? slip.status ?? "unknown",
      });
      return { ok: true, skipped: true };
    }

    const status = input.status ?? slip.status ?? "unknown";
    const ocrStatus = input.ocrStatus ?? slip.ocrStatus ?? null;

    let amountUsed: string | null = input.amount || null;
    let amountSource = input.amount ? "input" : "unknown";

    if (slip.parsedAmountClp != null) {
      amountUsed = slip.parsedAmountClp.toString();
      amountSource = "parsedAmountClp";
    } else if (slip.declaredAmountClp != null) {
      amountUsed = slip.declaredAmountClp.toString();
      amountSource = "declaredAmountClp";
    } else {
      const movementId = extractMovementId(slip.notes);
      if (movementId) {
        const movement = await prisma.treasuryMovement.findUnique({
          where: { id: movementId },
          select: { amount: true },
        });
        if (movement?.amount != null) {
          amountUsed = movement.amount.toString();
          amountSource = "movement.amount";
        }
      }
    }

    console.info("whatsapp.amount_used", {
      slipId: input.slipId,
      amountUsed,
      source: amountSource,
      currency: input.currency,
    });

    const config = getWhatsAppConfig({
      slipId: input.slipId,
      companyId: input.companyId,
      amount: amountUsed ?? input.amount,
      status,
    });
    if (!config) {
      console.info("whatsapp:send_attempt", {
        slipId: input.slipId,
        companyId: input.companyId,
        amount: input.amount,
        status,
        from: null,
        to: null,
      });
      return { ok: false, error: "MISSING_ENV" };
    }

    console.info("whatsapp:send_attempt", {
      slipId: input.slipId,
      companyId: input.companyId,
      amount: input.amount,
      status,
      from: config.from,
      to: config.to,
    });

    try {
      if (!cachedTwilioClient) {
        cachedTwilioClient = twilio(config.sid, config.token);
      }
      const client = cachedTwilioClient;

      console.info("whatsapp:before_create", {
        slipId: input.slipId,
        from: config.from,
        to: config.to,
      });

      const message = await client.messages.create({
        from: config.from,
        to: config.to,
        body: buildDepositSlipMessage({
          slipId: input.slipId,
          companyId: input.companyId,
          amount: amountUsed ?? input.amount,
          currency: input.currency,
          status,
          ocrStatus,
        }),
      });

      console.info("whatsapp:send_ok", {
        slipId: input.slipId,
        messageSid: message.sid,
      });

      const stamp = `whatsapp_sent:${new Date().toISOString()}`;
      const nextNotes = slip.notes ? `${slip.notes} | ${stamp}` : stamp;
      await prisma.depositSlip.update({
        where: { id: input.slipId },
        data: { notes: nextNotes },
      });

      return { ok: true, messageSid: message.sid };
    } catch (e: any) {
      console.error("whatsapp:send_error", {
        slipId: input.slipId,
        companyId: input.companyId,
        amount: input.amount,
        slipStatus: status,
        twilioCode: e?.code ?? null,
        httpStatus: e?.status ?? null,
        error: String(e?.message ?? e),
      });
      return { ok: false, error: "SEND_FAILED" };
    }
  } catch (e: any) {
    console.error("whatsapp:send_error", {
      slipId: input.slipId,
      companyId: input.companyId,
      amount: input.amount,
      status: input.status ?? "unknown",
      error: String(e?.message ?? e),
    });
    return { ok: false, error: "UNEXPECTED_ERROR" };
  }
}
