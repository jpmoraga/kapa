export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminCompanyDocumentDownloadUrl } from "@/lib/companyLifecycle";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id, documentId } = await context.params;

  try {
    const signedUrl = await getAdminCompanyDocumentDownloadUrl({
      companyId: id,
      documentId,
    });

    if (!signedUrl) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    return NextResponse.redirect(signedUrl);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("admin:company_document_download_fail", {
      companyId: id,
      documentId,
      error: message,
    });
    return NextResponse.json(
      { error: "No se pudo abrir el documento." },
      { status: 500 }
    );
  }
}
