export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { executeAdminSellBtcFromAdmin } from "@/lib/adminActions";

function safeReturnTo(value: FormDataEntryValue | null, fallbackPath: string) {
  const raw = String(value ?? "").trim();
  if (!raw.startsWith("/admin/")) return fallbackPath;
  return raw;
}

function redirectTo(req: Request, returnTo: string, params?: Record<string, string>) {
  const target = new URL(returnTo, req.url);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const form = await req.formData();
  const companyId = String(form.get("companyId") ?? "");
  const returnTo = safeReturnTo(form.get("returnTo"), `/admin/customers/${companyId}`);

  try {
    const confirmation = String(form.get("confirmationText") ?? "");
    if (confirmation.trim().toUpperCase() !== "VENDER") {
      throw new Error("confirmation_text_invalid");
    }

    const detail = await executeAdminSellBtcFromAdmin({
      actorAdminUserId: admin.admin.id,
      companyId,
      amountBtc: String(form.get("amountBtc") ?? ""),
      referencePriceClp: String(form.get("referencePriceClp") ?? ""),
      note: String(form.get("note") ?? ""),
      idempotencyKey: String(form.get("idempotencyKey") ?? ""),
    });

    return redirectTo(req, returnTo, {
      flash: detail?.status === "SUCCEEDED" ? "admin-action-success" : "admin-action-failed",
      actionId: detail?.id ?? "",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "admin_sell_btc_failed";
    console.error("admin:sell_btc_fail", {
      adminUserId: admin.admin.id,
      companyId,
      error: message,
    });
    return redirectTo(req, returnTo, { error: message });
  }
}
