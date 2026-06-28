import "server-only";

import {
  ConsultingBusinessLine,
  ConsultingContactStatus,
  ConsultingEmailStatus,
  ConsultingPipelineStage,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CONSULTING_BUSINESS_LINE_OPTIONS: ReadonlyArray<{
  value: ConsultingBusinessLine;
  label: string;
}> = [
  { value: ConsultingBusinessLine.FLEXIBLE_FUNDING, label: "Fondeo Flexible" },
  { value: ConsultingBusinessLine.OPERATING_TREASURY, label: "Tesorería Operativa" },
] as const;

export const CONSULTING_EMAIL_STATUS_OPTIONS: ReadonlyArray<{
  value: ConsultingEmailStatus;
  label: string;
}> = [
  { value: ConsultingEmailStatus.UNKNOWN, label: "Desconocido" },
  { value: ConsultingEmailStatus.VALID, label: "Válido" },
  { value: ConsultingEmailStatus.INVALID, label: "Inválido" },
  { value: ConsultingEmailStatus.NOT_FOUND, label: "No encontrado" },
] as const;

export const CONSULTING_CONTACT_STATUS_OPTIONS: ReadonlyArray<{
  value: ConsultingContactStatus;
  label: string;
}> = [
  { value: ConsultingContactStatus.NEW, label: "Nuevo" },
  {
    value: ConsultingContactStatus.LINKEDIN_INVITE_SENT,
    label: "Invitación LinkedIn enviada",
  },
  {
    value: ConsultingContactStatus.LINKEDIN_ACCEPTED,
    label: "LinkedIn aceptado",
  },
  {
    value: ConsultingContactStatus.LINKEDIN_MESSAGE_SENT,
    label: "Mensaje LinkedIn enviado",
  },
  { value: ConsultingContactStatus.EMAIL_SENT, label: "Email enviado" },
  { value: ConsultingContactStatus.RESPONDED, label: "Respondió" },
  {
    value: ConsultingContactStatus.MEETING_SCHEDULED,
    label: "Reunión agendada",
  },
  { value: ConsultingContactStatus.MEETING_DONE, label: "Reunión realizada" },
  {
    value: ConsultingContactStatus.FOLLOW_UP_1_SENT,
    label: "Follow-up 1 enviado",
  },
  {
    value: ConsultingContactStatus.FOLLOW_UP_2_SENT,
    label: "Follow-up 2 enviado",
  },
  { value: ConsultingContactStatus.DORMANT, label: "Dormant" },
  { value: ConsultingContactStatus.DISCARDED, label: "Descartado" },
] as const;

export const CONSULTING_PIPELINE_STAGE_OPTIONS: ReadonlyArray<{
  value: ConsultingPipelineStage;
  label: string;
}> = [
  { value: ConsultingPipelineStage.PROSPECTING, label: "Prospecting" },
  { value: ConsultingPipelineStage.CONTACTED, label: "Contactado" },
  {
    value: ConsultingPipelineStage.CONVERSATION_OPEN,
    label: "Conversación abierta",
  },
  {
    value: ConsultingPipelineStage.MEETING_SCHEDULED,
    label: "Reunión agendada",
  },
  { value: ConsultingPipelineStage.MEETING_DONE, label: "Reunión realizada" },
  { value: ConsultingPipelineStage.PROPOSAL_SENT, label: "Propuesta enviada" },
  {
    value: ConsultingPipelineStage.DIAGNOSIS_NEGOTIATION,
    label: "Negociación diagnóstico",
  },
  {
    value: ConsultingPipelineStage.DIAGNOSIS_WON,
    label: "Diagnóstico ganado",
  },
  { value: ConsultingPipelineStage.LOST, label: "Perdido" },
  { value: ConsultingPipelineStage.PAUSED, label: "Pausado" },
] as const;

export const CONSULTING_ACTION_FILTER_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Con acción pendiente" },
  { value: "due-now", label: "Vence ahora" },
  { value: "manual", label: "Con próxima acción manual" },
] as const;

export type ConsultingActionFilter = (typeof CONSULTING_ACTION_FILTER_OPTIONS)[number]["value"];

