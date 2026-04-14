import process from "node:process";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

const PASSWORD = process.env.ONBOARDING_AUDIT_PASSWORD || "Audit12345!";
const stamp =
  process.env.ONBOARDING_AUDIT_STAMP ||
  new Date().toISOString().slice(0, 10).replace(/-/g, "");
const baseUrl =
  process.env.ONBOARDING_AUDIT_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";
const enableHttp = process.env.ONBOARDING_AUDIT_HTTP === "1";

const auditCases = [
  { key: "flow", email: `audit+flow-${stamp}@local.test` },
  { key: "case-a", email: `audit+case-a-${stamp}@local.test` },
  { key: "case-b", email: `audit+case-b-${stamp}@local.test` },
  { key: "case-c", email: `audit+case-c-${stamp}@local.test` },
  { key: "case-d", email: `audit+case-d-${stamp}@local.test` },
  { key: "case-e", email: `audit+case-e-${stamp}@local.test` },
  { key: "case-complete", email: `audit+case-complete-${stamp}@local.test` },
];

function normalizeCookie(setCookie) {
  const headers = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return headers.map((value) => String(value).split(";")[0]).join("; ");
}

function mergeCookies(...cookies) {
  return cookies.filter(Boolean).join("; ");
}

function getExpectedStep(status) {
  if (!status.hasIdDocument) return "document";
  if (!status.hasProfile) return "personal";
  if (!status.hasBankAccount) return "bank";
  if (!status.termsAccepted) return "terms";
  return "complete";
}

function extractResolvedStep(html) {
  const match = html.match(/\/onboarding\?step=([a-z-]+)/i);
  if (match?.[1]) return match[1];
  if (html.includes("/dashboard")) return "complete";
  return null;
}

function extractResolvedPath(html) {
  const match = html.match(/(\/(?:auth\/login|select-company|onboarding|dashboard)[^"'\\\s<]*)/i);
  return match?.[1] ?? null;
}

async function ensureBaseUser(email, passwordHash) {
  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, activeCompanyId: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
      select: { id: true, activeCompanyId: true },
    });
  } else {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
  }

  let companyId = user.activeCompanyId;
  if (!companyId) {
    const company = await prisma.company.create({
      data: {
        name: `Audit ${email}`,
        kind: "PERSONAL",
        personalOwnerId: user.id,
      },
      select: { id: true },
    });
    companyId = company.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { activeCompanyId: companyId },
    });
  }

  await prisma.companyUser.upsert({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId,
      },
    },
    update: { role: "owner" },
    create: {
      userId: user.id,
      companyId,
      role: "owner",
    },
  });

  await prisma.personProfile.deleteMany({ where: { userId: user.id } });
  await prisma.userOnboarding.deleteMany({ where: { userId: user.id } });
  await prisma.bankAccount.deleteMany({ where: { userId: user.id } });

  return { userId: user.id, companyId };
}

