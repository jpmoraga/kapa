#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const args = process.argv.slice(2);
const isExecute = args.includes("--YES_REALLY_DELETE");
const isDryRun = args.includes("--dry-run") || !isExecute;
const skipStorage = args.includes("--skip-storage") || !args.includes("--with-storage");
const skipAuth = args.includes("--skip-auth") || !args.includes("--with-auth");

function getArgValue(name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

function getArgValues(name) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === name) {
      const v = args[i + 1];
      if (v) values.push(v);
    } else if (arg.startsWith(`${name}=`)) {
      const v = arg.split("=")[1];
      if (v) values.push(v);
    }
  }
  return values;
}

if (args.includes("--help")) {
  console.log("Usage:");
  console.log("  node scripts/wipe_prod.js --dry-run");
  console.log("  node scripts/wipe_prod.js --dry-run --skip-storage");
  console.log("  node scripts/wipe_prod.js --dry-run --skip-auth");
  console.log("  WIPE_CONFIRM=KAPA21_WIPE_OK node scripts/wipe_prod.js --YES_REALLY_DELETE [--keep-email founder@...]");
  process.exit(0);
}

// Quick usage:
//   node scripts/wipe_prod.js
//   WIPE_CONFIRM=KAPA21_WIPE_OK node scripts/wipe_prod.js --YES_REALLY_DELETE
// Storage se borra manual.
// Auth se borra manual (Supabase -> Authentication -> Users).

if (isExecute) {
  if (process.env.WIPE_CONFIRM !== "KAPA21_WIPE_OK") {
    console.error("Missing or invalid WIPE_CONFIRM. Expected WIPE_CONFIRM=KAPA21_WIPE_OK");
    process.exit(1);
  }
}

const keepEmails = getArgValues("--keep-email").map((e) => e.toLowerCase().trim());

const prisma = new PrismaClient();

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canUseSupabase = Boolean(supabaseUrl && serviceRoleKey);

async function listPrefix(storage, bucket, prefix) {
  const limit = 1000;
  let offset = 0;
  const out = [];

  while (true) {
    const { data, error } = await storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }

  return out;
}

async function listAllObjects(storage, bucket) {
  const objects = [];
  const stack = [""];

  while (stack.length) {
    const prefix = stack.pop();
    const items = await listPrefix(storage, bucket, prefix);

    for (const item of items) {
      const name = item.name;
      const fullPath = prefix ? `${prefix}/${name}` : name;
      if (!item.metadata) {
        stack.push(fullPath);
      } else {
        objects.push(fullPath);
      }
    }
  }

  return objects;
}

async function listAuthUsers(client) {
  const users = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    if (!data?.users?.length) break;
    users.push(...data.users);
    page += 1;
  }

  return users;
}