export type ConsultingProspectFilters = {
  businessLine?: string | null;
  country?: string | null;
  contactStatus?: string | null;
  pipelineStage?: string | null;
  actionFilter?: string | null;
};

type ConsultingProspectRecord = Prisma.ConsultingProspectGetPayload<{
  select: typeof consultingProspectSelect;
}>;

const consultingProspectSelect = {
  id: true,
  businessLine: true,
  country: true,
  companyName: true,
  contactName: true,
  contactRole: true,
  linkedinUrl: true,
  email: true,
  emailStatus: true,
  source: true,
  contactStatus: true,
  pipelineStage: true,
  linkedinInviteSentAt: true,
  linkedinAcceptedAt: true,
  linkedinMessageSentAt: true,
  emailSentAt: true,
  respondedAt: true,
  meetingScheduledAt: true,
  meetingDoneAt: true,
  followUp1SentAt: true,
  followUp2SentAt: true,
  nextAction: true,
  nextActionAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
  createdBy: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
} satisfies Prisma.ConsultingProspectSelect;

const CONTACT_STATUS_TIMESTAMP_FIELD: Partial<
  Record<ConsultingContactStatus, keyof ConsultingProspectDateFields>
> = {
  [ConsultingContactStatus.LINKEDIN_INVITE_SENT]: "linkedinInviteSentAt",
  [ConsultingContactStatus.LINKEDIN_ACCEPTED]: "linkedinAcceptedAt",
  [ConsultingContactStatus.LINKEDIN_MESSAGE_SENT]: "linkedinMessageSentAt",
  [ConsultingContactStatus.EMAIL_SENT]: "emailSentAt",
  [ConsultingContactStatus.RESPONDED]: "respondedAt",
  [ConsultingContactStatus.MEETING_SCHEDULED]: "meetingScheduledAt",
  [ConsultingContactStatus.MEETING_DONE]: "meetingDoneAt",
  [ConsultingContactStatus.FOLLOW_UP_1_SENT]: "followUp1SentAt",
  [ConsultingContactStatus.FOLLOW_UP_2_SENT]: "followUp2SentAt",
};

type ConsultingProspectDateFields = {
  linkedinInviteSentAt: Date | null;
  linkedinAcceptedAt: Date | null;
  linkedinMessageSentAt: Date | null;
  emailSentAt: Date | null;
  respondedAt: Date | null;
  meetingScheduledAt: Date | null;
  meetingDoneAt: Date | null;
  followUp1SentAt: Date | null;
  followUp2SentAt: Date | null;
};

type ProspectTimestampPatch = Partial<ConsultingProspectDateFields>;

export type ConsultingSuggestedAction = {
  text: string;
  at: string | null;
  hasPendingAction: boolean;
  isDueNow: boolean;
};

export type ConsultingProspectListItem = {
  id: string;
  businessLine: ConsultingBusinessLine;
  businessLineLabel: string;
  country: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  linkedinUrl: string | null;
  email: string | null;
  emailStatus: ConsultingEmailStatus;
  emailStatusLabel: string;
  source: string | null;
  contactStatus: ConsultingContactStatus;
  contactStatusLabel: string;
  pipelineStage: ConsultingPipelineStage;
  pipelineStageLabel: string;
  nextActionManual: string | null;
  nextActionAt: string | null;
  isNextActionDueNow: boolean;
  suggestedAction: ConsultingSuggestedAction;
  effectiveNextAction: string;
  lastActivityAt: string;
  updatedAt: string;
};

export type ConsultingMetrics = {
  totalProspects: number;
  linkedinInvitesSent: number;
  linkedinAccepted: number;
  messagesSent: number;
  responses: number;
  meetingsScheduled: number;
  meetingsDone: number;
  proposalsSent: number;
  diagnosisWon: number;
};

export type ConsultingPendingActionItem = {
  id: string;
  companyName: string;
  contactName: string;
  businessLineLabel: string;
  pipelineStageLabel: string;
  actionText: string;
  actionAt: string | null;
  isDueNow: boolean;
  isManual: boolean;
};

