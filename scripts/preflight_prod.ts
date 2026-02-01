// scripts/preflight_prod.ts
// Usage:
//   npx tsx -r dotenv/config scripts/preflight_prod.ts

import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

function mask(value: string | null | undefined) {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (v.length <= 8) return "***";
  return `${v.slice(0, 4)}...${v.slice(-4)}`;
}

function parseDbInfo(urlStr: string) {
  try {
    const url = new URL(urlStr);
    return {
      host: url.host,
      database: url.pathname.replace("/", ""),
      protocol: url.protocol,
    };
  } catch {
    return { host: "unknown", database: "unknown", protocol: "unknown" };
  }
}

function requireNonEmpty(value: string | undefined) {
  return Boolean(value && value.trim().length > 0);
}

async function main() {
  const nodeEnv = process.env.NODE_ENV ?? "unknown";
  const vercelEnv = process.env.VERCEL_ENV ?? "unknown";
  const isProd = nodeEnv === "production" || vercelEnv === "production";

  const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
  const dbInfo = parseDbInfo(databaseUrl);

  const featureWhatsApp = (process.env.FEATURE_WHATSAPP_APPROVAL ?? "false").toLowerCase() === "true";
  const strictSystemWallet = (process.env.STRICT_SYSTEM_WALLET ?? "true").toLowerCase() !== "false";
  const autoApproveDeposits = (process.env.AUTO_APPROVE_DEPOSITS ?? "false").toLowerCase() === "true";
  const autoApproveMaxClp = Number(process.env.AUTO_APPROVE_MAX_CLP ?? "0");

  console.log("Environment:", { nodeEnv, vercelEnv, isProd });
  console.log("Connected DB (parsed):", dbInfo);

  const requiredBase = {
    DATABASE_URL: requireNonEmpty(process.env.DATABASE_URL) ? "ok" : "missing",
    NEXTAUTH_SECRET: requireNonEmpty(process.env.NEXTAUTH_SECRET) ? "ok" : "missing",
  };

  console.log("Required env:", requiredBase);

  console.log("Flags:", {
    FEATURE_WHATSAPP_APPROVAL: featureWhatsApp,
    STRICT_SYSTEM_WALLET: strictSystemWallet,
    AUTO_APPROVE_DEPOSITS: autoApproveDeposits,
    AUTO_APPROVE_MAX_CLP: Number.isFinite(autoApproveMaxClp) ? autoApproveMaxClp : "invalid",
  });

  if (!databaseUrl) {
    console.error("Missing DATABASE_URL/DIRECT_URL");
    process.exit(1);
  }

  if (isProd) {
    if (requiredBase.DATABASE_URL === "missing" || requiredBase.NEXTAUTH_SECRET === "missing") {
      console.error("Missing required env in production.");
      process.exit(1);
    }
    if (autoApproveDeposits || (Number.isFinite(autoApproveMaxClp) && autoApproveMaxClp > 0)) {
      console.error("AUTO_APPROVE_DEPOSITS/AUTO_APPROVE_MAX_CLP must be disabled in production.");
      process.exit(1);
    }
  }

  if (featureWhatsApp) {
    const hasTwilioSid = requireNonEmpty(process.env.TWILIO_ACCOUNT_SID);
    const hasTwilioToken = requireNonEmpty(process.env.TWILIO_AUTH_TOKEN);
    const hasTwilioFrom = requireNonEmpty(process.env.TWILIO_WHATSAPP_FROM) || requireNonEmpty(process.env.TWILIO_FROM);
    const hasAllowlist = requireNonEmpty(process.env.WHATSAPP_ADMIN_ALLOWLIST) ||
      requireNonEmpty(process.env.ADMIN_WHATSAPP_TO) ||
      requireNonEmpty(process.env.WHATSAPP_ADMIN_TO);
    const hasWebhookToken = requireNonEmpty(process.env.TWILIO_WEBHOOK_TOKEN);

    console.log("WhatsApp env:", {
      TWILIO_ACCOUNT_SID: hasTwilioSid,
      TWILIO_AUTH_TOKEN: hasTwilioToken,
      TWILIO_WHATSAPP_FROM: hasTwilioFrom,
      WHATSAPP_ADMIN_ALLOWLIST: hasAllowlist,
      TWILIO_WEBHOOK_TOKEN: hasWebhookToken,
    });

    if (!hasTwilioSid || !hasTwilioToken || !hasTwilioFrom || !hasAllowlist || !hasWebhookToken) {
      console.error("FEATURE_WHATSAPP_APPROVAL enabled but required Twilio env is missing.");
      process.exit(1);
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      null;
    if (baseUrl) {
      console.log("Twilio webhook URL (expected):", `${baseUrl.replace(/\\/$/, "")}/api/webhooks/twilio/whatsapp?token=***`);
    } else {
      console.warn("Missing NEXT_PUBLIC_APP_URL/NEXTAUTH_URL for webhook URL display.");
    }
  }

  if (strictSystemWallet) {
    const hasBudaKey = requireNonEmpty(process.env.BUDA_API_KEY);
    const hasBudaSecret = requireNonEmpty(process.env.BUDA_API_SECRET);
    console.log("Buda keys:", {
      BUDA_API_KEY: hasBudaKey ? mask(process.env.BUDA_API_KEY) : null,
      BUDA_API_SECRET: hasBudaSecret ? "***" : null,
    });
    if (!hasBudaKey || !hasBudaSecret) {
      console.error("STRICT_SYSTEM_WALLET enabled but BUDA keys are missing.");
      process.exit(1);
    }
  }

  // Prisma connection sanity
  try {
    const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
    await prisma.$queryRawUnsafe("SELECT 1");
    await prisma.$disconnect();
    console.log("Prisma connection: ok");
  } catch (e: any) {
    console.error("Prisma connection failed:", e?.message ?? e);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
