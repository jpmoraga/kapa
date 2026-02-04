export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
} from "@/lib/adminAuth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const email = String(body?.email ?? "").toLowerCase().trim();
  const password = String(body?.password ?? "");

  console.info("admin:login_attempt", { email });

  if (!email || !password) {
    console.error("admin:login_fail", { email, error: "missing_fields" });
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true, role: true },
  });

  if (!admin?.passwordHash) {
    console.error("admin:login_fail", { email, error: "not_found" });
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const ok = await compare(password, admin.passwordHash);
  if (!ok) {
    console.error("admin:login_fail", { email, error: "bad_password" });
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const session = await createAdminSession(admin.id);

  const res = NextResponse.json({ ok: true, email: admin.email, role: admin.role });
  res.cookies.set(ADMIN_SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  return res;
}