export type ConsultingPageData = {
  filters: {
    businessLine: string;
    country: string;
    contactStatus: string;
    pipelineStage: string;
    actionFilter: ConsultingActionFilter;
  };
  rows: ConsultingProspectListItem[];
  metrics: ConsultingMetrics;
  pendingActions: ConsultingPendingActionItem[];
  countryOptions: string[];
};

export type ConsultingProspectDetail = {
  id: string;
  businessLine: ConsultingBusinessLine;
  country: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  linkedinUrl: string;
  email: string;
  emailStatus: ConsultingEmailStatus;
  source: string;
  contactStatus: ConsultingContactStatus;
  pipelineStage: ConsultingPipelineStage;
  nextAction: string;
  nextActionAt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  automaticDates: Record<string, string | null>;
  suggestedAction: ConsultingSuggestedAction;
};

type ConsultingProspectMutationInput = {
  businessLine: string;
  country: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  linkedinUrl?: string | null;
  email?: string | null;
  emailStatus?: string | null;
  source?: string | null;
  contactStatus?: string | null;
  pipelineStage?: string | null;
  nextAction?: string | null;
  nextActionAt?: string | null;
  notes?: string | null;
};

function optionLabel<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function normalizeText(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

function normalizeRequiredText(value: string | null | undefined, field: string) {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new Error(`${field}_required`);
  }
  return normalized;
}

function normalizeCountry(value: string | null | undefined) {
  return normalizeRequiredText(value, "country");
}

function normalizeOptionalEmail(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : null;
}

function normalizeOptionalUrl(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return normalized ?? null;
}

function normalizeBusinessLine(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (
    normalized === ConsultingBusinessLine.FLEXIBLE_FUNDING ||
    normalized === ConsultingBusinessLine.OPERATING_TREASURY
  ) {
    return normalized as ConsultingBusinessLine;
  }
  throw new Error("invalid_business_line");
}

function normalizeEmailStatus(value: string | null | undefined) {
  const normalized = String(value ?? ConsultingEmailStatus.UNKNOWN)
    .trim()
    .toUpperCase();
  if (
    normalized === ConsultingEmailStatus.UNKNOWN ||
    normalized === ConsultingEmailStatus.VALID ||
    normalized === ConsultingEmailStatus.INVALID ||
    normalized === ConsultingEmailStatus.NOT_FOUND
  ) {
    return normalized as ConsultingEmailStatus;
  }
  throw new Error("invalid_email_status");
}

function normalizeContactStatus(value: string | null | undefined) {
  const normalized = String(value ?? ConsultingContactStatus.LINKEDIN_INVITE_SENT)
    .trim()
    .toUpperCase();
  if (Object.values(ConsultingContactStatus).includes(normalized as ConsultingContactStatus)) {
    return normalized as ConsultingContactStatus;
  }
  throw new Error("invalid_contact_status");
}

function normalizePipelineStage(value: string | null | undefined) {
  const normalized = String(value ?? ConsultingPipelineStage.PROSPECTING)
    .trim()
    .toUpperCase();
  if (Object.values(ConsultingPipelineStage).includes(normalized as ConsultingPipelineStage)) {
    return normalized as ConsultingPipelineStage;
  }
  throw new Error("invalid_pipeline_stage");
}

function normalizeActionFilter(value: string | null | undefined): ConsultingActionFilter {
  const normalized = String(value ?? "all").trim().toLowerCase();
  return CONSULTING_ACTION_FILTER_OPTIONS.some((option) => option.value === normalized)
    ? (normalized as ConsultingActionFilter)
    : "all";
}

function parseNullableDate(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_next_action_at");
  }
  return date;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function toDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function maxDate(values: Array<Date | null | undefined>) {
  const filtered = values.filter((value): value is Date => Boolean(value));
  if (!filtered.length) return null;
  return filtered.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest
  );
}

function pickAutomaticTimestampPatch(
  contactStatus: ConsultingContactStatus,
  currentDates: ConsultingProspectDateFields
) {
  const field = CONTACT_STATUS_TIMESTAMP_FIELD[contactStatus];
  if (!field) return {};
  if (currentDates[field]) return {};
  return { [field]: new Date() } satisfies ProspectTimestampPatch;
}

