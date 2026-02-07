// web/app/api/treasury/movements/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { getOnboardingStatus } from "@/lib/onboardingStatus";
import { AssetCode, Prisma, TreasuryMovementStatus } from "@prisma/client";
import { computeTradeFee, getTradeFeePercent } from "@/lib/fees";
import { supabaseServer } from "@/lib/supabaseServer";
import twilio from "twilio";
import { sendDepositSlipWhatsApp } from "@/lib/whatsapp";


import { requireCanOperate } from "@/lib/guards/requireCanOperate";
import { approveMovementAsSystem } from "@/lib/treasury/approveMovement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MovementType = "deposit" | "withdraw" | "adjust";

function logEvent(event: string, payload: Record<string, unknown>) {
  console.info(JSON.stringify({ event, ...payload }));
}

function normalizeAssetCode(input: any): AssetCode {
  const v = String(input ?? "").trim().toUpperCase();
  if (v === "BTC") return AssetCode.BTC;
  if (v === "CLP") return AssetCode.CLP;
  if (v === "USD") return AssetCode.USD;
  return AssetCode.BTC;
}

function normalizeMovementType(input: any): MovementType | null {
  const v = String(input ?? "").trim().toLowerCase();
  if (v === "buy") return "deposit";
  if (v === "sell") return "withdraw";
  if (v === "deposit" || v === "withdraw" || v === "adjust") return v as MovementType;
  return null;
}

function isMultipart(req: Request) {
  const ct = req.headers.get("content-type") || "";
  return ct.toLowerCase().includes("multipart/form-data");
}

function safeExtFromMime(mime: string) {
  const m = String(mime || "").toLowerCase();
  if (m === "application/pdf") return "pdf";
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  return null;
}

async function fetchSpotPriceForTradeAsset(assetCode: AssetCode) {
  const marketId = assetCode === AssetCode.BTC ? "btc-clp" : "usdt-clp";
  const budaUrl = `https://www.buda.com/api/v2/markets/${marketId}/trades?limit=50`;
  const res = await fetch(budaUrl, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`BUDA_${res.status}`);
  const data = await res.json().catch(() => null);
  const entries = data?.trades?.entries ?? [];
  if (!Array.isArray(entries) || entries.length === 0) throw new Error("NO_TRADES");
  const latest = entries.reduce(
    (acc: any[] | null, curr: any[]) => {
      if (!Array.isArray(curr) || curr.length < 3) return acc;
      if (!acc) return curr;
      return Number(curr[0]) > Number(acc[0]) ? curr : acc;
    },
    null
  );
  if (!latest) throw new Error("NO_TRADES");
  const priceStr = latest[2];
  const n = Number(String(priceStr ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) throw new Error("BAD_PRICE");
  return String(priceStr);
}

async function uploadReceiptToSupabase(opts: {
  userId: string;
  file: File;
}) {
  const bucket = "deposit-slips";

  const ext = safeExtFromMime(opts.file.type);
  if (!ext) throw new Error("BAD_FILE_TYPE");

  const MAX_BYTES = 10 * 1024 * 1024;
  if (opts.file.size > MAX_BYTES) throw new Error("FILE_TOO_LARGE");

  const path = `user/${opts.userId}/deposit-slip-${Date.now()}.${ext}`;

  const arrayBuffer = await opts.file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error } = await supabaseServer.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: opts.file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) throw new Error(`SUPABASE_UPLOAD_ERROR: ${error.message}`);

  return { bucket, path };
}

async function notifyAdminWhatsApp(text: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const waFrom = process.env.TWILIO_WHATSAPP_FROM; // "whatsapp:+1415..."
  const adminTo = process.env.ADMIN_WHATSAPP_TO;   // "whatsapp:+56..."

  if (!sid || !token || !waFrom || !adminTo) {
    console.warn("[notifyAdminWhatsApp] Missing env vars");
    return;
  }

  const client = twilio(sid, token);
  await client.messages.create({
    from: waFrom,
    to: adminTo,
    body: text,
  });
}


