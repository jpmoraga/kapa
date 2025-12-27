import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.redirect(new URL("/select-company", req.url));
  }

  // Guardamos la empresa activa en la cookie de sesión
  session.activeCompanyId = companyId;

  return NextResponse.redirect(new URL("/dashboard", req.url));
}