import "server-only";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_TTL_DAYS = 7;
const ADMIN_SESSION_TTL_MS = ADMIN_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
export const ADMIN_SESSION_MAX_AGE_SECONDS = ADMIN_SESSION_TTL_DAYS * 24 * 60 * 60;

type AdminIdentity = {
  id: string;
  email: string;
  role: string;
};

export type AdminSession = {
  token: string;
  expiresAt: Date;
  admin: AdminIdentity;
};

export async function createAdminSession(adminUserId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MS);

  await prisma.adminSession.create({
    data: {
      token,
      adminUserId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: {
      adminUser: { select: { id: true, email: true, role: true } },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.adminSession.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return {
    token: session.token,
    expiresAt: session.expiresAt,
    admin: {
      id: session.adminUser.id,
      email: session.adminUser.email,
      role: String(session.adminUser.role),
    },
  };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true as const, admin: session.admin };
}