async function seedCase(entry, passwordHash) {
  const base = await ensureBaseUser(entry.email, passwordHash);
  const userId = base.userId;

  if (entry.key === "case-b") {
    await prisma.userOnboarding.create({
      data: {
        userId,
        idDocumentFrontPath: `user/${userId}/id-front-case-b.jpg`,
        idDocumentBackPath: `user/${userId}/id-back-case-b.jpg`,
      },
    });
    await prisma.personProfile.create({
      data: {
        userId,
        fullName: "Caso B Persona",
        rut: "11111111-1",
        phone: null,
      },
    });
  }

  if (entry.key === "case-c") {
    await prisma.personProfile.create({
      data: {
        userId,
        fullName: "Caso C Persona",
        rut: "22222222-2",
        phone: "+56911111111",
      },
    });
    await prisma.userOnboarding.create({
      data: {
        userId,
        idDocumentFrontPath: `user/${userId}/id-front-case-c.jpg`,
        idDocumentBackPath: `user/${userId}/id-back-case-c.jpg`,
        termsAcceptedAt: new Date(),
      },
    });
  }

  if (entry.key === "case-d") {
    await prisma.userOnboarding.create({
      data: {
        userId,
        idDocumentFrontPath: `user/${userId}/id-front-case-d.jpg`,
        idDocumentBackPath: `user/${userId}/id-back-case-d.jpg`,
      },
    });
  }

  if (entry.key === "case-e") {
    await prisma.personProfile.create({
      data: {
        userId,
        fullName: "Caso E Persona",
        rut: "33333333-3",
        phone: "+56922222222",
      },
    });
    await prisma.userOnboarding.create({
      data: {
        userId,
        idDocumentFrontPath: `user/${userId}/id-front-case-e.jpg`,
        idDocumentBackPath: `user/${userId}/id-back-case-e.jpg`,
      },
    });
    await prisma.bankAccount.create({
      data: {
        userId,
        bankName: "bancoestado",
        accountType: "corriente",
        accountNumber: "12345678",
        holderRut: "33333333-3",
      },
    });
  }

  if (entry.key === "case-complete") {
    await prisma.personProfile.create({
      data: {
        userId,
        fullName: "Caso Complete Persona",
        rut: "44444444-4",
        phone: "+56933333333",
      },
    });
    await prisma.userOnboarding.create({
      data: {
        userId,
        idDocumentFrontPath: `user/${userId}/id-front-case-complete.jpg`,
        idDocumentBackPath: `user/${userId}/id-back-case-complete.jpg`,
        termsAcceptedAt: new Date(),
      },
    });
    await prisma.bankAccount.create({
      data: {
        userId,
        bankName: "bancoestado",
        accountType: "corriente",
        accountNumber: "87654321",
        holderRut: "44444444-4",
      },
    });
  }

  const [profile, onboarding, bankAccount] = await prisma.$transaction([
    prisma.personProfile.findUnique({
      where: { userId },
      select: { fullName: true, rut: true, phone: true },
    }),
    prisma.userOnboarding.findUnique({
      where: { userId },
      select: { termsAcceptedAt: true, idDocumentFrontPath: true, idDocumentBackPath: true },
    }),
    prisma.bankAccount.findUnique({
      where: { userId },
      select: { userId: true },
    }),
  ]);

  const status = {
    hasIdDocument: Boolean(onboarding?.idDocumentFrontPath) && Boolean(onboarding?.idDocumentBackPath),
    hasProfile:
      Boolean(profile?.fullName?.trim()) &&
      Boolean(profile?.rut?.trim()) &&
      Boolean(profile?.phone?.trim()),
    hasBankAccount: Boolean(bankAccount?.userId),
    termsAccepted: Boolean(onboarding?.termsAcceptedAt),
  };

  return {
    case: entry.key,
    email: entry.email,
    companyId: base.companyId,
    expectedStep: getExpectedStep(status),
    ...status,
  };
}

async function loginAndProbe(email) {
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  let cookie = normalizeCookie(
    csrfRes.headers.getSetCookie?.() ?? csrfRes.headers.get("set-cookie")
  );
  const csrf = (await csrfRes.json()).csrfToken;

  const body = new URLSearchParams({
    csrfToken: csrf,
    email,
    password: PASSWORD,
    callbackUrl: `${baseUrl}/onboarding`,
  });

  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie,
    },
    body: body.toString(),
    redirect: "manual",
  });

  cookie = mergeCookies(
    cookie,
    normalizeCookie(loginRes.headers.getSetCookie?.() ?? loginRes.headers.get("set-cookie"))
  );

  const onboardingRes = await fetch(`${baseUrl}/onboarding`, {
    headers: { cookie },
  });
  const onboardingHtml = await onboardingRes.text();

  const dashboardRes = await fetch(`${baseUrl}/dashboard`, {
    headers: { cookie },
    redirect: "manual",
  });

  const newMovementRes = await fetch(`${baseUrl}/treasury/new-movement?mode=buy&assetCode=CLP`, {
    headers: { cookie },
    redirect: "manual",
  });
  const newMovementHtml =
    newMovementRes.status >= 300 && newMovementRes.status < 400
      ? null
      : await newMovementRes.text();

  return {
    loginStatus: loginRes.status,
    resolvedStep: extractResolvedStep(onboardingHtml),
    dashboardStatus: dashboardRes.status,
    dashboardLocation: dashboardRes.headers.get("location"),
    newMovementStatus: newMovementRes.status,
    newMovementLocation: newMovementRes.headers.get("location"),
    newMovementResolved: newMovementHtml ? extractResolvedPath(newMovementHtml) : null,
  };
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const rows = [];

  for (const entry of auditCases) {
    const seeded = await seedCase(entry, passwordHash);
    const row = {
      ...seeded,
      password: PASSWORD,
    };

    if (enableHttp) {
      Object.assign(row, await loginAndProbe(entry.email));
    }

    rows.push(row);
  }

  console.log(JSON.stringify({ baseUrl, stamp, enableHttp, rows }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
