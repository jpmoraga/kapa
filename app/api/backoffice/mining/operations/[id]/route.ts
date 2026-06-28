export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  getMiningOperationById,
  updateMiningOperation,
} from "@/lib/backofficeMiningOperations";
import { requireBackofficeSectionAccess } from "@/lib/backofficeAuth";

const BAD_REQUEST_MESSAGES: Record<string, string> = {
  client_name_required: "Cliente es obligatorio.",
  invalid_product_type: "Producto inválido.",
  invalid_gross_sale_currency: "Moneda de venta inválida.",
  invalid_payment_currency: "Moneda de pago inválida.",
  invalid_commercial_status: "Estado comercial inválido.",
  invalid_operational_status: "Estado operativo inválido.",
  invalid_partner_level: "Nivel partner inválido.",
  invalid_sales_commission_currency: "Moneda de comisión inválida.",
  invalid_commission_status: "Estado de comisión inválido.",
  invalid_monthly_hosting_currency: "Moneda de hosting inválida.",
  invalid_quantity: "Cantidad inválida.",
  invalid_gross_sale_amount: "Monto de venta inválido.",
  invalid_gross_sale_amount_clp: "Monto CLP inválido.",
  invalid_gross_sale_amount_btc: "Monto BTC inválido.",
  invalid_sales_commission_rate: "Tasa de comisión inválida.",
  invalid_sales_commission_amount: "Monto de comisión inválido.",
  invalid_monthly_hosting_amount: "Monto mensual de hosting inválido.",
  invalid_monthly_hosting_commission_rate: "Tasa de comisión de hosting inválida.",
  invalid_monthly_hosting_commission_amount: "Monto de comisión de hosting inválido.",
  invalid_commission_due_at: "Fecha de vencimiento de comisión inválida.",
  invalid_commission_paid_at: "Fecha de comisión pagada inválida.",
  invalid_commission_received_at: "Fecha de comisión recibida inválida.",
  invalid_next_action_at: "Fecha de próxima acción inválida.",
  operation_not_found: "Operación no encontrada.",
};

function toErrorResponse(error: unknown) {
  if (error instanceof Error && BAD_REQUEST_MESSAGES[error.message]) {
    const status = error.message === "operation_not_found" ? 404 : 400;
    return NextResponse.json(
      { error: BAD_REQUEST_MESSAGES[error.message] },
      { status }
    );
  }

  return NextResponse.json(
    { error: "No fue posible procesar la operación." },
    { status: 500 }
  );
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireBackofficeSectionAccess("mining");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const operation = await getMiningOperationById(id);
  if (!operation) {
    return NextResponse.json({ error: "Operación no encontrada." }, { status: 404 });
  }

  return NextResponse.json(operation);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireBackofficeSectionAccess("mining");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const operation = await updateMiningOperation(id, body, auth.user.id);
    return NextResponse.json({ ok: true, id: operation.id });
  } catch (error) {
    return toErrorResponse(error);
  }
}