function readProspectDates(
  prospect: Pick<ConsultingProspectRecord, keyof ConsultingProspectDateFields>
): ConsultingProspectDateFields {
  return {
    linkedinInviteSentAt: prospect.linkedinInviteSentAt,
    linkedinAcceptedAt: prospect.linkedinAcceptedAt,
    linkedinMessageSentAt: prospect.linkedinMessageSentAt,
    emailSentAt: prospect.emailSentAt,
    respondedAt: prospect.respondedAt,
    meetingScheduledAt: prospect.meetingScheduledAt,
    meetingDoneAt: prospect.meetingDoneAt,
    followUp1SentAt: prospect.followUp1SentAt,
    followUp2SentAt: prospect.followUp2SentAt,
  };
}

export function suggestConsultingNextAction(
  prospect: Pick<
    ConsultingProspectRecord,
    | "contactStatus"
    | "pipelineStage"
    | "linkedinAcceptedAt"
    | "linkedinMessageSentAt"
    | "emailSentAt"
    | "respondedAt"
    | "meetingScheduledAt"
    | "meetingDoneAt"
    | "followUp1SentAt"
    | "followUp2SentAt"
  >
): ConsultingSuggestedAction {
  const now = new Date();

  if (
    prospect.pipelineStage === ConsultingPipelineStage.LOST ||
    prospect.pipelineStage === ConsultingPipelineStage.PAUSED ||
    prospect.contactStatus === ConsultingContactStatus.DORMANT ||
    prospect.contactStatus === ConsultingContactStatus.DISCARDED
  ) {
    return {
      text: "Sin acción inmediata",
      at: null,
      hasPendingAction: false,
      isDueNow: false,
    };
  }

  if (prospect.pipelineStage === ConsultingPipelineStage.DIAGNOSIS_WON) {
    return {
      text: "Cliente ganado / diagnóstico contratado",
      at: null,
      hasPendingAction: false,
      isDueNow: false,
    };
  }

  if (prospect.pipelineStage === ConsultingPipelineStage.PROPOSAL_SENT) {
    return {
      text: "Hacer seguimiento de propuesta",
      at: null,
      hasPendingAction: true,
      isDueNow: false,
    };
  }

  if (prospect.pipelineStage === ConsultingPipelineStage.MEETING_DONE) {
    return {
      text: "Definir propuesta o siguiente paso",
      at: null,
      hasPendingAction: true,
      isDueNow: false,
    };
  }

  if (prospect.pipelineStage === ConsultingPipelineStage.MEETING_SCHEDULED) {
    return {
      text: "Preparar reunión",
      at: null,
      hasPendingAction: true,
      isDueNow: false,
    };
  }

  if (prospect.contactStatus === ConsultingContactStatus.RESPONDED) {
    return {
      text: "Responder y buscar reunión",
      at: null,
      hasPendingAction: true,
      isDueNow: false,
    };
  }

  if (prospect.contactStatus === ConsultingContactStatus.MEETING_SCHEDULED) {
    return {
      text: "Preparar reunión",
      at: null,
      hasPendingAction: true,
      isDueNow: false,
    };
  }

  if (prospect.contactStatus === ConsultingContactStatus.MEETING_DONE) {
    return {
      text: "Definir propuesta o siguiente paso",
      at: null,
      hasPendingAction: true,
      isDueNow: false,
    };
  }

  if (
    prospect.contactStatus === ConsultingContactStatus.LINKEDIN_ACCEPTED &&
    !prospect.linkedinMessageSentAt
  ) {
    return {
      text: "Enviar primer mensaje LinkedIn",
      at: null,
      hasPendingAction: true,
      isDueNow: true,
    };
  }

  if (
    prospect.linkedinMessageSentAt &&
    !prospect.respondedAt &&
    !prospect.followUp1SentAt
  ) {
    const followUpAt = addDays(prospect.linkedinMessageSentAt, 15);
    const isDueNow = followUpAt.getTime() <= now.getTime();
    return {
      text: isDueNow ? "Enviar follow-up 1" : "Esperar respuesta al primer mensaje",
      at: followUpAt.toISOString(),
      hasPendingAction: true,
      isDueNow,
    };
  }

  if (prospect.followUp1SentAt && !prospect.respondedAt && !prospect.followUp2SentAt) {
    const followUpAt = addDays(prospect.followUp1SentAt, 21);
    const isDueNow = followUpAt.getTime() <= now.getTime();
    return {
      text: isDueNow ? "Evaluar follow-up 2" : "Esperar respuesta al follow-up 1",
      at: followUpAt.toISOString(),
      hasPendingAction: true,
      isDueNow,
    };
  }

  if (prospect.contactStatus === ConsultingContactStatus.EMAIL_SENT && prospect.emailSentAt) {
    return {
      text: "Esperar respuesta del email",
      at: null,
      hasPendingAction: true,
      isDueNow: false,
    };
  }

  if (
    prospect.contactStatus === ConsultingContactStatus.LINKEDIN_INVITE_SENT &&
    !prospect.linkedinAcceptedAt
  ) {
    return {
      text: "Esperar aceptación o revisar manualmente",
      at: null,
      hasPendingAction: true,
      isDueNow: false,
    };
  }

  return {
    text: "Revisar prospecto manualmente",
    at: null,
    hasPendingAction: true,
    isDueNow: false,
  };
}

