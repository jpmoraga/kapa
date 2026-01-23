import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";
import { validate as isUuid } from "uuid";
import { Prisma, AssetCode, TreasuryMovementStatus } from "@prisma/client";

export const runtime = "nodejs";

function extractMovementId(notes: string | null | undefined) {
  if (!notes) return null;
  // soporta "movementId:XXXX" en cualquier parte del texto
  const m = notes.match(/movementId:([a-zA-Z0-9_-]+)/);
  return m?.[1] ?? null;
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
    const form = await req.formData();

    const from = (form.get("From") || "").toString(); // "whatsapp:+569..."
    const bodyRaw = (form.get("Body") || "").toString();
    const body = bodyRaw.trim().toLowerCase();

    console.log("[TWILIO WHATSAPP INBOUND]", { from, bodyRaw });

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const waFrom = process.env.TWILIO_WHATSAPP_FROM; // sandbox number "whatsapp:+1415..."
    const adminTo = process.env.ADMIN_WHATSAPP_TO;   // tu número "whatsapp:+56..."

    // Seguridad mínima: solo aceptar comandos desde el admin
    if (!adminTo || from !== adminTo) {
      return NextResponse.json({ ok: true }); // no respondemos a cualquiera
    }

    if (!sid || !token || !waFrom) {
      console.warn("Missing Twilio env vars");
      return NextResponse.json({ ok: true });
    }

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
        } else {
          const movementId = extractMovementId(slipForAmount.notes);
          if (movementId) {
            const movement = await prisma.treasuryMovement.findUnique({
              where: { id: movementId },
              select: { amount: true, executedQuoteAmount: true },
            });
            if (movement?.executedQuoteAmount != null) {
              amountClp = Number(movement.executedQuoteAmount);
              amountSource = "movement.executedQuoteAmount";
            } else if (movement?.amount != null) {
              amountClp = Number(movement.amount);
              amountSource = "movement.amount";
            }
          }
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
        await prisma.$transaction(async (tx) => {
          // 1) Leer slip
          const slip = await tx.depositSlip.findUnique({
            where: { id: slipId },
            select: {
              id: true,
              status: true,
              notes: true,
            },
          });

          if (!slip) throw new Error("DepositSlip no existe");

          const movementId = extractMovementId(slip.notes);

          // 2) Aprobar slip (idempotente)
          const approvedNote = "Aprobado por WhatsApp (admin).";

          const slipUpdated = await tx.depositSlip.update({
            where: { id: slipId },
            data: {
              status: "approved",
              ocrStatus: "parsed",
              parsedAmountClp: BigInt(Math.round(amountClp)),
              notes: slip.notes
                ? (slip.notes.includes(approvedNote) ? slip.notes : `${slip.notes} | ${approvedNote}`)
                : approvedNote,
            },
            select: { id: true, status: true },
          });

          // Si no hay movementId, paramos acá
          if (!movementId) {
            return { slipUpdated, movementUpdated: null as any, credited: false };
          }

          // 3) Buscar movement
          const movement = await tx.treasuryMovement.findUnique({
            where: { id: movementId },
            select: {
              id: true,
              companyId: true,
              status: true,
              assetCode: true,
              type: true,
            },
          });

          if (!movement) {
            return { slipUpdated, movementUpdated: null as any, credited: false };
          }

          // Seguridad: solo CLP deposit
          if (movement.type !== "deposit" || movement.assetCode !== AssetCode.CLP) {
            return { slipUpdated, movementUpdated: null as any, credited: false };
          }

          // Idempotencia: si ya está APPROVED, no acreditamos de nuevo
          if (movement.status === TreasuryMovementStatus.APPROVED) {
            return { slipUpdated, movementUpdated: movement as any, credited: false };
          }

          // 4) Acreditar balance CLP
          const accClp = await tx.treasuryAccount.upsert({
            where: { companyId_assetCode: { companyId: movement.companyId, assetCode: AssetCode.CLP } },
            update: {},
            create: { companyId: movement.companyId, assetCode: AssetCode.CLP, balance: new Prisma.Decimal(0) },
            select: { balance: true },
          });

          await tx.treasuryAccount.update({
            where: { companyId_assetCode: { companyId: movement.companyId, assetCode: AssetCode.CLP } },
            data: { balance: new Prisma.Decimal(accClp.balance).plus(new Prisma.Decimal(Math.round(amountClp).toString())) },
          });

          // 5) Marcar movement como APPROVED + setear montos reales
          const movementUpdated = await tx.treasuryMovement.update({
            where: { id: movement.id },
            data: {
              status: TreasuryMovementStatus.APPROVED,
              amount: new Prisma.Decimal(Math.round(amountClp).toString()),
              executedQuoteAmount: new Prisma.Decimal(Math.round(amountClp).toString()),
              executedQuoteCode: AssetCode.CLP,
              executedSource: "whatsapp",
              approvedAt: new Date(),
            },
            select: { id: true, status: true },
          });

          return { slipUpdated, movementUpdated, credited: true };
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
        const updated = await prisma.depositSlip.update({
          where: { id: slipId },
          data: {
            status: "rejected",
            notes: "Rechazado por WhatsApp (admin).",
          },
          select: { id: true, status: true },
        });

        await reply(`✅ Rechazado\nslipId: ${updated.id}\nstatus: ${updated.status}`);
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
