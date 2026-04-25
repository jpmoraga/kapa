export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { executeAdminExternalBtcAssignmentFromAdmin } from "@/lib/adminActions";

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
    if (confirmation.trim().toUpperCase() !== "ASIGNAR") {
      throw new Error("confirmation_text_invalid");
    }

    const detail = await executeAdminExternalBtcAssignmentFromAdmin({
      actorAdminUserId: admin.admin.id,
      companyId,
      amountBtc: String(form.get("amountBtc") ?? ""),
      provider: String(form.get("provider") ?? ""),
      externalReference: String(form.get("externalReference") ?? ""),
      referencePriceClp: String(form.get("referencePriceClp") ?? ""),
      referenceFeeClp: String(form.get("referenceFeeClp") ?? ""),
      note: String(form.get("note") ?? ""),
      idempotencyKey: String(form.get("idempotencyKey") ?? ""),
    });

    return redirectTo(req, returnTo, {
      flash: detail?.status === "SUCCEEDED" ? "admin-action-success" : "admin-action-failed",
      actionId: detail?.id ?? "",
      audit: detail?.id ? "recorded" : "not-recorded",
      ...(detail?.status !== "SUCCEEDED" && (detail?.errorCode || detail?.errorMessage)
        ? { error: detail.errorCode ?? detail.errorMessage ?? "admin_action_failed" }
        : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "admin_assign_btc_external_failed";
    console.error("admin:assign_btc_external_fail", {
      adminUserId: admin.admin.id,
      companyId,
      error: message,
    });
    return redirectTo(req, returnTo, { error: message, audit: "not-recorded" });
  }
}
