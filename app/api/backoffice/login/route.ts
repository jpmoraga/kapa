export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { compare } from "bcrypt";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BACKOFFICE_SESSION_COOKIE,
  BACKOFFICE_SESSION_MAX_AGE_SECONDS,
  createBackofficeSession,
} from "@/lib/backofficeAuth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").toLowerCase().trim();
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const user = await prisma.backofficeUser.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const validPassword = await compare(password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  if (!user.isActive) {
    return NextResponse.json({ error: "Usuario inactivo" }, { status: 403 });
  }

  const session = await createBackofficeSession(user.id);
  const res = NextResponse.json({
    ok: true,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });

  res.cookies.set(BACKOFFICE_SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: BACKOFFICE_SESSION_MAX_AGE_SECONDS,
  });

  return res;
}
