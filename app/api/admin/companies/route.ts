export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { createAdminBusinessCompany, listAdminCompanies } from "@/lib/companyLifecycle";

function redirectTo(url: URL, pathname: string, params?: Record<string, string>) {
  const target = new URL(pathname, url);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter");
  const q = url.searchParams.get("q");
  const result = await listAdminCompanies({ filter, q });

  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const form = await req.formData();
  const documentFile = form.get("documentFile");

  try {
    const result = await createAdminBusinessCompany({
      adminUserId: admin.admin.id,
      companyName: String(form.get("companyName") ?? ""),
      companyRut: String(form.get("companyRut") ?? ""),
      contactName: String(form.get("contactName") ?? ""),
      contactEmail: String(form.get("contactEmail") ?? ""),
      submissionNote: String(form.get("submissionNote") ?? ""),
      documentNote: String(form.get("documentNote") ?? ""),
      documentFile: documentFile instanceof File ? documentFile : null,
      initialStatus: String(form.get("initialStatus") ?? "PENDING") as "PENDING" | "APPROVED",
    });

    return redirectTo(new URL(req.url), "/admin/companies", {
      flash: "created",
      companyId: result.companyId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "company_admin_create_failed";
    console.error("admin:company_create_fail", {
      adminUserId: admin.admin.id,
      error: message,
    });
    return redirectTo(new URL(req.url), "/admin/companies", { error: message });
  }
}
