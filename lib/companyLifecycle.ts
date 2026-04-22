import "server-only";

import { randomUUID } from "crypto";
import {
  CompanyKind,
  CompanyReviewSource,
  CompanyReviewStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";

const COMPANY_DOCUMENT_BUCKET = "kyc";
const MAX_COMPANY_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_COMPANY_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type AdminCompanyFilter =
  | "all"
  | "pending"
  | "approved"
  | "observed"
  | "rejected"
  | "unreviewed";

export const adminCompanyFilters: ReadonlyArray<{
  value: AdminCompanyFilter;
  label: string;
}> = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "observed", label: "Observadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "unreviewed", label: "Sin revisión" },
];

const companyMemberUserSelect = {
  id: true,
  email: true,
  personProfile: {
    select: {
      fullName: true,
    },
  },
} satisfies Prisma.UserSelect;

const adminCompanyListSelect = {
  id: true,
  name: true,
  kind: true,
  companyRut: true,
  review: {
    select: {
      status: true,
      source: true,
      submittedByEmail: true,
      submittedByName: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  members: {
    select: {
      role: true,
      user: {
        select: companyMemberUserSelect,
      },
    },
  },
  _count: {
    select: {
      documents: true,
      members: true,
    },
  },
} satisfies Prisma.CompanySelect;

const adminCompanyDetailSelect = {
  id: true,
  name: true,
  kind: true,
  companyRut: true,
  onboardingCompleted: true,
  fundsDeclAcceptedAt: true,
  privacyAcceptedAt: true,
  termsAcceptedAt: true,
  review: {
    select: {
      status: true,
      source: true,
      submittedByEmail: true,
      submittedByName: true,
      submissionNote: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      reviewedByAdmin: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  },
  documents: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      kind: true,
      storageBucket: true,
      filePath: true,
      fileName: true,
      fileMime: true,
      fileSizeBytes: true,
      note: true,
      createdAt: true,
      uploadedByUser: {
        select: {
          email: true,
          personProfile: {
            select: {
              fullName: true,
            },
          },
        },
      },
      uploadedByAdmin: {
        select: {
          email: true,
        },
      },
    },
  },
  members: {
    select: {
      role: true,
      user: {
        select: {
          ...companyMemberUserSelect,
          onboarding: {
            select: {
              termsAcceptedAt: true,
              idDocumentFrontPath: true,
              idDocumentBackPath: true,
            },
          },
          bankAccount: {
            select: {
              bankName: true,
              accountType: true,
              accountNumber: true,
              holderRut: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CompanySelect;

type AdminCompanyListCompany = Prisma.CompanyGetPayload<{
  select: typeof adminCompanyListSelect;
}>;

type AdminCompanyDetailCompany = Prisma.CompanyGetPayload<{
  select: typeof adminCompanyDetailSelect;
}>;

export type AdminCompanyListItem = {
  companyId: string;
  name: string;
  kind: "BUSINESS" | "PERSONAL";
  companyRut: string | null;
  contactName: string | null;
  contactEmail: string | null;
  linkedUserEmail: string | null;
  linkedUserId: string | null;
  reviewStatus: CompanyReviewStatus | null;
  reviewStatusLabel: string;
  reviewSource: CompanyReviewSource | null;
  reviewSourceLabel: string;
  documentsCount: number;
  membersCount: number;
  reviewCreatedAt: string | null;
  reviewUpdatedAt: string | null;
  reviewedAt: string | null;
};

export type AdminCompaniesListResponse = {
  filter: AdminCompanyFilter;
  q: string;
  rows: AdminCompanyListItem[];
  counts: {
    total: number;
    pending: number;
    approved: number;
    observed: number;
    rejected: number;
    unreviewed: number;
  };
};

export type AdminCompanyDetail = {
  companyId: string;
  name: string;
  kind: "BUSINESS" | "PERSONAL";
  companyRut: string | null;
  customerDetailHref: string;
  flags: {
    onboardingCompleted: boolean;
    fundsDeclAcceptedAt: string | null;
    privacyAcceptedAt: string | null;
    termsAcceptedAt: string | null;
  };
  review: {
    status: CompanyReviewStatus | null;
    statusLabel: string;
    source: CompanyReviewSource | null;
    sourceLabel: string;
    submittedByName: string | null;
    submittedByEmail: string | null;
    submissionNote: string | null;
    reviewNote: string | null;
    reviewedAt: string | null;
    reviewedByAdminEmail: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    canReview: boolean;
    isLegacyWithoutReview: boolean;
  };
  members: Array<{
    userId: string;
    name: string | null;
    email: string;
    role: string;
    onboardingComplete: boolean;
    hasBankAccount: boolean;
  }>;
  documents: Array<{
    id: string;
    kind: string;
    createdAt: string;
    fileName: string | null;
    fileMime: string | null;
    fileSizeBytes: string | null;
    note: string | null;
    hasFile: boolean;
    uploadedByLabel: string | null;
  }>;
};

type CreateClientBusinessCompanyInput = {
  userId: string;
  userEmail: string;
  userName: string | null;
  companyName: string;
  companyRut?: string | null;
  submissionNote?: string | null;
  documentFile?: File | null;
  documentNote?: string | null;
};

type CreateAdminBusinessCompanyInput = {
  adminUserId: string;
  companyName: string;
  companyRut?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  submissionNote?: string | null;
  documentFile?: File | null;
  documentNote?: string | null;
  initialStatus: "PENDING" | "APPROVED";
};

function normalizeText(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function normalizeEmail(value: string | null | undefined) {
  const email = normalizeText(value)?.toLowerCase() ?? null;
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizeCompanyRut(value: string | null | undefined) {
  const rut = normalizeText(value);
  return rut ? rut.replace(/\s+/g, "").toUpperCase() : null;
}

function isReservedCompanyName(name: string) {
  return name.trim().toUpperCase() === "__SYSTEM_WALLET__";
}

function assertBusinessCompanyName(name: string) {
  const normalized = name.trim();
  if (normalized.length < 3) {
    throw new Error("company_name_too_short");
  }
  if (isReservedCompanyName(normalized)) {
    throw new Error("company_name_reserved");
  }
  return normalized;
}

function assertManualCreationStatus(value: string) {
  if (value === "PENDING" || value === "APPROVED") return value;
  throw new Error("invalid_initial_status");
}

function companyReviewStatusLabel(status: CompanyReviewStatus | null, kind: CompanyKind) {
  if (kind === CompanyKind.PERSONAL) return "No aplica";
  switch (status) {
    case CompanyReviewStatus.PENDING:
      return "Pendiente";
    case CompanyReviewStatus.APPROVED:
      return "Aprobada";
    case CompanyReviewStatus.OBSERVED:
      return "Observada";
    case CompanyReviewStatus.REJECTED:
      return "Rechazada";
    default:
      return "Sin revisión";
  }
}

function companyReviewSourceLabel(source: CompanyReviewSource | null) {
  switch (source) {
    case CompanyReviewSource.CLIENT:
      return "Cliente";
    case CompanyReviewSource.ADMIN:
      return "Admin";
    default:
      return "—";
  }
}

function formatMaybeIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function formatBigIntString(value: bigint | null | undefined) {
  return value === null || value === undefined ? null : value.toString();
}

function pickPrimaryMember(
  members: AdminCompanyListCompany["members"] | AdminCompanyDetailCompany["members"]
) {
  const priority = ["owner", "admin"];
  const sorted = [...members].sort((a, b) => {
    const aIdx = priority.indexOf(String(a.role).toLowerCase());
    const bIdx = priority.indexOf(String(b.role).toLowerCase());
    const aScore = aIdx === -1 ? priority.length : aIdx;
    const bScore = bIdx === -1 ? priority.length : bIdx;
    return aScore - bScore;
  });

  return sorted[0] ?? null;
}

function companyWhereBase() {
  return {
    name: { not: "__SYSTEM_WALLET__" },
    kind: CompanyKind.BUSINESS,
  } satisfies Prisma.CompanyWhereInput;
}

function companyFilterWhere(filter: AdminCompanyFilter): Prisma.CompanyWhereInput {
  switch (filter) {
    case "pending":
      return { review: { is: { status: CompanyReviewStatus.PENDING } } };
    case "approved":
      return { review: { is: { status: CompanyReviewStatus.APPROVED } } };
    case "observed":
      return { review: { is: { status: CompanyReviewStatus.OBSERVED } } };
    case "rejected":
      return { review: { is: { status: CompanyReviewStatus.REJECTED } } };
    case "unreviewed":
      return { review: { is: null } };
    default:
      return {};
  }
}

function companySearchWhere(q: string): Prisma.CompanyWhereInput {
  const term = q.trim();
  if (!term) return {};

  return {
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { companyRut: { contains: term, mode: "insensitive" } },
      { review: { is: { submittedByEmail: { contains: term, mode: "insensitive" } } } },
      { review: { is: { submittedByName: { contains: term, mode: "insensitive" } } } },
      { members: { some: { user: { email: { contains: term, mode: "insensitive" } } } } },
      {
        members: {
          some: {
            user: {
              personProfile: {
                is: {
                  fullName: { contains: term, mode: "insensitive" },
                },
              },
            },
          },
        },
      },
    ],
  };
}

async function assertUniqueBusinessRut(companyRut: string | null) {
  if (!companyRut) return;

  const existing = await prisma.company.findFirst({
    where: {
      kind: CompanyKind.BUSINESS,
      companyRut,
      name: { not: "__SYSTEM_WALLET__" },
    },
    select: { id: true, name: true },
  });

  if (existing) {
    throw new Error("company_rut_exists");
  }
}

function safeDocumentExtension(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf", "jpg", "jpeg", "png", "webp"].includes(ext)) return ext;
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function buildCompanyDocumentPath(companyId: string, file: File) {
  return `company/${companyId}/documents/${Date.now()}-${randomUUID()}.${safeDocumentExtension(file)}`;
}

async function uploadCompanyDocumentFile(companyId: string, file: File) {
  if (!ALLOWED_COMPANY_DOCUMENT_MIME_TYPES.has(file.type)) {
    throw new Error("invalid_document_type");
  }
  if (file.size > MAX_COMPANY_DOCUMENT_BYTES) {
    throw new Error("document_too_large");
  }

  const filePath = buildCompanyDocumentPath(companyId, file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await supabaseServer.storage
    .from(COMPANY_DOCUMENT_BUCKET)
    .upload(filePath, bytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`document_upload_failed:${error.message}`);
  }

  return {
    storageBucket: COMPANY_DOCUMENT_BUCKET,
    filePath,
    fileName: file.name,
    fileMime: file.type,
    fileSizeBytes: BigInt(file.size),
  };
}

async function removeCompanyDocumentFile(filePath: string | null | undefined) {
  if (!filePath) return;
  await supabaseServer.storage.from(COMPANY_DOCUMENT_BUCKET).remove([filePath]).catch(() => {});
}

async function createCompanyDocumentRecord(input: {
  companyId: string;
  uploadedByUserId?: string | null;
  uploadedByAdminUserId?: string | null;
  documentFile?: File | null;
  documentNote?: string | null;
}) {
  const normalizedNote = normalizeText(input.documentNote);
  const file = input.documentFile instanceof File && input.documentFile.size > 0
    ? input.documentFile
    : null;

  if (!file && !normalizedNote) return null;

  let uploadedFile:
    | {
        storageBucket: string;
        filePath: string;
        fileName: string;
        fileMime: string;
        fileSizeBytes: bigint;
      }
    | null = null;

  try {
    if (file) {
      uploadedFile = await uploadCompanyDocumentFile(input.companyId, file);
    }

    return await prisma.companyDocument.create({
      data: {
        companyId: input.companyId,
        uploadedByUserId: input.uploadedByUserId ?? null,
        uploadedByAdminUserId: input.uploadedByAdminUserId ?? null,
        note: normalizedNote,
        ...(uploadedFile ?? {}),
      },
    });
  } catch (error) {
    await removeCompanyDocumentFile(uploadedFile?.filePath);
    throw error;
  }
}

function mapAdminCompanyListItem(company: AdminCompanyListCompany): AdminCompanyListItem {
  const primaryMember = pickPrimaryMember(company.members);
  const contactName =
    company.review?.submittedByName ??
    primaryMember?.user.personProfile?.fullName ??
    null;
  const contactEmail = company.review?.submittedByEmail ?? primaryMember?.user.email ?? null;

  return {
    companyId: company.id,
    name: company.name,
    kind: company.kind,
    companyRut: company.companyRut ?? null,
    contactName,
    contactEmail,
    linkedUserEmail: primaryMember?.user.email ?? null,
    linkedUserId: primaryMember?.user.id ?? null,
    reviewStatus: company.review?.status ?? null,
    reviewStatusLabel: companyReviewStatusLabel(company.review?.status ?? null, company.kind),
    reviewSource: company.review?.source ?? null,
    reviewSourceLabel: companyReviewSourceLabel(company.review?.source ?? null),
    documentsCount: company._count.documents,
    membersCount: company._count.members,
    reviewCreatedAt: formatMaybeIso(company.review?.createdAt),
    reviewUpdatedAt: formatMaybeIso(company.review?.updatedAt),
    reviewedAt: formatMaybeIso(company.review?.reviewedAt),
  };
}

export async function listAdminCompanies(input?: {
  filter?: string | null;
  q?: string | null;
}): Promise<AdminCompaniesListResponse> {
  const filter = (adminCompanyFilters.some((item) => item.value === input?.filter)
    ? input?.filter
    : "all") as AdminCompanyFilter;
  const q = String(input?.q ?? "").trim();

  const where: Prisma.CompanyWhereInput = {
    AND: [companyWhereBase(), companyFilterWhere(filter), companySearchWhere(q)],
  };

  const [rows, total, pending, approved, observed, rejected, unreviewed] = await Promise.all([
    prisma.company.findMany({
      where,
      select: adminCompanyListSelect,
    }),
    prisma.company.count({ where: companyWhereBase() }),
    prisma.company.count({
      where: {
        AND: [companyWhereBase(), { review: { is: { status: CompanyReviewStatus.PENDING } } }],
      },
    }),
    prisma.company.count({
      where: {
        AND: [companyWhereBase(), { review: { is: { status: CompanyReviewStatus.APPROVED } } }],
      },
    }),
    prisma.company.count({
      where: {
        AND: [companyWhereBase(), { review: { is: { status: CompanyReviewStatus.OBSERVED } } }],
      },
    }),
    prisma.company.count({
      where: {
        AND: [companyWhereBase(), { review: { is: { status: CompanyReviewStatus.REJECTED } } }],
      },
    }),
    prisma.company.count({
      where: {
        AND: [companyWhereBase(), { review: { is: null } }],
      },
    }),
  ]);

  const mapped = rows
    .map(mapAdminCompanyListItem)
    .sort((a, b) => {
      const aPending = a.reviewStatus === CompanyReviewStatus.PENDING ? 0 : 1;
      const bPending = b.reviewStatus === CompanyReviewStatus.PENDING ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;

      const aUpdated = a.reviewUpdatedAt ? new Date(a.reviewUpdatedAt).getTime() : 0;
      const bUpdated = b.reviewUpdatedAt ? new Date(b.reviewUpdatedAt).getTime() : 0;
      if (aUpdated !== bUpdated) return bUpdated - aUpdated;

      return a.name.localeCompare(b.name, "es");
    });

  return {
    filter,
    q,
    rows: mapped,
    counts: {
      total,
      pending,
      approved,
      observed,
      rejected,
      unreviewed,
    },
  };
}

export async function getAdminCompanyDetail(companyId: string): Promise<AdminCompanyDetail | null> {
  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      name: { not: "__SYSTEM_WALLET__" },
    },
    select: adminCompanyDetailSelect,
  });

  if (!company) return null;

  return {
    companyId: company.id,
    name: company.name,
    kind: company.kind,
    companyRut: company.companyRut ?? null,
    customerDetailHref: `/admin/customers/${company.id}`,
    flags: {
      onboardingCompleted: company.onboardingCompleted,
      fundsDeclAcceptedAt: formatMaybeIso(company.fundsDeclAcceptedAt),
      privacyAcceptedAt: formatMaybeIso(company.privacyAcceptedAt),
      termsAcceptedAt: formatMaybeIso(company.termsAcceptedAt),
    },
    review: {
      status: company.review?.status ?? null,
      statusLabel: companyReviewStatusLabel(company.review?.status ?? null, company.kind),
      source: company.review?.source ?? null,
      sourceLabel: companyReviewSourceLabel(company.review?.source ?? null),
      submittedByName: company.review?.submittedByName ?? null,
      submittedByEmail: company.review?.submittedByEmail ?? null,
      submissionNote: company.review?.submissionNote ?? null,
      reviewNote: company.review?.reviewNote ?? null,
      reviewedAt: formatMaybeIso(company.review?.reviewedAt),
      reviewedByAdminEmail: company.review?.reviewedByAdmin?.email ?? null,
      createdAt: formatMaybeIso(company.review?.createdAt),
      updatedAt: formatMaybeIso(company.review?.updatedAt),
      canReview: company.kind === CompanyKind.BUSINESS,
      isLegacyWithoutReview: company.kind === CompanyKind.BUSINESS && !company.review,
    },
    members: company.members
      .map((member) => ({
        userId: member.user.id,
        name: member.user.personProfile?.fullName ?? null,
        email: member.user.email,
        role: member.role,
        onboardingComplete: Boolean(member.user.onboarding?.termsAcceptedAt),
        hasBankAccount: Boolean(member.user.bankAccount),
      }))
      .sort((a, b) => a.role.localeCompare(b.role)),
    documents: company.documents.map((document) => ({
      id: document.id,
      kind: document.kind,
      createdAt: document.createdAt.toISOString(),
      fileName: document.fileName ?? null,
      fileMime: document.fileMime ?? null,
      fileSizeBytes: formatBigIntString(document.fileSizeBytes),
      note: document.note ?? null,
      hasFile: Boolean(document.storageBucket && document.filePath),
      uploadedByLabel:
        document.uploadedByAdmin?.email ??
        document.uploadedByUser?.personProfile?.fullName ??
        document.uploadedByUser?.email ??
        null,
    })),
  };
}

export async function createClientBusinessCompany(input: CreateClientBusinessCompanyInput) {
  const companyName = assertBusinessCompanyName(input.companyName);
  const companyRut = normalizeCompanyRut(input.companyRut);
  const submissionNote = normalizeText(input.submissionNote);
  const documentNote = normalizeText(input.documentNote);
  await assertUniqueBusinessRut(companyRut);

  let companyId: string | null = null;

  try {
    const company = await prisma.company.create({
      data: {
        name: companyName,
        kind: CompanyKind.BUSINESS,
        companyRut,
        members: {
          create: {
            userId: input.userId,
            role: "owner",
          },
        },
        review: {
          create: {
            status: CompanyReviewStatus.PENDING,
            source: CompanyReviewSource.CLIENT,
            submittedByUserId: input.userId,
            submittedByEmail: input.userEmail,
            submittedByName: normalizeText(input.userName),
            submissionNote,
          },
        },
      },
      select: { id: true },
    });

    companyId = company.id;

    await createCompanyDocumentRecord({
      companyId: company.id,
      uploadedByUserId: input.userId,
      documentFile: input.documentFile,
      documentNote,
    });

    return { ok: true as const, companyId: company.id };
  } catch (error) {
    if (companyId) {
      await prisma.company.delete({ where: { id: companyId } }).catch(() => {});
    }
    throw error;
  }
}

export async function createAdminBusinessCompany(input: CreateAdminBusinessCompanyInput) {
  const companyName = assertBusinessCompanyName(input.companyName);
  const companyRut = normalizeCompanyRut(input.companyRut);
  const contactEmail = normalizeEmail(input.contactEmail);
  const contactName = normalizeText(input.contactName);
  const submissionNote = normalizeText(input.submissionNote);
  const documentNote = normalizeText(input.documentNote);
  const initialStatus = assertManualCreationStatus(input.initialStatus);
  await assertUniqueBusinessRut(companyRut);

  const linkedUser = contactEmail
    ? await prisma.user.findUnique({
        where: { email: contactEmail },
        select: {
          id: true,
          email: true,
          personProfile: {
            select: {
              fullName: true,
            },
          },
        },
      })
    : null;

  let companyId: string | null = null;

  try {
    const company = await prisma.company.create({
      data: {
        name: companyName,
        kind: CompanyKind.BUSINESS,
        companyRut,
        members: linkedUser
          ? {
              create: {
                userId: linkedUser.id,
                role: "owner",
              },
            }
          : undefined,
        review: {
          create: {
            status: initialStatus === "APPROVED" ? CompanyReviewStatus.APPROVED : CompanyReviewStatus.PENDING,
            source: CompanyReviewSource.ADMIN,
            submittedByEmail: contactEmail,
            submittedByName: contactName ?? linkedUser?.personProfile?.fullName ?? null,
            submissionNote,
            reviewedByAdminUserId: initialStatus === "APPROVED" ? input.adminUserId : null,
            reviewedAt: initialStatus === "APPROVED" ? new Date() : null,
          },
        },
      },
      select: { id: true },
    });

    companyId = company.id;

    await createCompanyDocumentRecord({
      companyId: company.id,
      uploadedByAdminUserId: input.adminUserId,
      documentFile: input.documentFile,
      documentNote,
    });

    return {
      ok: true as const,
      companyId: company.id,
      linkedUserId: linkedUser?.id ?? null,
      linkedUserEmail: linkedUser?.email ?? null,
    };
  } catch (error) {
    if (companyId) {
      await prisma.company.delete({ where: { id: companyId } }).catch(() => {});
    }
    throw error;
  }
}

export async function reviewCompanyFromAdmin(input: {
  companyId: string;
  adminUserId: string;
  status: CompanyReviewStatus;
  note?: string | null;
}) {
  if (
    ![
      CompanyReviewStatus.APPROVED,
      CompanyReviewStatus.OBSERVED,
      CompanyReviewStatus.REJECTED,
      CompanyReviewStatus.PENDING,
    ].includes(input.status)
  ) {
    throw new Error("invalid_review_status");
  }

  const company = await prisma.company.findFirst({
    where: {
      id: input.companyId,
      name: { not: "__SYSTEM_WALLET__" },
    },
    select: {
      id: true,
      kind: true,
      review: {
        select: {
          source: true,
          submittedByEmail: true,
          submittedByName: true,
        },
      },
      members: {
        orderBy: { role: "asc" },
        take: 1,
        select: {
          user: {
            select: {
              email: true,
              personProfile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!company) {
    throw new Error("company_not_found");
  }
  if (company.kind !== CompanyKind.BUSINESS) {
    throw new Error("company_review_not_applicable");
  }

  const primaryMember = company.members[0]?.user;
  const now = new Date();

  await prisma.companyReview.upsert({
    where: { companyId: company.id },
    update: {
      status: input.status,
      reviewNote: normalizeText(input.note),
      reviewedByAdminUserId: input.adminUserId,
      reviewedAt: now,
    },
    create: {
      companyId: company.id,
      status: input.status,
      source: company.review?.source ?? CompanyReviewSource.ADMIN,
      submittedByEmail: company.review?.submittedByEmail ?? primaryMember?.email ?? null,
      submittedByName:
        company.review?.submittedByName ?? primaryMember?.personProfile?.fullName ?? null,
      reviewNote: normalizeText(input.note),
      reviewedByAdminUserId: input.adminUserId,
      reviewedAt: now,
    },
  });

  return { ok: true as const };
}

export async function getAdminCompanyDocumentDownloadUrl(input: {
  companyId: string;
  documentId: string;
}) {
  const document = await prisma.companyDocument.findFirst({
    where: {
      id: input.documentId,
      companyId: input.companyId,
      company: {
        name: { not: "__SYSTEM_WALLET__" },
      },
    },
    select: {
      storageBucket: true,
      filePath: true,
    },
  });

  if (!document?.storageBucket || !document.filePath) {
    return null;
  }

  const { data, error } = await supabaseServer.storage
    .from(document.storageBucket)
    .createSignedUrl(document.filePath, 600);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "company_document_signed_url_failed");
  }

  return data.signedUrl;
}
