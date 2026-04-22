import "server-only";

import { createHash, randomBytes } from "crypto";
import { hash as hashPassword } from "bcrypt";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/sendPasswordResetEmail";

const PASSWORD_RESET_TTL_MS = 2 * 60 * 60 * 1000;

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawPasswordResetToken() {
  return randomBytes(32).toString("hex");
}

export async function issuePasswordResetForEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail) {
    return {
      ok: true as const,
      delivered: false,
      reason: "missing_email" as const,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  if (!user) {
    return {
      ok: true as const,
      delivered: false,
      reason: "user_not_found" as const,
    };
  }

  const rawToken = createRawPasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const now = new Date();

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const emailResult = await sendPasswordResetEmail({
    email: user.email,
    token: rawToken,
  });

  return {
    ok: true as const,
    delivered: emailResult.ok,
    reason: emailResult.ok ? ("sent" as const) : ("email_failed" as const),
    emailResult,
  };
}

export async function resetPasswordWithToken(token: string, password: string) {
  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return { ok: false as const, reason: "missing_token" as const };
  }

  if (!password || password.length < 8) {
    return { ok: false as const, reason: "weak_password" as const };
  }

  const tokenHash = hashPasswordResetToken(trimmedToken);
  const candidate = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!candidate) {
    return { ok: false as const, reason: "invalid" as const };
  }

  const now = new Date();
  if (candidate.usedAt) {
    return { ok: false as const, reason: "used" as const };
  }

  if (candidate.expiresAt.getTime() <= now.getTime()) {
    return { ok: false as const, reason: "expired" as const };
  }

  const passwordHash = await hashPassword(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,
        },
      });

      if (!fresh) {
        throw new Error("invalid");
      }
      if (fresh.usedAt) {
        throw new Error("used");
      }
      if (fresh.expiresAt.getTime() <= now.getTime()) {
        throw new Error("expired");
      }

      await tx.user.update({
        where: { id: fresh.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: fresh.id },
        data: { usedAt: now },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: fresh.userId,
          usedAt: null,
          NOT: { id: fresh.id },
        },
        data: { usedAt: now },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid";
    if (message === "used" || message === "expired" || message === "invalid") {
      return { ok: false as const, reason: message };
    }
    throw error;
  }

  return { ok: true as const };
}
