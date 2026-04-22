export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { CompanyReviewStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { reviewCompanyFromAdmin } from "@/lib/companyLifecycle";

function redirectTo(url: URL, pathname: string, params?: Record<string, string>) {
  const target = new URL(pathname, url);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}

function parseStatus(raw: string) {
  switch (raw) {
    case "APPROVED":
      return CompanyReviewStatus.APPROVED;
    case "OBSERVED":
      return CompanyReviewStatus.OBSERVED;
    case "REJECTED":
      return CompanyReviewStatus.REJECTED;
    case "PENDING":
      return CompanyReviewStatus.PENDING;
    default:
      throw new Error("invalid_review_status");
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const form = await req.formData();

  try {
    await reviewCompanyFromAdmin({
      companyId: id,
      adminUserId: admin.admin.id,
      status: parseStatus(String(form.get("status") ?? "")),
      note: String(form.get("note") ?? ""),
    });

    return redirectTo(new URL(req.url), `/admin/companies/${id}`, {
      flash: "reviewed",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "company_review_failed";
    console.error("admin:company_review_fail", {
      adminUserId: admin.admin.id,
      companyId: id,
      error: message,
    });
    return redirectTo(new URL(req.url), `/admin/companies/${id}`, { error: message });
  }
}
