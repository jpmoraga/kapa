// web/app/api/admin/movements/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { TreasuryMovementStatus } from "@prisma/client";

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

function parseLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.floor(parsed));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isCuid(value: string) {
  return /^c[a-z0-9]{8,}$/i.test(value);
}

function decodeCursor(cursor: string | null) {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");
    const [createdAtRaw, id] = decoded.split("|");
    if (!createdAtRaw || !id) return null;
    const createdAt = new Date(createdAtRaw);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString("base64");
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const statusParamRaw = String(url.searchParams.get("status") ?? "PENDING").toUpperCase();
  const typeParamRaw = String(url.searchParams.get("type") ?? "ALL").toLowerCase();
  const paidOutParam = String(url.searchParams.get("paidOut") ?? "ALL").toLowerCase();
  const q = String(url.searchParams.get("q") ?? "").trim();
  const limit = parseLimit(url.searchParams.get("limit"));
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  const allowedStatus = new Set(["PENDING", "PROCESSING", "APPROVED", "REJECTED"]);
  const statusParam = allowedStatus.has(statusParamRaw) ? statusParamRaw : "PENDING";
  const typeParam =
    typeParamRaw === "deposit" || typeParamRaw === "withdraw" ? typeParamRaw : "all";

  const andFilters: any[] = [];

  if (statusParamRaw === "ALL") {
    // no filter
  } else {
    andFilters.push({ status: statusParam as TreasuryMovementStatus });
  }

  if (typeParam !== "all") {
    andFilters.push({ type: typeParam });
  }

  if (paidOutParam === "true") {
    andFilters.push({ paidOut: true });
  } else if (paidOutParam === "false") {
    andFilters.push({ paidOut: false });
  }

  if (q) {
    const orFilters: any[] = [];
    if (isUuid(q) || isCuid(q)) {
      orFilters.push({ id: q });
    }
    orFilters.push({ createdBy: { email: { contains: q, mode: "insensitive" } } });
    orFilters.push({ company: { name: { contains: q, mode: "insensitive" } } });
    andFilters.push({ OR: orFilters });
  }

  if (cursor) {
    andFilters.push({
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ],
    });
  }

  const where = andFilters.length ? { AND: andFilters } : {};

  const rows = await prisma.treasuryMovement.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    select: {
      id: true,
      companyId: true,
      company: { select: { name: true } },
      createdByUserId: true,
      createdBy: { select: { email: true } },
      status: true,
      assetCode: true,
      type: true,
      amount: true,
      note: true,
      createdAt: true,
      approvedAt: true,
      executedAt: true,
      paidOut: true,
      paidOutAt: true,
      attachmentUrl: true,
    },
  });

  const mapped = rows.map((m) => ({
    id: m.id,
    movementId: m.id,
    companyId: m.companyId,
    createdByUserId: m.createdByUserId ?? null,
    userId: m.createdByUserId ?? null,
    createdByEmail: m.createdBy?.email ?? null,
    userEmail: m.createdBy?.email ?? null,
    companyName: m.company?.name ?? null,
    status: m.status,
    assetCode: m.assetCode,
    type: m.type,
    amount: m.amount.toString(),
    note: m.note ?? null,
    createdAt: m.createdAt.toISOString(),
    approvedAt: m.approvedAt?.toISOString() ?? null,
    executedAt: m.executedAt?.toISOString() ?? null,
    paidOut: m.paidOut,
    paidOutAt: m.paidOutAt?.toISOString() ?? null,
    attachmentUrl: m.attachmentUrl ?? null,
    source: "movement" as const,
  }));

  const nextCursor =
    rows.length === limit
      ? encodeCursor(rows[rows.length - 1].createdAt, rows[rows.length - 1].id)
      : undefined;

  const pendingCount = await prisma.treasuryMovement.count({
    where: { status: TreasuryMovementStatus.PENDING },
  });

  console.log("ADMIN_OPS_LIST", {
    status: statusParam,
    type: typeParam,
    paidOut: paidOutParam,
    qPresent: Boolean(q),
    returnedCount: mapped.length,
  });

  return NextResponse.json({ ok: true, rows: mapped, nextCursor, pendingCount });
}
