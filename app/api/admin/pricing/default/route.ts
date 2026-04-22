export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { updateDefaultPricingPlanFromAdmin } from "@/lib/adminCommercial";
import { COMMERCIAL_PRICING_FIELD_DEFINITIONS } from "@/lib/pricing";

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
  const returnTo = safeReturnTo(form.get("returnTo"), "/admin/pricing");

  try {
    const rules = Object.fromEntries(
      COMMERCIAL_PRICING_FIELD_DEFINITIONS.map((definition) => [
        definition.key,
        String(form.get(definition.key) ?? ""),
      ])
    );

    await updateDefaultPricingPlanFromAdmin({
      actorAdminUserId: admin.admin.id,
      note: String(form.get("note") ?? ""),
      rules,
    });

    return redirectTo(req, returnTo, {
      flash: "default-pricing-updated",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "default_pricing_update_failed";
    console.error("admin:default_pricing_update_fail", {
      adminUserId: admin.admin.id,
      error: message,
    });
    return redirectTo(req, returnTo, {
      error: message,
    });
  }
}
