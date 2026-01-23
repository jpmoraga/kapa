// scripts/purgeUser.ts (run with tsx)
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { getScriptPrisma } from "./_prisma";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const email = process.argv[2]?.toLowerCase().trim();
if (!email) {
  console.error("Usage: npx tsx scripts/purgeUser.ts jp@lemonpot.com");
  process.exit(1);
}

const RETRY_DELAYS_MS = [300, 800, 1500];

function isTransientError(e: any) {
  const msg = String(e?.message ?? e);
  return (
    msg.includes("MaxClientsInSessionMode") ||
    msg.includes("too many clients") ||
    msg.includes("ECONNRESET")
  );
}

async function purgeUserOnce() {
  const prisma = getScriptPrisma();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      console.log("No existe user:", email);
      return;
    }

    const userId = user.id;

    const [onboarding, slips, personalCompanies] = await Promise.all([
      prisma.userOnboarding.findUnique({
        where: { userId },
        select: { idDocumentFrontPath: true, idDocumentBackPath: true },
      }),
      prisma.depositSlip.findMany({
        where: { userId },
        select: { filePath: true },
      }),
      prisma.company.findMany({
        where: { personalOwnerId: userId },
        select: { id: true },
      }),
    ]);

    const kycPaths = [onboarding?.idDocumentFrontPath, onboarding?.idDocumentBackPath]
      .filter(Boolean) as string[];
    const depositSlipPaths = slips.map((s) => s.filePath).filter(Boolean);
    const personalCompanyIds = personalCompanies.map((c) => c.id);

    await prisma.$transaction(async (tx) => {
      // tokens + sessions
      await tx.emailVerificationToken.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });

      // onboarding / profile (por si acaso)
      await tx.userOnboarding.deleteMany({ where: { userId } });
      await tx.personProfile.deleteMany({ where: { userId } });
      await tx.bankAccount.deleteMany({ where: { userId } });

      // slips
      await tx.depositSlip.deleteMany({ where: { userId } });

      // memberships & companies personales
      await tx.companyUser.deleteMany({ where: { userId } });

      if (personalCompanyIds.length) {
        await tx.treasuryMovement.deleteMany({ where: { companyId: { in: personalCompanyIds } } });
        await tx.treasuryAccount.deleteMany({ where: { companyId: { in: personalCompanyIds } } });
        await tx.companyUser.deleteMany({ where: { companyId: { in: personalCompanyIds } } });
        await tx.company.deleteMany({ where: { id: { in: personalCompanyIds } } });
      }

      await tx.user.delete({ where: { id: userId } });
    });

    console.log("Usuario purgado DB:", email);

    // Limpiar storage (Supabase)
    try {
      const { supabaseServer } = await import("../lib/supabaseServer");
      if (kycPaths.length) {
        const { error } = await supabaseServer.storage.from("kyc").remove(kycPaths);
        if (error) console.warn("Supabase kyc cleanup error:", error.message);
      }
      if (depositSlipPaths.length) {
        const { error } = await supabaseServer.storage.from("deposit-slips").remove(depositSlipPaths);
        if (error) console.warn("Supabase deposit-slips cleanup error:", error.message);
      }
    } catch (e: any) {
      console.warn("Supabase cleanup skipped:", e?.message || e);
    }

    // Limpiar uploads locales (solo empresas personales)
    for (const companyId of personalCompanyIds) {
      const dir = path.join(process.cwd(), "public", "uploads", "treasury", companyId);
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch (e: any) {
        console.warn("Local uploads cleanup error:", e?.message || e);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      await purgeUserOnce();
      return;
    } catch (e: any) {
      if (!isTransientError(e) || attempt === RETRY_DELAYS_MS.length) {
        throw e;
      }
      const delay = RETRY_DELAYS_MS[attempt];
      console.warn(`Transient DB error, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
