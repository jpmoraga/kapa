import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import type { TreasuryMovementStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  const activeCompanyId = (session as any)?.activeCompanyId as string | undefined;

  if (!email) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!activeCompanyId) return NextResponse.json({ error: "Sin empresa activa" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, companyUsers: { select: { role: true } } },
  });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  const isAdmin = user.companyUsers?.some((cu) => {
    const role = String(cu.role).toUpperCase();
    return role === "ADMIN" || role === "OWNER";
  });
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await context.params;

  // Buscar por id directo en TreasuryMovement primero.
  const treasurySelectBase = {
    id: true,
    type: true,
    assetCode: true,
    status: true,
    paidOut: true,
    paidOutAt: true,
  } as const;

  type TreasuryOptionalField = "approvedAt" | "createdAt" | "executedAt";

  const treasurySelectCandidates: ReadonlyArray<ReadonlyArray<TreasuryOptionalField>> = [
    ["approvedAt", "createdAt", "executedAt"],
    ["approvedAt", "createdAt"],
    ["approvedAt", "executedAt"],
    ["createdAt", "executedAt"],
    ["approvedAt"],
    ["createdAt"],
    ["executedAt"],
    [],
  ];

  const buildTreasurySelect = (fields: ReadonlyArray<TreasuryOptionalField>) =>
    ({
      ...treasurySelectBase,
      ...Object.fromEntries(fields.map((field) => [field, true] as const)),
    }) as Record<string, boolean>;

  type TreasuryMovementRow = {
    id: string;
    type: string;
    assetCode: string;
    status: TreasuryMovementStatus;
    paidOut?: boolean | null;
    paidOutAt?: Date | null;
    approvedAt?: Date | null;
    createdAt?: Date | null;
    executedAt?: Date | null;
  };

  const fetchTreasury = async (where: { id: string; companyId?: string }) => {
    for (const fields of treasurySelectCandidates) {
      const select = buildTreasurySelect(fields);
      try {
        const m = await prisma.treasuryMovement.findFirst({
          where,
          select,
        });
        return {
          m: m as TreasuryMovementRow | null,
          select,
          hasApprovedAt: fields.includes("approvedAt"),
          hasCreatedAt: fields.includes("createdAt"),
          hasExecutedAt: fields.includes("executedAt"),
        };
      } catch {
        // try next select candidate
      }
    }
    return {
      m: null,
      select: buildTreasurySelect([]),
      hasApprovedAt: false,
      hasCreatedAt: false,
      hasExecutedAt: false,
    };
  };

  let { m, select: treasurySelect, hasApprovedAt, hasCreatedAt, hasExecutedAt } =
    await fetchTreasury({ id, companyId: activeCompanyId });

  if (!m && isAdmin) {
    console.info("TREASURY_MOVEMENT_PAID", {
      mode: "admin_id_fallback",
      movementId: id,
      activeCompanyId,
    });
    ({ m, select: treasurySelect, hasApprovedAt, hasCreatedAt, hasExecutedAt } =
      await fetchTreasury({ id }));
  }

  if (m) {
    if (m.type !== "withdraw" || m.assetCode !== "CLP") {
      return NextResponse.json({ error: "Solo aplica a retiros CLP" }, { status: 400 });
    }

    if (m.paidOut) {
      return NextResponse.json({
        ok: true,
        updated: {
          id: m.id,
          type: m.type,
          assetCode: m.assetCode,
          status: m.status,
          paidOut: true,
          paidOutAt: m.paidOutAt ?? null,
          ...(hasApprovedAt ? { approvedAt: m.approvedAt ?? null } : {}),
          ...(hasCreatedAt ? { createdAt: m.createdAt ?? null } : {}),
          ...(hasExecutedAt ? { executedAt: m.executedAt ?? null } : {}),
        },
      });
    }

    const now = new Date();
    const nextStatus = "APPROVED" as const;
    const shouldSetApprovedAt = hasApprovedAt && !m.approvedAt;
    console.info("TREASURY_MOVEMENT_PAID", {
      id: m.id,
      model: "TreasuryMovement",
      prevStatus: m.status,
      nextStatus,
    });
    const updated = await prisma.treasuryMovement.update({
      where: { id: m.id },
      data: {
        paidOut: true,
        paidOutAt: now,
        status: nextStatus as TreasuryMovementStatus,
        ...(shouldSetApprovedAt ? { approvedAt: now } : {}),
      },
      select: treasurySelect,
    });

    return NextResponse.json({ ok: true, updated });
  }

  // Fallback: buscar en tabla Movement (legacy) si existe en el Prisma Client.
  const legacySelect = {
    id: true,
    type: true,
    assetCode: true,
    status: true,
    paidOut: true,
    paidOutAt: true,
  } as const;

  type LegacyOptionalField = "approvedAt" | "createdAt" | "executedAt";

  const legacySelectCandidates: ReadonlyArray<ReadonlyArray<LegacyOptionalField>> = [
    ["approvedAt", "createdAt", "executedAt"],
    ["approvedAt", "createdAt"],
    ["approvedAt", "executedAt"],
    ["createdAt", "executedAt"],
    ["approvedAt"],
    ["createdAt"],
    ["executedAt"],
    [],
  ];

  const buildLegacySelect = (fields: ReadonlyArray<LegacyOptionalField>) =>
    ({
      ...legacySelect,
      ...Object.fromEntries(fields.map((field) => [field, true] as const)),
    }) as Record<string, boolean>;

  type LegacyMovement = {
    id: string;
    type: string;
    assetCode: string;
    status?: string | null;
    paidOut?: boolean | null;
    paidOutAt?: Date | null;
    approvedAt?: Date | null;
    createdAt?: Date | null;
    executedAt?: Date | null;
  };

  type LegacyMovementClient = {
    findFirst: (args: {
      where: { id: string; companyId?: string };
      select: Record<string, boolean>;
    }) => Promise<LegacyMovement | null>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
      select: Record<string, boolean>;
    }) => Promise<LegacyMovement>;
  };

  const movementClient = (prisma as unknown as { movement?: LegacyMovementClient }).movement;

  if (movementClient?.findFirst) {
    const fetchLegacy = async (where: { id: string; companyId?: string }) => {
      for (const fields of legacySelectCandidates) {
        const select = buildLegacySelect(fields);
        try {
          const legacy = await movementClient.findFirst({
            where,
            select,
          });
          return {
            legacy,
            select,
            hasApprovedAt: fields.includes("approvedAt"),
            hasCreatedAt: fields.includes("createdAt"),
            hasExecutedAt: fields.includes("executedAt"),
          };
        } catch {
          // try next select candidate
        }
      }
      return {
        legacy: null,
        select: buildLegacySelect([]),
        hasApprovedAt: false,
        hasCreatedAt: false,
        hasExecutedAt: false,
      };
    };

    let { legacy, select, hasApprovedAt, hasCreatedAt, hasExecutedAt } = await fetchLegacy({
      id,
      companyId: activeCompanyId,
    });

    if (!legacy && isAdmin) {
      console.info("TREASURY_MOVEMENT_PAID", {
        mode: "admin_id_fallback",
        movementId: id,
        activeCompanyId,
      });
      ({ legacy, select, hasApprovedAt, hasCreatedAt, hasExecutedAt } = await fetchLegacy({ id }));
    }

    if (legacy) {
      if (legacy.type !== "withdraw" || legacy.assetCode !== "CLP") {
        return NextResponse.json({ error: "Solo aplica a retiros CLP" }, { status: 400 });
      }

      if (legacy.paidOut) {
        return NextResponse.json({
          ok: true,
          updated: {
            id: legacy.id,
            type: legacy.type,
            assetCode: legacy.assetCode,
            status: legacy.status ?? null,
            paidOut: true,
            paidOutAt: legacy.paidOutAt ?? null,
            ...(hasApprovedAt ? { approvedAt: legacy.approvedAt ?? null } : {}),
            ...(hasCreatedAt ? { createdAt: legacy.createdAt ?? null } : {}),
            ...(hasExecutedAt ? { executedAt: legacy.executedAt ?? null } : {}),
          },
        });
      }

      const now = new Date();
      const shouldSetApprovedAt = hasApprovedAt && !legacy.approvedAt;
      const baseData = {
        paidOut: true,
        paidOutAt: now,
        ...(shouldSetApprovedAt ? { approvedAt: now } : {}),
      };
      const updateWithStatus = async (status?: string) =>
        movementClient.update({
          where: { id: legacy.id },
          data: status ? { ...baseData, status } : baseData,
          select,
        });

      let nextStatus: string | null = null;
      let updated: LegacyMovement;
      try {
        updated = await updateWithStatus("APPROVED");
        nextStatus = "APPROVED";
      } catch {
        try {
          updated = await updateWithStatus("PAID");
          nextStatus = "PAID";
        } catch {
          updated = await updateWithStatus();
        }
      }
      console.info("TREASURY_MOVEMENT_PAID", {
        id: legacy.id,
        model: "Movement",
        prevStatus: legacy.status ?? null,
        nextStatus,
      });

      return NextResponse.json({ ok: true, updated });
    }
  }

  return NextResponse.json({ error: "Movimiento no existe" }, { status: 404 });
}
