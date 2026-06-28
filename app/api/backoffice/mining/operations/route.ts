export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  createMiningOperation,
  getMiningOperationsPageData,
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
};

function toErrorResponse(error: unknown) {
  if (error instanceof Error && BAD_REQUEST_MESSAGES[error.message]) {
    return NextResponse.json(
      { error: BAD_REQUEST_MESSAGES[error.message] },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: "No fue posible procesar la operación." },
    { status: 500 }
  );
}

export async function GET(req: Request) {
  const auth = await requireBackofficeSectionAccess("mining");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const data = await getMiningOperationsPageData({
    productType: searchParams.get("productType"),
    commercialStatus: searchParams.get("commercialStatus"),
    operationalStatus: searchParams.get("operationalStatus"),
    commissionStatus: searchParams.get("commissionStatus"),
    currency: searchParams.get("currency"),
    country: searchParams.get("country"),
    actionFilter: searchParams.get("actionFilter"),
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const auth = await requireBackofficeSectionAccess("mining");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  try {
    const operation = await createMiningOperation(body, auth.user.id);
    return NextResponse.json({ ok: true, id: operation.id }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
