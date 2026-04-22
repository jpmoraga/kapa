export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { reconcileAdminActionById } from "@/lib/adminActions";

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

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const form = await req.formData();
  const returnTo = safeReturnTo(form.get("returnTo"), "/admin/audit");

  try {
    const detail = await reconcileAdminActionById(id);
    return redirectTo(req, returnTo, {
      flash: detail ? "admin-action-reconciled" : "admin-action-missing",
      actionId: detail?.id ?? id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "admin_action_reconcile_failed";
    console.error("admin:action_reconcile_fail", {
      adminUserId: admin.admin.id,
      actionId: id,
      error: message,
    });
    return redirectTo(req, returnTo, { error: message, actionId: id });
  }
}