async function main() {
  console.log(`Mode: ${isDryRun ? "DRY_RUN" : "EXECUTE"}`);

  if (!canUseSupabase) {
    console.warn(
      "Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Storage/Auth wipe will be skipped."
    );
    if (isExecute) {
      throw new Error("Supabase env missing; aborting execute.");
    }
  }

  const userWhere = keepEmails.length ? { email: { notIn: keepEmails } } : null;
  const DO_NOT_TOUCH = ["MarketTrade", "PriceSnapshot"];
  const tables = [
    { name: "TreasuryMovement", count: () => prisma.treasuryMovement.count(), del: (tx) => tx.treasuryMovement.deleteMany() },
    { name: "TreasuryAccount", count: () => prisma.treasuryAccount.count(), del: (tx) => tx.treasuryAccount.deleteMany() },
    { name: "CompanyUser", count: () => prisma.companyUser.count(), del: (tx) => tx.companyUser.deleteMany() },
    { name: "Company", count: () => prisma.company.count(), del: (tx) => tx.company.deleteMany() },
    { name: "DepositSlip", count: () => prisma.depositSlip.count(), del: (tx) => tx.depositSlip.deleteMany() },
    { name: "UserOnboarding", count: () => prisma.userOnboarding.count(), del: (tx) => tx.userOnboarding.deleteMany() },
    { name: "PersonProfile", count: () => prisma.personProfile.count(), del: (tx) => tx.personProfile.deleteMany() },
    { name: "BankAccount", count: () => prisma.bankAccount.count(), del: (tx) => tx.bankAccount.deleteMany() },
    { name: "Session", count: () => prisma.session.count(), del: (tx) => tx.session.deleteMany() },
    { name: "EmailVerificationToken", count: () => prisma.emailVerificationToken.count(), del: (tx) => tx.emailVerificationToken.deleteMany() },
    { name: "CronRun", count: () => prisma.cronRun.count(), del: (tx) => tx.cronRun.deleteMany() },
    { name: "User", count: () => prisma.user.count(), del: (tx) => (userWhere ? tx.user.deleteMany({ where: userWhere }) : tx.user.deleteMany()) },
  ];

  const forbidden = tables.filter((t) => DO_NOT_TOUCH.includes(t.name));
  if (forbidden.length) {
    throw new Error(`Refusing to delete protected tables: ${forbidden.map((t) => t.name).join(", ")}`);
  }

  console.log("=== DB counts ===");
  for (const t of tables) {
    const c = await t.count();
    console.log(`- ${t.name}: ${c}`);
  }

  console.log("=== Preserved tables ===");
  for (const t of DO_NOT_TOUCH) console.log(`- ${t}`);

  let storageSummary = [];
  let authSummary = { total: 0, toDelete: 0, skipped: 0 };

  if (canUseSupabase) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!skipStorage) {
      try {
        const bucketsResp = await supabase.storage.listBuckets();
        if (bucketsResp.error) throw bucketsResp.error;
        const buckets = bucketsResp?.data?.map((b) => b.name) ?? [];

        console.log("=== Storage buckets ===");
        if (buckets.length) {
          for (const b of buckets) console.log(`- ${b}`);
        } else {
          console.log("- (none)");
        }

        const bucketsToWipe = ["kyc", "deposit-slips"].filter((b) => buckets.includes(b));
        for (const bucket of bucketsToWipe) {
          const objects = await listAllObjects(supabase.storage, bucket);
          storageSummary.push({ bucket, objects });
          console.log(`Bucket ${bucket}: ${objects.length} objects`);
        }

        if (isExecute) {
          for (const bucket of bucketsToWipe) {
            const objects = storageSummary.find((s) => s.bucket === bucket)?.objects ?? [];
            const chunkSize = 100;
            for (let i = 0; i < objects.length; i += chunkSize) {
              const chunk = objects.slice(i, i + chunkSize);
              const { error } = await supabase.storage.from(bucket).remove(chunk);
              if (error) throw error;
            }
          }
        }
      } catch (e) {
        console.warn("Storage wipe skipped due to error:", e?.message || e);
      }
    } else {
      console.warn("Storage wipe skipped (manual).");
    }

    if (!skipAuth) {
      try {
        const users = await listAuthUsers(supabase);
        authSummary.total = users.length;
        authSummary.toDelete = users.filter((u) => {
          const email = (u.email || "").toLowerCase();
          return !keepEmails.includes(email);
        }).length;
        authSummary.skipped = authSummary.total - authSummary.toDelete;

        console.log("=== Supabase Auth users ===");
        console.log(`Total: ${authSummary.total}`);
        console.log(`To delete: ${authSummary.toDelete}`);
        console.log(`Skipped (keep-email): ${authSummary.skipped}`);

        if (isExecute) {
          const usersToDelete = users.filter((u) => {
            const email = (u.email || "").toLowerCase();
            return !keepEmails.includes(email);
          });

          for (const user of usersToDelete) {
            const { error } = await supabase.auth.admin.deleteUser(user.id);
            if (error) throw error;
          }
        }
      } catch (e) {
        console.warn("Auth wipe skipped/failed", e?.message || e);
      }
    } else {
      console.warn("Auth wipe skipped (manual).");
    }
  }

  const deletedCounts = {};

  if (isExecute) {
    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({ data: { activeCompanyId: null } });
      for (const t of tables) {
        const res = await t.del(tx);
        deletedCounts[t.name] = res?.count ?? 0;
      }
    });
  }

  console.log("=== Summary ===");
  console.log(`DB wipe executed: ${isExecute ? "yes" : "no (dry-run)"}`);
  if (isExecute) {
    for (const t of tables) {
      console.log(`Deleted ${t.name}: ${deletedCounts[t.name] ?? 0}`);
    }
  }
  if (canUseSupabase) {
    const totalObjects = storageSummary.reduce((acc, s) => acc + s.objects.length, 0);
    console.log(`Storage objects ${isExecute ? "deleted" : "found"}: ${totalObjects}`);
    console.log(`Auth users ${isExecute ? "deleted" : "found"}: ${authSummary.toDelete}`);
    if (authSummary.skipped) {
      console.log(`Auth users skipped: ${authSummary.skipped}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