function mapListItem(prospect: ConsultingProspectRecord): ConsultingProspectListItem {
  const suggestedAction = suggestConsultingNextAction(prospect);
  const isNextActionDueNow = prospect.nextActionAt
    ? prospect.nextActionAt.getTime() <= Date.now()
    : false;
  const lastActivityAt =
    maxDate([
      prospect.linkedinInviteSentAt,
      prospect.linkedinAcceptedAt,
      prospect.linkedinMessageSentAt,
      prospect.emailSentAt,
      prospect.respondedAt,
      prospect.meetingScheduledAt,
      prospect.meetingDoneAt,
      prospect.followUp1SentAt,
      prospect.followUp2SentAt,
      prospect.updatedAt,
      prospect.createdAt,
    ]) ?? prospect.updatedAt;

  return {
    id: prospect.id,
    businessLine: prospect.businessLine,
    businessLineLabel: optionLabel(
      CONSULTING_BUSINESS_LINE_OPTIONS,
      prospect.businessLine
    ),
    country: prospect.country,
    companyName: prospect.companyName,
    contactName: prospect.contactName,
    contactRole: prospect.contactRole,
    linkedinUrl: prospect.linkedinUrl ?? null,
    email: prospect.email ?? null,
    emailStatus: prospect.emailStatus,
    emailStatusLabel: optionLabel(
      CONSULTING_EMAIL_STATUS_OPTIONS,
      prospect.emailStatus
    ),
    source: prospect.source ?? null,
    contactStatus: prospect.contactStatus,
    contactStatusLabel: optionLabel(
      CONSULTING_CONTACT_STATUS_OPTIONS,
      prospect.contactStatus
    ),
    pipelineStage: prospect.pipelineStage,
    pipelineStageLabel: optionLabel(
      CONSULTING_PIPELINE_STAGE_OPTIONS,
      prospect.pipelineStage
    ),
    nextActionManual: prospect.nextAction ?? null,
    nextActionAt: toIso(prospect.nextActionAt),
    isNextActionDueNow,
    suggestedAction,
    effectiveNextAction: prospect.nextAction ?? suggestedAction.text,
    lastActivityAt: lastActivityAt.toISOString(),
    updatedAt: prospect.updatedAt.toISOString(),
  };
}

function filterByAction(
  row: ConsultingProspectListItem,
  actionFilter: ConsultingActionFilter
) {
  if (actionFilter === "all") return true;
  if (actionFilter === "manual") return Boolean(row.nextActionManual);
  if (actionFilter === "due-now") {
    if (row.nextActionAt) return row.isNextActionDueNow;
    return row.suggestedAction.isDueNow;
  }
  if (actionFilter === "pending") {
    return Boolean(row.nextActionManual) || row.suggestedAction.hasPendingAction;
  }
  return true;
}

