export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { createClientBusinessCompany } from "@/lib/companyLifecycle";

function redirectTo(url: URL, pathname: string, params?: Record<string, string>) {
  const target = new URL(pathname, url);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    target.searchParams.set(key, value);
  });
  return NextResponse.redirect(target);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();

  if (!email) {
    return redirectTo(new URL(req.url), "/auth/login", {
      callbackUrl: "/companies/new",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      personProfile: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!user) {
    return redirectTo(new URL(req.url), "/auth/login", {
      callbackUrl: "/companies/new",
    });
  }

  const form = await req.formData();
  const documentFile = form.get("documentFile");

  try {
    const result = await createClientBusinessCompany({
      userId: user.id,
      userEmail: user.email,
      userName: user.personProfile?.fullName ?? null,
      companyName: String(form.get("companyName") ?? ""),
      companyRut: String(form.get("companyRut") ?? ""),
      submissionNote: String(form.get("submissionNote") ?? ""),
      documentNote: String(form.get("documentNote") ?? ""),
      documentFile: documentFile instanceof File ? documentFile : null,
    });

    return redirectTo(new URL(req.url), "/companies/new", {
      created: "1",
      companyId: result.companyId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "company_create_failed";
    console.error("company:create_fail", { userId: user.id, error: message });
    return redirectTo(new URL(req.url), "/companies/new", { error: message });
  }
}