export async function POST(req: Request) {
  const correlationId =
    req.headers.get("x-correlation-id") ??
    req.headers.get("x-request-id") ??
    randomUUID();
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const onboarding = await getOnboardingStatus(user.id);
  if (!onboarding.canOperate) {
    return NextResponse.json(
      {
        error: "Completa tu onboarding para operar.",
        onboarding,
      },
      { status: 403 }
    );
  }

  const membership = await prisma.companyUser.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: activeCompanyId } },
    select: { role: true },
  });
  if (!membership) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  // ====== Leer body (JSON o multipart) ======
  let type: MovementType = "deposit";
  let note: string | null = null;
  let amountStr = "";
  let assetCode: AssetCode = AssetCode.BTC;
  let receiptFile: File | null = null;
  let rawType: string | null = null;

  if (isMultipart(req)) {
    const fd = await req.formData();
    rawType = String(fd.get("type") ?? "").trim();
    note = String(fd.get("note") ?? "").trim() || null;
    amountStr = String(fd.get("amount") ?? "").trim();
    assetCode = normalizeAssetCode(fd.get("assetCode"));
    const f = fd.get("receipt");
    receiptFile = f instanceof File ? f : null;
  } else {
    const body = await req.json().catch(() => ({}));
    rawType = String(body.type ?? "").trim();
    note = String(body.note ?? "").trim() || null;
    amountStr = String(body.amount ?? "").trim();
    assetCode = normalizeAssetCode(body.assetCode);
  }

  const normalizedType = normalizeMovementType(rawType);
  if (!normalizedType) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  type = normalizedType;

  if (type === "deposit" && receiptFile) {
    assetCode = AssetCode.CLP;
  }

  if (!amountStr) {
    return NextResponse.json({ error: "Monto requerido" }, { status: 400 });
  }

  if (type === "deposit" && assetCode === AssetCode.CLP) {
    if (!receiptFile) {
      return NextResponse.json({ error: "Comprobante requerido (PDF/JPG/PNG)." }, { status: 400 });
    }
  }

  let amount: Prisma.Decimal;
  try {
    amount = new Prisma.Decimal(amountStr);
  } catch {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  const autoApproveDeposits = process.env.AUTO_APPROVE_DEPOSITS === "true";
  const autoApproveMaxClp = new Prisma.Decimal(process.env.AUTO_APPROVE_MAX_CLP ?? "0");
  const canAutoApprove =
    autoApproveDeposits && amount.lte(autoApproveMaxClp) && assetCode === AssetCode.CLP && type === "deposit";

  logEvent("trade:create_request", {
    correlationId,
    companyId: activeCompanyId,
    userId: user.id,
    type,
    assetCode,
    amount: amount.toString(),
  });

  if (type === "deposit" || type === "withdraw") {
    if (amount.lte(0)) return NextResponse.json({ error: "Monto debe ser > 0" }, { status: 400 });
  } else {
    if (amount.eq(0)) return NextResponse.json({ error: "Monto no puede ser 0" }, { status: 400 });
  }

  if (type === "adjust") {
    const role = String(membership.role ?? "").toLowerCase();
    if (role !== "admin" && role !== "owner") {
      return NextResponse.json({ error: "Solo admin/owner puede crear ajustes." }, { status: 403 });
    }
  }

  const isTradeFlow =
    (assetCode === AssetCode.BTC || assetCode === AssetCode.USD) &&
    (type === "deposit" || type === "withdraw");

  if (isTradeFlow) {
    let movementAmount = amount;
    let requestedPrice: Prisma.Decimal | null = null;
    let requestedQuoteAmount: Prisma.Decimal | null = null;

    if (type === "deposit") {
      try {
        const spotPriceStr = await fetchSpotPriceForTradeAsset(assetCode);
        requestedPrice = new Prisma.Decimal(spotPriceStr);
        if (requestedPrice.lte(0)) {
          return NextResponse.json({ error: "Precio spot inválido" }, { status: 502 });
        }
        requestedQuoteAmount = amount;
        movementAmount = amount.div(requestedPrice);
        console.log("TRADE_SPOT_PREFETCH", {
          assetCode,
          spotPrice: requestedPrice.toString(),
          executedQuoteAmount: requestedQuoteAmount.toString(),
        });
      } catch {
        return NextResponse.json({ error: "No se pudo obtener precio spot" }, { status: 502 });
      }
    }

    // Mantener la transacción ultra mínima para evitar timeouts.
    const movement = await prisma.$transaction(async (tx) =>
      tx.treasuryMovement.create({
        data: {
          companyId: activeCompanyId,
          assetCode,
          type,
          amount: movementAmount,
          createdByUserId: user.id,
          status: TreasuryMovementStatus.PROCESSING,
          executedPrice: requestedPrice ?? undefined,
          executedQuoteAmount: requestedQuoteAmount ?? undefined,
          executedQuoteCode: requestedQuoteAmount ? AssetCode.CLP : undefined,
          executedSource: requestedQuoteAmount ? "buda_trades" : undefined,
        },
        select: { id: true, status: true },
      })
    );

    logEvent("trade:movement_created", {
      correlationId,
      companyId: activeCompanyId,
      userId: user.id,
      movementId: movement.id,
      status: movement.status,
      type,
      assetCode,
      amount: amount.toString(),
    });

    logEvent("trade:approve_attempt", {
      correlationId,
      companyId: activeCompanyId,
      userId: user.id,
      movementId: movement.id,
    });

    let approved: any;
    try {
      approved = await approveMovementAsSystem({
        movementId: movement.id,
        companyId: activeCompanyId,
        actorUserId: user.id,
        correlationId,
        skipSync: true,
        requireSystemWallet: true,
      });
    } catch (e: any) {
      logEvent("trade:approve_error", {
        correlationId,
        companyId: activeCompanyId,
        userId: user.id,
        movementId: movement.id,
        error: e?.message ?? "Error ejecutando trade",
      });
      return NextResponse.json(
        { ok: false, movementId: movement.id, error: "No se pudo ejecutar de inmediato. Intenta más tarde." },
        { status: 409 }
      );
    }

    const approvedStatus = (approved as any)?.updated?.status ?? movement.status;
    if (approvedStatus !== TreasuryMovementStatus.APPROVED) {
      console.info("TRADE_CONFIRM_RESULT", {
        movementId: movement.id,
        path: "system_wallet",
        status: approvedStatus,
        isEstimated: true,
        executedAt: null,
      });
      return NextResponse.json(
        { ok: false, movementId: movement.id, error: "No se pudo ejecutar de inmediato. Intenta más tarde." },
        { status: 409 }
      );
    }

    const approvedMovement = await prisma.treasuryMovement.findFirst({
      where: { id: movement.id, companyId: activeCompanyId },
      select: {
        id: true,
        type: true,
        assetCode: true,
        amount: true,
        status: true,
        createdAt: true,
        executedAt: true,
        executedPrice: true,
        executedBaseAmount: true,
        executedQuoteAmount: true,
        executedFeeAmount: true,
        executedFeeCode: true,
        internalReason: true,
        externalOrderId: true,
        externalVenue: true,
      },
    });

    if (!approvedMovement) {
      return NextResponse.json(
        { ok: false, movementId: movement.id, error: "No se pudo ejecutar de inmediato. Intenta más tarde." },
        { status: 409 }
      );
    }

    const isBuy = approvedMovement.type === "deposit";
    const baseAmount = new Prisma.Decimal(approvedMovement.executedBaseAmount ?? approvedMovement.amount ?? 0);
    const price = approvedMovement.executedPrice ? new Prisma.Decimal(approvedMovement.executedPrice) : null;
    const feePct = getTradeFeePercent(approvedMovement.assetCode);
    const executedQuote =
      approvedMovement.executedQuoteAmount != null
        ? new Prisma.Decimal(approvedMovement.executedQuoteAmount as any)
        : null;
    const executedFee =
      approvedMovement.executedFeeAmount != null
        ? new Prisma.Decimal(approvedMovement.executedFeeAmount as any)
        : null;

    let grossPaidClp: Prisma.Decimal | null = null;
    let feeClp: Prisma.Decimal | null = null;
    let netClp: Prisma.Decimal | null = null;
    let grossAmount: Prisma.Decimal | null = null;
    let feeAmount: Prisma.Decimal | null = null;
    let netAmount: Prisma.Decimal | null = null;

    if (isBuy && executedQuote && executedFee) {
      grossPaidClp = executedQuote.plus(executedFee);
      feeClp = executedFee;
      netClp = grossPaidClp;
      grossAmount = grossPaidClp;
      feeAmount = feeClp;
      netAmount = netClp;
    } else {
      const grossQuote =
        approvedMovement.executedQuoteAmount != null
          ? new Prisma.Decimal(approvedMovement.executedQuoteAmount as any)
          : price
          ? price.mul(baseAmount)
          : null;

      const fallbackFeeAmount =
        approvedMovement.executedFeeAmount != null
          ? new Prisma.Decimal(approvedMovement.executedFeeAmount as any)
          : isBuy
          ? grossQuote
            ? computeTradeFee(grossQuote, feePct)
            : null
          : computeTradeFee(baseAmount, feePct);

      grossAmount = isBuy ? grossQuote : baseAmount;
      feeAmount = fallbackFeeAmount;
      netAmount =
        grossAmount && feeAmount
          ? isBuy
            ? grossAmount.plus(feeAmount)
            : grossAmount.minus(feeAmount)
          : null;
    }

    const hasExecuted = Boolean(approvedMovement.executedAt);
    const isEstimated = approvedMovement.status !== "APPROVED" || !hasExecuted;

    console.info("TRADE_CONFIRM_RESULT", {
      movementId: approvedMovement.id,
      path: "system_wallet",
      status: approvedMovement.status,
      isEstimated,
      executedAt: approvedMovement.executedAt,
    });

    return NextResponse.json({
      ok: true,
      traceId: correlationId,
      movementId: approvedMovement.id,
      status: approvedMovement.status,
      receipt: {
        ok: true,
        movementId: approvedMovement.id,
        side: isBuy ? "buy" : "sell",
        baseAsset: approvedMovement.assetCode,
        quoteAsset: "CLP",
        grossAmount: grossAmount ? grossAmount.toString() : null,
        feePercent: feePct.toString(),
        feeAmount: feeAmount ? feeAmount.toString() : null,
        feeCurrency: isBuy ? "CLP" : approvedMovement.assetCode,
        netAmount: netAmount ? netAmount.toString() : null,
        qty: baseAmount.toString(),
        price: price ? price.toString() : null,
        status: approvedMovement.status,
        createdAt: approvedMovement.createdAt,
        executedAt: approvedMovement.executedAt,
        isEstimated,
        message: null,
        internalReason: approvedMovement.internalReason,
        externalOrderId: approvedMovement.externalOrderId,
        externalVenue: approvedMovement.externalVenue,
      },
    });
  }

  const isDepositSlip = type === "deposit" && assetCode === AssetCode.CLP;
  if (isDepositSlip) {
    console.info("deposit_slip:create_entry", {
      companyId: activeCompanyId,
      userId: user.id,
      amount: amount.toString(),
    });
  }

  // ====== Crear movimiento PENDING y (si aplica) guardar attachment ======
  try {
    const out = await prisma.$transaction(async (tx) => {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      const ua = req.headers.get("user-agent") || "unknown";

      // 1) Crear movimiento
      const movement = await tx.treasuryMovement.create({
        data: {
          companyId: activeCompanyId,
          assetCode,
          type,
          amount,
          note,
          createdByUserId: user.id,
          status: TreasuryMovementStatus.PENDING,
          internalNote: `submittedAt=${new Date().toISOString()} ip=${ip} ua=${ua}`,
        },
        select: { id: true, status: true },
      });
    
      // 2) Guardar comprobante si es CLP deposit
      let attachmentUrl: string | null = null;
    
      if (type === "deposit" && assetCode === AssetCode.CLP && receiptFile) {
        // 2A) Subir comprobante a Supabase Storage (source of truth)
        const { path: supabasePath } = await uploadReceiptToSupabase({
          userId: user.id,
          file: receiptFile,
        });

        attachmentUrl = supabasePath;
        await tx.treasuryMovement.update({
          where: { id: movement.id },
          data: { attachmentUrl },
          select: { id: true },
        });

        // 2C) Crear DepositSlip apuntando al path de Supabase
        const slip = await tx.depositSlip.create({
          data: {
            userId: user.id,
            filePath: supabasePath,
            fileMime: receiptFile.type,
            fileSizeBytes: BigInt(receiptFile.size),
            ocrStatus: "received",
            status: "received",
            notes: `movementId:${movement.id}`,
          },
        });

        // 2D) Disparar el proceso (esto es lo que manda el WhatsApp “🟠 PENDIENTE MANUAL...”)
        // const origin = req.headers.get("origin") ?? "http://localhost:3000";
        // await fetch(`${origin}/api/internal/deposit-slip/process`, {
        //   method: "POST",
        //   headers: { "content-type": "application/json" },
        //   body: JSON.stringify({ slipId: slip.id }),
        //   cache: "no-store",
        // });
      
        // IMPORTANTE: el movimiento se auto-aprueba fuera de la transacción.
        return {
          movementId: movement.id,
          status: TreasuryMovementStatus.PENDING,
          attachmentUrl,
          autoExecuted: false,
          depositSlipId: slip.id,
          depositSlipStatus: slip.status,
          depositSlipOcrStatus: slip.ocrStatus,
        };
      }
      
            // 2E) CLP withdraw: guardar solicitud, chequear saldo, descontar y avisar por WhatsApp
            if (type === "withdraw" && assetCode === AssetCode.CLP) {
              // 1) Validar que exista cuenta bancaria del usuario
              const bank = await tx.bankAccount.findUnique({
                where: { userId: user.id },
                select: {
                  bankName: true,
                  accountType: true,
                  accountNumber: true,
                  holderRut: true,
                },
              });
      
              if (!bank) {
                throw new Error("BANK_NOT_CONFIGURED");
              }
      
              // 2) Leer balance CLP de la empresa
              const acc = await tx.treasuryAccount.findUnique({
                where: {
                  companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP },
                },
                select: { balance: true },
              });
      
              const bal = new Prisma.Decimal(acc?.balance ?? 0);
      
              // 3) Chequear fondos
              if (bal.lt(amount)) {
                throw new Error("INSUFFICIENT_FUNDS");
              }
      
              // 4) Descontar inmediatamente para “reservar” fondos
              await tx.treasuryAccount.update({
                where: {
                  companyId_assetCode: { companyId: activeCompanyId, assetCode: AssetCode.CLP },
                },
                data: { balance: bal.minus(amount) },
              });
      
              // 5) Marcar movimiento como PROCESSING (pendiente de pago manual)
              await tx.treasuryMovement.update({
                where: { id: movement.id },
                data: {
                  status: TreasuryMovementStatus.PROCESSING,
                  executedQuoteAmount: amount,
                  executedQuoteCode: AssetCode.CLP,
                  executedSource: "withdraw-request",
                  executedAt: new Date(),
                  // paidOut queda false por default
                },
                select: { id: true },
              });
      
              // 6) Avisar por WhatsApp (NO rompemos si Twilio falla)
              try {
                const fullName =
                  (user as any)?.personProfile?.fullName?.trim?.() || email.split("@")[0];
      
                await notifyAdminWhatsApp(
                  [
                    "🏧 NUEVO RETIRO (TESORERÍA)",
                    `Empresa: ${activeCompanyId}`,
                    `Usuario: ${fullName}`,
                    `Monto: ${amount.toString()} CLP`,
                    "",
                    "Datos bancarios:",
                    `Banco: ${bank.bankName}`,
                    `Tipo: ${bank.accountType}`,
                    `Cuenta: ${bank.accountNumber}`,
                    `RUT: ${bank.holderRut}`,
                    "",
                    `movementId: ${movement.id}`,
                    "Acción: pagar manual y luego marcar paidOut=true",
                  ].join("\n")
                );
              } catch (e) {
                console.warn("[withdraw notifyAdminWhatsApp] failed", e);
              }
      
              return {
                movementId: movement.id,
                status: TreasuryMovementStatus.PROCESSING,
                attachmentUrl: null,
                autoExecuted: false,
              };
            }

      // 4) default: queda PENDING
      return {
        movementId: movement.id,
        status: movement.status,
        attachmentUrl,
        autoExecuted: false,
        assetCode,
        type,
      };
    });

    logEvent("trade:movement_created", {
      correlationId,
      companyId: activeCompanyId,
      userId: user.id,
      movementId: out.movementId,
      status: out.status,
      type,
      assetCode,
      amount: amount.toString(),
    });

    let finalStatus = out.status;

    if (out.depositSlipId && canAutoApprove) {
      try {
        const approved = await approveMovementAsSystem({
          movementId: out.movementId,
          companyId: activeCompanyId,
          actorUserId: user.id,
          skipSync: true,
          correlationId,
        });
        finalStatus = (approved as any)?.updated?.status ?? finalStatus;
      } catch (e: any) {
        console.error("deposit_slip:auto_approve_failed", {
          movementId: out.movementId,
          companyId: activeCompanyId,
          error: e?.message ?? String(e),
        });
        return NextResponse.json(
          { ok: false, movementId: out.movementId, error: "Error aprobando depósito" },
          { status: 500 }
        );
      }
    }

    if (out.depositSlipId) {
      console.info("deposit_slip:created", {
        slipId: out.depositSlipId,
        companyId: activeCompanyId,
        amount: amount.toString(),
        status: out.depositSlipStatus ?? "received",
      });
      const waResult = await sendDepositSlipWhatsApp({
        slipId: out.depositSlipId,
        companyId: activeCompanyId,
        amount: amount.toString(),
        currency: "CLP",
        status: out.depositSlipStatus ?? "received",
        ocrStatus: out.depositSlipOcrStatus ?? null,
      }).catch((err: any) => ({
        ok: false,
        error: err?.message ?? "SEND_THROW",
      }));

      if (!waResult?.ok) {
        const errorMessage = waResult?.error ?? "UNKNOWN";
        console.error("whatsapp_send_failed", {
          movementId: out.movementId,
          companyId: activeCompanyId,
          correlationId,
          error: errorMessage,
        });

        try {
          const current = await prisma.treasuryMovement.findUnique({
            where: { id: out.movementId },
            select: { retryCount: true },
          });

          const nextRetryCount = Math.min((current?.retryCount ?? 0) + 1, 5);

          await prisma.treasuryMovement.update({
            where: { id: out.movementId },
            data: {
              lastError: `whatsapp:${errorMessage}`,
              nextRetryAt: new Date(Date.now() + 10 * 60 * 1000),
              retryCount: nextRetryCount,
            },
          });
        } catch (err: any) {
          console.warn("whatsapp_send_failed_update_error", {
            movementId: out.movementId,
            error: err?.message ?? String(err),
          });
        }
      }
    }

    return NextResponse.json({ ok: true, traceId: correlationId, ...out, status: finalStatus });
  } catch (e: any) {
    console.error("MOVEMENT_CREATE_ERROR", e);

    if (e?.message === "BAD_FILE_TYPE") {
      return NextResponse.json({ error: "Formato inválido. Solo PDF/JPG/PNG." }, { status: 400 });
    }
    if (e?.message === "FILE_TOO_LARGE") {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 10MB)." }, { status: 400 });
    }

    return NextResponse.json({ error: e?.message ?? "Error creando movimiento" }, { status: 500 });
  }
}
