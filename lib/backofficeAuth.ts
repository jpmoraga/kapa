import "server-only";

import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const BACKOFFICE_SESSION_COOKIE = "kapa_backoffice_session";
const BACKOFFICE_SESSION_TTL_DAYS = 7;
const BACKOFFICE_SESSION_TTL_MS = BACKOFFICE_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
export const BACKOFFICE_SESSION_MAX_AGE_SECONDS =
  BACKOFFICE_SESSION_TTL_DAYS * 24 * 60 * 60;

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type BackofficeIdentity = {
  id: string;
  email: string;
  name: string | null;
  role: import("@prisma/client").BackofficeRole;
  isActive: boolean;
};

export type BackofficeSession = {
  token: string;
  expiresAt: Date;
  user: BackofficeIdentity;
};

export async function createBackofficeSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + BACKOFFICE_SESSION_TTL_MS);

  await prisma.backofficeSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteBackofficeSessionByToken(token: string | null | undefined) {
  if (!token) return;

  await prisma.backofficeSession
    .deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    })
    .catch(() => {});
}

export async function getBackofficeSession(): Promise<BackofficeSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(BACKOFFICE_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.backofficeSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now() || !session.user.isActive) {
    await deleteBackofficeSessionByToken(token);
    return null;
  }

  return {
    token,
    expiresAt: session.expiresAt,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      isActive: session.user.isActive,
    },
  };
}

export async function requireBackofficeSession() {
  const session = await getBackofficeSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    user: session.user,
  };
}