function normalizeCountryFilter(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeEnumFilter<T extends string>(value: string | null | undefined, allowed: T[]) {
  const normalized = String(value ?? "").trim().toUpperCase();
  return allowed.includes(normalized as T) ? (normalized as T) : "";
}

function buildWhere(filters: ConsultingProspectFilters): Prisma.ConsultingProspectWhereInput {
  const businessLine = normalizeEnumFilter(
    filters.businessLine,
    Object.values(ConsultingBusinessLine)
  );
  const country = normalizeCountryFilter(filters.country);
  const contactStatus = normalizeEnumFilter(
    filters.contactStatus,
    Object.values(ConsultingContactStatus)
  );
  const pipelineStage = normalizeEnumFilter(
    filters.pipelineStage,
    Object.values(ConsultingPipelineStage)
  );

  return {
    ...(businessLine ? { businessLine } : {}),
    ...(country ? { country: { equals: country, mode: "insensitive" } } : {}),
    ...(contactStatus ? { contactStatus } : {}),
    ...(pipelineStage ? { pipelineStage } : {}),
  };
}

async function fetchProspects(where: Prisma.ConsultingProspectWhereInput = {}) {
  return prisma.consultingProspect.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: consultingProspectSelect,
  });
}

export async function getConsultingPageData(
  filters: ConsultingProspectFilters = {}
): Promise<ConsultingPageData> {
  const actionFilter = normalizeActionFilter(filters.actionFilter);
  const where = buildWhere(filters);
  const [filteredProspects, allProspects] = await Promise.all([
    fetchProspects(where),
    fetchProspects(),
  ]);

  const rows = filteredProspects.map(mapListItem).filter((row) => filterByAction(row, actionFilter));
  const pendingActions = rows
    .filter((row) => Boolean(row.nextActionManual) || row.suggestedAction.hasPendingAction)
    .map<ConsultingPendingActionItem>((row) => ({
      id: row.id,
      companyName: row.companyName,
      contactName: row.contactName,
      businessLineLabel: row.businessLineLabel,
      pipelineStageLabel: row.pipelineStageLabel,
      actionText: row.nextActionManual ?? row.suggestedAction.text,
      actionAt: row.nextActionAt ?? row.suggestedAction.at,
      isDueNow: row.nextActionAt ? row.isNextActionDueNow : row.suggestedAction.isDueNow,
      isManual: Boolean(row.nextActionManual),
    }))
    .sort((a, b) => {
      if (a.isDueNow !== b.isDueNow) return a.isDueNow ? -1 : 1;
      const aAt = a.actionAt ? new Date(a.actionAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bAt = b.actionAt ? new Date(b.actionAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aAt - bAt;
    })
    .slice(0, 8);

  const metricsRows = allProspects.map(mapListItem);
  const metrics: ConsultingMetrics = {
    totalProspects: metricsRows.length,
    linkedinInvitesSent: metricsRows.filter(
      (row) =>
        row.contactStatus === ConsultingContactStatus.LINKEDIN_INVITE_SENT ||
        row.contactStatus === ConsultingContactStatus.LINKEDIN_ACCEPTED ||
        row.contactStatus === ConsultingContactStatus.LINKEDIN_MESSAGE_SENT ||
        row.contactStatus === ConsultingContactStatus.FOLLOW_UP_1_SENT ||
        row.contactStatus === ConsultingContactStatus.FOLLOW_UP_2_SENT ||
        row.contactStatus === ConsultingContactStatus.RESPONDED ||
        row.contactStatus === ConsultingContactStatus.MEETING_SCHEDULED ||
        row.contactStatus === ConsultingContactStatus.MEETING_DONE
    ).length,
    linkedinAccepted: metricsRows.filter(
      (row) =>
        row.contactStatus === ConsultingContactStatus.LINKEDIN_ACCEPTED ||
        row.contactStatus === ConsultingContactStatus.LINKEDIN_MESSAGE_SENT ||
        row.contactStatus === ConsultingContactStatus.FOLLOW_UP_1_SENT ||
        row.contactStatus === ConsultingContactStatus.FOLLOW_UP_2_SENT ||
        row.contactStatus === ConsultingContactStatus.RESPONDED ||
        row.contactStatus === ConsultingContactStatus.MEETING_SCHEDULED ||
        row.contactStatus === ConsultingContactStatus.MEETING_DONE
    ).length,
    messagesSent: metricsRows.filter(
      (row) =>
        row.contactStatus === ConsultingContactStatus.LINKEDIN_MESSAGE_SENT ||
        row.contactStatus === ConsultingContactStatus.EMAIL_SENT ||
        row.contactStatus === ConsultingContactStatus.FOLLOW_UP_1_SENT ||
        row.contactStatus === ConsultingContactStatus.FOLLOW_UP_2_SENT ||
        row.contactStatus === ConsultingContactStatus.RESPONDED ||
        row.contactStatus === ConsultingContactStatus.MEETING_SCHEDULED ||
        row.contactStatus === ConsultingContactStatus.MEETING_DONE
    ).length,
    responses: metricsRows.filter(
      (row) =>
        row.contactStatus === ConsultingContactStatus.RESPONDED ||
        row.contactStatus === ConsultingContactStatus.MEETING_SCHEDULED ||
        row.contactStatus === ConsultingContactStatus.MEETING_DONE
    ).length,
    meetingsScheduled: metricsRows.filter(
      (row) => row.pipelineStage === ConsultingPipelineStage.MEETING_SCHEDULED
    ).length,
    meetingsDone: metricsRows.filter(
      (row) => row.pipelineStage === ConsultingPipelineStage.MEETING_DONE
    ).length,
    proposalsSent: metricsRows.filter(
      (row) => row.pipelineStage === ConsultingPipelineStage.PROPOSAL_SENT
    ).length,
    diagnosisWon: metricsRows.filter(
      (row) => row.pipelineStage === ConsultingPipelineStage.DIAGNOSIS_WON
    ).length,
  };

  const countryOptions = Array.from(
    new Set(allProspects.map((prospect) => prospect.country.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "es"));

  return {
    filters: {
      businessLine: normalizeEnumFilter(
        filters.businessLine,
        Object.values(ConsultingBusinessLine)
      ),
      country: normalizeCountryFilter(filters.country),
      contactStatus: normalizeEnumFilter(
        filters.contactStatus,
        Object.values(ConsultingContactStatus)
      ),
      pipelineStage: normalizeEnumFilter(
        filters.pipelineStage,
        Object.values(ConsultingPipelineStage)
      ),
      actionFilter,
    },
    rows,
    metrics,
    pendingActions,
    countryOptions,
  };
}

export async function getConsultingMetrics() {
  const data = await getConsultingPageData();
  return data.metrics;
}

export async function getConsultingProspectById(
  prospectId: string
): Promise<ConsultingProspectDetail | null> {
  const normalized = normalizeText(prospectId);
  if (!normalized) return null;

  const prospect = await prisma.consultingProspect.findUnique({
    where: { id: normalized },
    select: consultingProspectSelect,
  });

  if (!prospect) return null;

  return {
    id: prospect.id,
    businessLine: prospect.businessLine,
    country: prospect.country,
    companyName: prospect.companyName,
    contactName: prospect.contactName,
    contactRole: prospect.contactRole,
    linkedinUrl: prospect.linkedinUrl ?? "",
    email: prospect.email ?? "",
    emailStatus: prospect.emailStatus,
    source: prospect.source ?? "",
    contactStatus: prospect.contactStatus,
    pipelineStage: prospect.pipelineStage,
    nextAction: prospect.nextAction ?? "",
    nextActionAt: toDateInput(prospect.nextActionAt),
    notes: prospect.notes ?? "",
    createdAt: prospect.createdAt.toISOString(),
    updatedAt: prospect.updatedAt.toISOString(),
    automaticDates: {
      linkedinInviteSentAt: toIso(prospect.linkedinInviteSentAt),
      linkedinAcceptedAt: toIso(prospect.linkedinAcceptedAt),
      linkedinMessageSentAt: toIso(prospect.linkedinMessageSentAt),
      emailSentAt: toIso(prospect.emailSentAt),
      respondedAt: toIso(prospect.respondedAt),
      meetingScheduledAt: toIso(prospect.meetingScheduledAt),
      meetingDoneAt: toIso(prospect.meetingDoneAt),
      followUp1SentAt: toIso(prospect.followUp1SentAt),
      followUp2SentAt: toIso(prospect.followUp2SentAt),
    },
    suggestedAction: suggestConsultingNextAction(prospect),
  };
}

function buildCreateData(
  input: ConsultingProspectMutationInput,
  actorUserId: string
): Prisma.ConsultingProspectCreateInput {
  const businessLine = normalizeBusinessLine(input.businessLine);
  const country = normalizeCountry(input.country);
  const companyName = normalizeRequiredText(input.companyName, "company_name");
  const contactName = normalizeRequiredText(input.contactName, "contact_name");
  const contactRole = normalizeRequiredText(input.contactRole, "contact_role");
  const contactStatus = normalizeContactStatus(
    input.contactStatus ?? ConsultingContactStatus.LINKEDIN_INVITE_SENT
  );
  const pipelineStage = normalizePipelineStage(
    input.pipelineStage ?? ConsultingPipelineStage.PROSPECTING
  );

  const automaticDates = pickAutomaticTimestampPatch(contactStatus, {
    linkedinInviteSentAt: null,
    linkedinAcceptedAt: null,
    linkedinMessageSentAt: null,
    emailSentAt: null,
    respondedAt: null,
    meetingScheduledAt: null,
    meetingDoneAt: null,
    followUp1SentAt: null,
    followUp2SentAt: null,
  });

  return {
    businessLine,
    country,
    companyName,
    contactName,
    contactRole,
    linkedinUrl: normalizeOptionalUrl(input.linkedinUrl),
    email: normalizeOptionalEmail(input.email),
    emailStatus: normalizeEmailStatus(input.emailStatus),
    source: normalizeText(input.source),
    contactStatus,
    pipelineStage,
    nextAction: normalizeText(input.nextAction),
    nextActionAt: parseNullableDate(input.nextActionAt),
    notes: normalizeText(input.notes),
    createdBy: {
      connect: { id: actorUserId },
    },
    updatedBy: {
      connect: { id: actorUserId },
    },
    ...automaticDates,
  };
}

function buildUpdateData(
  current: ConsultingProspectRecord,
  input: ConsultingProspectMutationInput,
  actorUserId: string
): Prisma.ConsultingProspectUpdateInput {
  const contactStatus = normalizeContactStatus(input.contactStatus ?? current.contactStatus);
  const automaticDates = pickAutomaticTimestampPatch(contactStatus, readProspectDates(current));

  return {
    businessLine: normalizeBusinessLine(input.businessLine),
    country: normalizeCountry(input.country),
    companyName: normalizeRequiredText(input.companyName, "company_name"),
    contactName: normalizeRequiredText(input.contactName, "contact_name"),
    contactRole: normalizeRequiredText(input.contactRole, "contact_role"),
    linkedinUrl: normalizeOptionalUrl(input.linkedinUrl),
    email: normalizeOptionalEmail(input.email),
    emailStatus: normalizeEmailStatus(input.emailStatus),
    source: normalizeText(input.source),
    contactStatus,
    pipelineStage: normalizePipelineStage(input.pipelineStage),
    nextAction: normalizeText(input.nextAction),
    nextActionAt: parseNullableDate(input.nextActionAt),
    notes: normalizeText(input.notes),
    updatedBy: {
      connect: { id: actorUserId },
    },
    ...automaticDates,
  };
}

export async function createConsultingProspect(
  input: ConsultingProspectMutationInput,
  actorUserId: string
) {
  const created = await prisma.consultingProspect.create({
    data: buildCreateData(input, actorUserId),
    select: { id: true },
  });

  return created;
}

export async function updateConsultingProspect(
  prospectId: string,
  input: ConsultingProspectMutationInput,
  actorUserId: string
) {
  const normalized = normalizeText(prospectId);
  if (!normalized) {
    throw new Error("prospect_not_found");
  }

  const current = await prisma.consultingProspect.findUnique({
    where: { id: normalized },
    select: consultingProspectSelect,
  });

  if (!current) {
    throw new Error("prospect_not_found");
  }

  const updated = await prisma.consultingProspect.update({
    where: { id: normalized },
    data: buildUpdateData(current, input, actorUserId),
    select: { id: true },
  });

  return updated;
}
