export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  getCompanyCommercialSnapshot,
  updateCompanySubscriptionFromAdmin,
} from "@/lib/adminCommercial";

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

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const snapshot = await getCompanyCommercialSnapshot(id);

  if (!snapshot) {
    return NextResponse.json({ ok: false, error: "Empresa no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    subscription: snapshot.subscription,
  });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const form = await req.formData();
  const returnTo = safeReturnTo(form.get("returnTo"), `/admin/subscriptions?companyId=${id}`);

  try {
    await updateCompanySubscriptionFromAdmin({
      companyId: id,
      actorAdminUserId: admin.admin.id,
      status: String(form.get("status") ?? ""),
      plan: String(form.get("plan") ?? ""),
      baseAmountUsd: String(form.get("baseAmountUsd") ?? ""),
      customAmountUsd: String(form.get("customAmountUsd") ?? ""),
      startedAt: String(form.get("startedAt") ?? ""),
      endsAt: String(form.get("endsAt") ?? ""),
      note: String(form.get("note") ?? ""),
    });

    return redirectTo(req, returnTo, {
      flash: "subscription-updated",
      companyId: id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "subscription_update_failed";
    console.error("admin:subscription_update_fail", {
      adminUserId: admin.admin.id,
      companyId: id,
      error: message,
    });
    return redirectTo(req, returnTo, {
      error: message,
      companyId: id,
    });
  }
}
