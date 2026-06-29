import "server-only";

import {
  ConsultingBusinessLine,
  ConsultingContactStatus,
  ConsultingEmailStatus,
  ConsultingPipelineStage,
  Prisma,
} from "@prisma/client";
import { normalizeSearchText } from "@/lib/backofficeList";
import { prisma } from "@/lib/prisma";

const MAX_IMPORT_TEXT_LENGTH = 2_000_000;

export const CONSULTING_IMPORT_MODES = [
  { value: "create_only", label: "Crear sólo nuevos" },
  { value: "create_and_update", label: "Crear nuevos y actualizar existentes" },
] as const;

export type ConsultingImportMode = (typeof CONSULTING_IMPORT_MODES)[number]["value"];

export type ConsultingImportRowStatus =
  | "new"
  | "would_update"
  | "possible_duplicate"
  | "error";

export type ConsultingImportPreviewColumn = {
  key: string;
  label: string;
  detectedHeader: string | null;
  required: boolean;
};

export type ConsultingImportPreviewRow = {
  rowNumber: number;
  status: ConsultingImportRowStatus;
  matchBasis: "linkedin" | "email" | "composite" | "secondary" | null;
  existingProspectId: string | null;
  companyName: string | null;
  contactName: string | null;
  country: string | null;
  businessLineLabel: string | null;
  contactStatusLabel: string | null;
  pipelineStageLabel: string | null;
  nextAction: string | null;
  warnings: string[];
  errors: string[];
};

export type ConsultingImportPreview = {
  delimiter: "," | ";" | "\t";
  totalRows: number;
  validRows: number;
  errorRows: number;
  possibleDuplicateRows: number;
  newRows: number;
  updateRows: number;
  warningsCount: number;
  previewRows: ConsultingImportPreviewRow[];
  columns: ConsultingImportPreviewColumn[];
};

export type ConsultingImportCommitError = {
  rowNumber: number;
  message: string;
};

export type ConsultingImportCommitResult = {
  created: number;
  updated: number;
  omitted: number;
  errors: ConsultingImportCommitError[];
};

type ConsultingImportColumnKey =
  | "businessLine"
  | "companyName"
  | "country"
  | "contactName"
  | "contactRole"
  | "linkedinUrl"
  | "email"
  | "emailValidation"
  | "contactStatus"
  | "messageSent"
  | "emailSent"
  | "firstMessageDate"
  | "state"
  | "nextActionPrimary"
  | "followUp1Date"
  | "meetingScheduled"
  | "meetingDone"
  | "proposalSent"
  | "pipelineStage"
  | "nextActionSecondary"
  | "commercialProposal"
  | "diagnosisApproved"
  | "diagnosisInProgress"
  | "diagnosisCompleted";

type ColumnDefinition = {
  key: ConsultingImportColumnKey;
  label: string;
  aliases: readonly string[];
  required: boolean;
};

type ConsultingImportParsedCsv = {
  delimiter: "," | ";" | "\t";
  headers: string[];
  rows: string[][];
};

type ExistingConsultingProspect = Prisma.ConsultingProspectGetPayload<{
  select: {
    id: true;
    businessLine: true;
    country: true;
    companyName: true;
    contactName: true;
    contactRole: true;
    linkedinUrl: true;
    email: true;
    emailStatus: true;
    source: true;
    contactStatus: true;
    pipelineStage: true;
    linkedinInviteSentAt: true;
    linkedinAcceptedAt: true;
    linkedinMessageSentAt: true;
    emailSentAt: true;
    respondedAt: true;
    meetingScheduledAt: true;
    meetingDoneAt: true;
    followUp1SentAt: true;
    followUp2SentAt: true;
    nextAction: true;
    nextActionAt: true;
    notes: true;
  };
}>;

type ConsultingPreparedImportData = {
  businessLine: ConsultingBusinessLine;
  country: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  linkedinUrl: string | null;
  email: string | null;
  emailStatus: ConsultingEmailStatus;
  source: string | null;
  contactStatus: ConsultingContactStatus;
  pipelineStage: ConsultingPipelineStage;
  linkedinInviteSentAt: Date | null;
  linkedinAcceptedAt: Date | null;
  linkedinMessageSentAt: Date | null;
  emailSentAt: Date | null;
  respondedAt: Date | null;
  meetingScheduledAt: Date | null;
  meetingDoneAt: Date | null;
  followUp1SentAt: Date | null;
  followUp2SentAt: Date | null;
  nextAction: string | null;
  nextActionAt: Date | null;
  notes: string | null;
  provided: {
    linkedinUrl: boolean;
    email: boolean;
    emailStatus: boolean;
    source: boolean;
    contactStatus: boolean;
    pipelineStage: boolean;
    linkedinInviteSentAt: boolean;
    linkedinAcceptedAt: boolean;
    linkedinMessageSentAt: boolean;
    emailSentAt: boolean;
    respondedAt: boolean;
    meetingScheduledAt: boolean;
    meetingDoneAt: boolean;
    followUp1SentAt: boolean;
    followUp2SentAt: boolean;
    nextAction: boolean;
    nextActionAt: boolean;
    notes: boolean;
  };
};

type InternalImportRow = {
  rowNumber: number;
  status: ConsultingImportRowStatus;
  matchBasis: "linkedin" | "email" | "composite" | "secondary" | null;
  existingProspectId: string | null;
  companyName: string | null;
  contactName: string | null;
  country: string | null;
  businessLineLabel: string | null;
  contactStatusLabel: string | null;
  pipelineStageLabel: string | null;
  nextAction: string | null;
  warnings: string[];
  errors: string[];
  duplicateKey: string | null;
  prepared: ConsultingPreparedImportData | null;
};

type InternalImportAnalysis = {
  preview: ConsultingImportPreview;
  rows: InternalImportRow[];
};

const COLUMN_DEFINITIONS: readonly ColumnDefinition[] = [
  {
    key: "businessLine",
    label: "Línea comercial",
    aliases: ["consiltoria", "consultoria", "consultoria linea comercial", "consultoría"],
    required: true,
  },
  {
    key: "companyName",
    label: "Empresa",
    aliases: ["empresa", "compania", "compañia", "company"],
    required: true,
  },
  {
    key: "country",
    label: "País",
    aliases: ["pais", "país", "country"],
    required: true,
  },
  {
    key: "contactName",
    label: "Nombre",
    aliases: ["nombre", "contacto", "nombre contacto"],
    required: true,
  },
  {
    key: "contactRole",
    label: "Cargo",
    aliases: ["cargo", "rol", "puesto"],
    required: true,
  },
  {
    key: "linkedinUrl",
    label: "LinkedIn",
    aliases: ["linkedin", "linkedin url", "perfil linkedin", "linked in"],
    required: false,
  },
  {
    key: "email",
    label: "Email",
    aliases: ["mail", "email", "correo", "correo electronico", "correo electrónico"],
    required: false,
  },
  {
    key: "emailValidation",
    label: "Validación mail",
    aliases: ["validacion mail", "validación mail", "validacion email", "validación email"],
    required: false,
  },
  {
    key: "contactStatus",
    label: "Estado contacto",
    aliases: ["estado contacto", "estado del contacto"],
    required: false,
  },
  {
    key: "messageSent",
    label: "Mensaje enviado",
    aliases: ["mensaje enviado", "linkedin mensaje enviado"],
    required: false,
  },
  {
    key: "emailSent",
    label: "Mail enviado",
    aliases: ["mail enviado", "email enviado"],
    required: false,
  },
  {
    key: "firstMessageDate",
    label: "Fecha primer mensaje",
    aliases: ["fecha primer mensaje", "primer mensaje", "fecha primer contacto"],
    required: false,
  },
  {
    key: "followUp1Date",
    label: "Fecha follow-up 1",
    aliases: ["fecha follow up 1", "fecha follow-up 1", "follow up 1", "follow-up 1"],
    required: false,
  },
  {
    key: "state",
    label: "Estado original",
    aliases: ["estado"],
    required: false,
  },
  {
    key: "nextActionPrimary",
    label: "Próxima acción",
    aliases: ["proxima accion", "próxima acción"],
    required: false,
  },
  {
    key: "meetingScheduled",
    label: "Reunión agendada",
    aliases: ["reunion agendada", "reunión agendada"],
    required: false,
  },
  {
    key: "meetingDone",
    label: "Reunión realizada",
    aliases: ["reunion realizada", "reunión realizada"],
    required: false,
  },
  {
    key: "proposalSent",
    label: "Propuesta enviada",
    aliases: ["propuesta enviada"],
    required: false,
  },
  {
    key: "pipelineStage",
    label: "Etapa pipeline",
    aliases: ["etapa pipeline", "pipeline", "pipeline stage"],
    required: false,
  },
  {
    key: "nextActionSecondary",
    label: "Siguiente acción",
    aliases: ["siguiente accion", "siguiente acción"],
    required: false,
  },
  {
    key: "commercialProposal",
    label: "Propuesta comercial",
    aliases: ["propuesta comercial"],
    required: false,
  },
  {
    key: "diagnosisApproved",
    label: "Diagnóstico aprobado",
    aliases: ["diagnostico aprovado", "diagnóstico aprobado", "diagnostico aprobado"],
    required: false,
  },
  {
    key: "diagnosisInProgress",
    label: "Diagnóstico en curso",
    aliases: ["diagnostico en curso", "diagnóstico en curso"],
    required: false,
  },
  {
    key: "diagnosisCompleted",
    label: "Diagnóstico terminado",
    aliases: ["diagnostico terminado", "diagnóstico terminado"],
    required: false,
  },
] as const;

const TRUTHY_VALUES = new Set([
  "1",
  "true",
  "si",
  "sí",
  "yes",
  "y",
  "ok",
  "x",
  "done",
  "hecho",
  "aprobado",
  "aprovado",
]);

const FALSEY_VALUES = new Set(["0", "false", "no", "n", "pendiente", ""]);

function normalizeText(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : null;
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : null;
}

function normalizeUrl(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return normalized ?? null;
}

function normalizeHeader(value: string) {
  return normalizeSearchText(value).replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

function normalizeLookupUrl(value: string | null | undefined) {
  const normalized = normalizeSearchText(value);
  if (!normalized) return null;
  return normalized
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function businessLineLabel(value: ConsultingBusinessLine) {
  return value === ConsultingBusinessLine.FLEXIBLE_FUNDING
    ? "Fondeo Flexible"
    : "Tesorería Operativa";
}

function contactStatusLabel(value: ConsultingContactStatus) {
  const labels: Record<ConsultingContactStatus, string> = {
    NEW: "Nuevo",
    LINKEDIN_INVITE_SENT: "Invitación LinkedIn enviada",
    LINKEDIN_ACCEPTED: "LinkedIn aceptado",
    LINKEDIN_MESSAGE_SENT: "Mensaje LinkedIn enviado",
    EMAIL_SENT: "Email enviado",
    RESPONDED: "Respondió",
    MEETING_SCHEDULED: "Reunión agendada",
    MEETING_DONE: "Reunión realizada",
    FOLLOW_UP_1_SENT: "Seguimiento 1 enviado",
    FOLLOW_UP_2_SENT: "Seguimiento 2 enviado",
    DORMANT: "Inactivo",
    DISCARDED: "Descartado",
  };

  return labels[value];
}

function pipelineStageLabel(value: ConsultingPipelineStage) {
  const labels: Record<ConsultingPipelineStage, string> = {
    PROSPECTING: "Prospección",
    CONTACTED: "Contactado",
    CONVERSATION_OPEN: "Conversación abierta",
    MEETING_SCHEDULED: "Reunión agendada",
    MEETING_DONE: "Reunión realizada",
    PROPOSAL_SENT: "Propuesta enviada",
    DIAGNOSIS_NEGOTIATION: "Diagnóstico en negociación",
    DIAGNOSIS_WON: "Diagnóstico ganado",
    LOST: "Perdido",
    PAUSED: "Pausado",
  };

  return labels[value];
}

function normalizeImportMode(value: string | null | undefined): ConsultingImportMode {
  return value === "create_and_update" ? "create_and_update" : "create_only";
}

function detectDelimiter(text: string): "," | ";" | "\t" {
  const candidates: Array<"," | ";" | "\t"> = [",", ";", "\t"];
  const scores = new Map<(typeof candidates)[number], number>(
    candidates.map((candidate) => [candidate, 0] as const)
  );

  let inQuotes = false;
  let line = "";

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === "\"") {
      if (inQuotes && text[index + 1] === "\"") {
        line += "\"";
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (line.trim()) {
        candidates.forEach((candidate) => {
          const count = line.split(candidate).length - 1;
          scores.set(candidate, (scores.get(candidate) ?? 0) + count);
        });
      }

      line = "";
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      continue;
    }

    line += char;
  }

  if (line.trim()) {
    candidates.forEach((candidate) => {
      const count = line.split(candidate).length - 1;
      scores.set(candidate, (scores.get(candidate) ?? 0) + count);
    });
  }

  return candidates.reduce((best, candidate) =>
    (scores.get(candidate) ?? 0) > (scores.get(best) ?? 0) ? candidate : best
  );
}

function parseCsvText(csvText: string): ConsultingImportParsedCsv {
  const cleaned = csvText.replace(/^\uFEFF/, "");
  if (!cleaned.trim()) {
    throw new Error("csv_empty");
  }
  if (cleaned.length > MAX_IMPORT_TEXT_LENGTH) {
    throw new Error("csv_too_large");
  }

  const delimiter = detectDelimiter(cleaned);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (inQuotes) {
      if (char === "\"") {
        if (cleaned[index + 1] === "\"") {
          currentField += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
      continue;
    }

    if (char === delimiter) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (char === "\n" || char === "\r") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";

      if (char === "\r" && cleaned[index + 1] === "\n") {
        index += 1;
      }
      continue;
    }

    currentField += char;
  }

  currentRow.push(currentField);
  rows.push(currentRow);

  if (inQuotes) {
    throw new Error("csv_unclosed_quote");
  }

  const nonEmptyRows = rows.filter((row) => row.some((value) => normalizeText(value)));
  if (nonEmptyRows.length < 2) {
    throw new Error("csv_no_data");
  }

  const headers = nonEmptyRows[0].map((header) => String(header ?? "").trim());
  return {
    delimiter,
    headers,
    rows: nonEmptyRows.slice(1),
  };
}

function detectColumnMap(headers: string[]) {
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  const columnMap = new Map<ConsultingImportColumnKey, number>();

  COLUMN_DEFINITIONS.forEach((definition) => {
    const matchIndex = normalizedHeaders.findIndex((header) =>
      definition.aliases.some((alias) => normalizeHeader(alias) === header)
    );

    if (matchIndex >= 0) {
      columnMap.set(definition.key, matchIndex);
    }
  });

  return columnMap;
}

function readRowValue(
  row: string[],
  headers: string[],
  columnMap: Map<ConsultingImportColumnKey, number>,
  key: ConsultingImportColumnKey
) {
  const index = columnMap.get(key);
  if (index === undefined) return null;
  return normalizeText(row[index] ?? "") ?? null;
}

function parseLocalDateParts(year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0) {
  const value = new Date(year, month - 1, day, hours, minutes, seconds);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseFlexibleDate(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const isoDateTime = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (isoDateTime) {
    const [, year, month, day, hours = "0", minutes = "0", seconds = "0"] = isoDateTime;
    return parseLocalDateParts(
      Number(year),
      Number(month),
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds)
    );
  }

  const slashDate = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDate) {
    const [, day, month, year] = slashDate;
    return parseLocalDateParts(Number(year), Number(month), Number(day));
  }

  if (/^\d+(\.\d+)?$/.test(normalized)) {
    const numeric = Number(normalized);
    if (Number.isFinite(numeric) && numeric > 20_000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      epoch.setUTCDate(epoch.getUTCDate() + Math.floor(numeric));
      return new Date(epoch.getUTCFullYear(), epoch.getUTCMonth(), epoch.getUTCDate());
    }
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime())
    ? null
    : new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate(),
        parsed.getHours(),
        parsed.getMinutes(),
        parsed.getSeconds()
      );
}

function parseBooleanLike(value: string | null | undefined) {
  const normalized = normalizeHeader(String(value ?? ""));
  if (TRUTHY_VALUES.has(normalized)) return true;
  if (FALSEY_VALUES.has(normalized)) return false;
  return null;
}

function parseBooleanOrDate(value: string | null | undefined) {
  const date = parseFlexibleDate(value);
  if (date) {
    return { truthy: true, date };
  }

  const truthy = parseBooleanLike(value);
  return { truthy: truthy === true, date: null };
}

function mapBusinessLine(value: string | null) {
  const normalized = normalizeHeader(value ?? "");
  if (!normalized) return null;
  if (
    normalized.includes("fondeo flexible") ||
    normalized.includes("flexible funding") ||
    normalized === "fondeo"
  ) {
    return ConsultingBusinessLine.FLEXIBLE_FUNDING;
  }
  if (
    normalized.includes("tesoreria operativa") ||
    normalized.includes("tesorería operativa") ||
    normalized.includes("tesoreria")
  ) {
    return ConsultingBusinessLine.OPERATING_TREASURY;
  }
  return null;
}

function mapEmailStatus(value: string | null) {
  const normalized = normalizeHeader(value ?? "");
  if (!normalized) return null;
  if (
    ["valido", "válido", "valid", "ok", "verificado", "correcto", "si", "sí", "true"].some(
      (candidate) => normalizeHeader(candidate) === normalized
    )
  ) {
    return ConsultingEmailStatus.VALID;
  }
  if (
    ["invalido", "inválido", "invalid", "rebota", "bounce", "incorrecto"].some(
      (candidate) => normalizeHeader(candidate) === normalized
    )
  ) {
    return ConsultingEmailStatus.INVALID;
  }
  if (
    ["no encontrado", "not found", "sin mail", "sin email"].some(
      (candidate) => normalizeHeader(candidate) === normalized
    )
  ) {
    return ConsultingEmailStatus.NOT_FOUND;
  }
  if (["desconocido", "unknown"].some((candidate) => normalizeHeader(candidate) === normalized)) {
    return ConsultingEmailStatus.UNKNOWN;
  }
  return null;
}

function mapContactStatus(value: string | null) {
  const normalized = normalizeHeader(value ?? "");
  if (!normalized) return null;

  const mapping: Array<[string[], ConsultingContactStatus]> = [
    [["nuevo"], ConsultingContactStatus.NEW],
    [["invitacion linkedin enviada", "invitacion enviada"], ConsultingContactStatus.LINKEDIN_INVITE_SENT],
    [["linkedin aceptado", "invitacion aceptada"], ConsultingContactStatus.LINKEDIN_ACCEPTED],
    [["mensaje linkedin enviado", "mensaje enviado"], ConsultingContactStatus.LINKEDIN_MESSAGE_SENT],
    [["mail enviado", "email enviado"], ConsultingContactStatus.EMAIL_SENT],
    [["respondio", "respuesta", "respondió"], ConsultingContactStatus.RESPONDED],
    [["reunion agendada", "reunión agendada"], ConsultingContactStatus.MEETING_SCHEDULED],
    [["reunion realizada", "reunión realizada"], ConsultingContactStatus.MEETING_DONE],
    [["follow up 1 enviado", "follow-up 1 enviado"], ConsultingContactStatus.FOLLOW_UP_1_SENT],
    [["follow up 2 enviado", "follow-up 2 enviado"], ConsultingContactStatus.FOLLOW_UP_2_SENT],
    [["inactivo", "dormant"], ConsultingContactStatus.DORMANT],
    [["descartado", "perdido"], ConsultingContactStatus.DISCARDED],
  ];

  for (const [aliases, mapped] of mapping) {
    if (aliases.some((alias) => normalizeHeader(alias) === normalized)) {
      return mapped;
    }
  }

  return null;
}

function mapPipelineStage(value: string | null) {
  const normalized = normalizeHeader(value ?? "");
  if (!normalized) return null;

  const mapping: Array<[string[], ConsultingPipelineStage]> = [
    [["prospeccion", "prospecting"], ConsultingPipelineStage.PROSPECTING],
    [["contactado", "contacted"], ConsultingPipelineStage.CONTACTED],
    [["05 conversacion abierta", "conversacion abierta"], ConsultingPipelineStage.CONVERSATION_OPEN],
    [["reunion agendada", "reunión agendada"], ConsultingPipelineStage.MEETING_SCHEDULED],
    [["reunion realizada", "reunión realizada"], ConsultingPipelineStage.MEETING_DONE],
    [["09 presentacion formal pendiente", "presentacion formal pendiente"], ConsultingPipelineStage.MEETING_DONE],
    [["propuesta enviada"], ConsultingPipelineStage.PROPOSAL_SENT],
    [["diagnostico en negociacion", "diagnostico en curso", "diagnóstico en curso"], ConsultingPipelineStage.DIAGNOSIS_NEGOTIATION],
    [["diagnostico contratado", "diagnostico aprobado", "diagnostico aprovado"], ConsultingPipelineStage.DIAGNOSIS_WON],
    [["14 pausado futuro", "pausado futuro", "pausado"], ConsultingPipelineStage.PAUSED],
    [["perdido", "lost"], ConsultingPipelineStage.LOST],
  ];

  for (const [aliases, mapped] of mapping) {
    if (aliases.some((alias) => normalizeHeader(alias) === normalized)) {
      return mapped;
    }
  }

  return null;
}

function composeNotesBlock(lines: Array<string | null | undefined>) {
  const normalizedLines = lines.map((line) => normalizeText(line)).filter(Boolean) as string[];
  return normalizedLines.length ? normalizedLines.join("\n") : null;
}

function appendImportNotes(existingNotes: string | null, importNotes: string | null) {
  const current = normalizeText(existingNotes);
  const next = normalizeText(importNotes);

  if (!current) return next;
  if (!next) return current;
  if (current.includes(next)) return current;
  return `${current}\n\n${next}`;
}

function compositeDuplicateKey(companyName: string, contactName: string, country: string) {
  return [
    normalizeSearchText(companyName),
    normalizeSearchText(contactName),
    normalizeSearchText(country),
  ].join("::");
}

function buildImportNotes(args: {
  originalState: string | null;
  originalPipelineStage: string | null;
  originalSecondaryAction: string | null;
  originalEmailValidation: string | null;
  originalCommercialProposal: string | null;
  unknownContactStatus: string | null;
  unknownPipelineStage: string | null;
}) {
  return composeNotesBlock([
    "Importado desde Google Sheet Consulting.",
    args.originalState ? `Estado original: ${args.originalState}` : null,
    args.originalPipelineStage ? `Etapa original: ${args.originalPipelineStage}` : null,
    args.originalSecondaryAction ? `Siguiente acción original: ${args.originalSecondaryAction}` : null,
    args.originalEmailValidation ? `Validación mail original: ${args.originalEmailValidation}` : null,
    args.originalCommercialProposal
      ? `Propuesta comercial original: ${args.originalCommercialProposal}`
      : null,
    args.unknownContactStatus
      ? `Estado contacto no mapeado automáticamente: ${args.unknownContactStatus}`
      : null,
    args.unknownPipelineStage
      ? `Etapa pipeline no mapeada automáticamente: ${args.unknownPipelineStage}`
      : null,
  ]);
}

function buildPreviewColumns(headers: string[], columnMap: Map<ConsultingImportColumnKey, number>) {
  return COLUMN_DEFINITIONS.map<ConsultingImportPreviewColumn>((definition) => ({
    key: definition.key,
    label: definition.label,
    detectedHeader:
      columnMap.get(definition.key) !== undefined
        ? headers[columnMap.get(definition.key) as number] ?? null
        : null,
    required: definition.required,
  }));
}

function pushUniqueWarning(list: string[], warning: string) {
  if (!list.includes(warning)) {
    list.push(warning);
  }
}

function deriveContactStatus(args: {
  explicitStatus: ConsultingContactStatus | null;
  messageSent: boolean;
  emailSent: boolean;
  firstMessageDate: Date | null;
  followUp1Date: Date | null;
  meetingScheduled: { truthy: boolean; date: Date | null };
  meetingDone: { truthy: boolean; date: Date | null };
  proposalSent: { truthy: boolean; date: Date | null };
}) {
  if (args.explicitStatus) {
    return { value: args.explicitStatus, provided: true };
  }
  if (args.meetingDone.truthy) {
    return { value: ConsultingContactStatus.MEETING_DONE, provided: true };
  }
  if (args.meetingScheduled.truthy) {
    return { value: ConsultingContactStatus.MEETING_SCHEDULED, provided: true };
  }
  if (args.followUp1Date) {
    return { value: ConsultingContactStatus.FOLLOW_UP_1_SENT, provided: true };
  }
  if (args.proposalSent.truthy) {
    return { value: ConsultingContactStatus.RESPONDED, provided: true };
  }
  if (args.emailSent) {
    return { value: ConsultingContactStatus.EMAIL_SENT, provided: true };
  }
  if (args.messageSent || args.firstMessageDate) {
    return { value: ConsultingContactStatus.LINKEDIN_MESSAGE_SENT, provided: true };
  }
  return { value: ConsultingContactStatus.NEW, provided: false };
}

function derivePipelineStage(args: {
  explicitStage: ConsultingPipelineStage | null;
  meetingScheduled: { truthy: boolean; date: Date | null };
  meetingDone: { truthy: boolean; date: Date | null };
  proposalSent: { truthy: boolean; date: Date | null };
  diagnosisApproved: { truthy: boolean; date: Date | null };
  diagnosisInProgress: { truthy: boolean; date: Date | null };
  diagnosisCompleted: { truthy: boolean; date: Date | null };
  contactStatus: ConsultingContactStatus;
}) {
  if (args.explicitStage) {
    return { value: args.explicitStage, provided: true };
  }
  if (args.diagnosisApproved.truthy) {
    return { value: ConsultingPipelineStage.DIAGNOSIS_WON, provided: true };
  }
  if (args.diagnosisInProgress.truthy || args.diagnosisCompleted.truthy) {
    return { value: ConsultingPipelineStage.DIAGNOSIS_NEGOTIATION, provided: true };
  }
  if (args.proposalSent.truthy) {
    return { value: ConsultingPipelineStage.PROPOSAL_SENT, provided: true };
  }
  if (args.meetingDone.truthy) {
    return { value: ConsultingPipelineStage.MEETING_DONE, provided: true };
  }
  if (args.meetingScheduled.truthy) {
    return { value: ConsultingPipelineStage.MEETING_SCHEDULED, provided: true };
  }
  if (args.contactStatus === ConsultingContactStatus.RESPONDED) {
    return { value: ConsultingPipelineStage.CONVERSATION_OPEN, provided: true };
  }
  if (args.contactStatus !== ConsultingContactStatus.NEW) {
    return { value: ConsultingPipelineStage.CONTACTED, provided: true };
  }
  return { value: ConsultingPipelineStage.PROSPECTING, provided: false };
}

function buildPreparedRow(
  row: string[],
  rowNumber: number,
  headers: string[],
  columnMap: Map<ConsultingImportColumnKey, number>
) {
  const warnings: string[] = [];
  const errors: string[] = [];

  const businessLineRaw = readRowValue(row, headers, columnMap, "businessLine");
  const companyName = normalizeText(readRowValue(row, headers, columnMap, "companyName"));
  const country = normalizeText(readRowValue(row, headers, columnMap, "country"));
  const contactName = normalizeText(readRowValue(row, headers, columnMap, "contactName"));
  const contactRole = normalizeText(readRowValue(row, headers, columnMap, "contactRole"));
  const linkedinUrl = normalizeUrl(readRowValue(row, headers, columnMap, "linkedinUrl"));
  const email = normalizeEmail(readRowValue(row, headers, columnMap, "email"));
  const emailValidationRaw = readRowValue(row, headers, columnMap, "emailValidation");
  const contactStatusRaw = readRowValue(row, headers, columnMap, "contactStatus");
  const messageSentRaw = readRowValue(row, headers, columnMap, "messageSent");
  const emailSentRaw = readRowValue(row, headers, columnMap, "emailSent");
  const firstMessageDateRaw = readRowValue(row, headers, columnMap, "firstMessageDate");
  const followUp1DateRaw = readRowValue(row, headers, columnMap, "followUp1Date");
  const stateRaw = readRowValue(row, headers, columnMap, "state");
  const nextActionPrimary = readRowValue(row, headers, columnMap, "nextActionPrimary");
  const nextActionSecondary = readRowValue(row, headers, columnMap, "nextActionSecondary");
  const meetingScheduledRaw = readRowValue(row, headers, columnMap, "meetingScheduled");
  const meetingDoneRaw = readRowValue(row, headers, columnMap, "meetingDone");
  const proposalSentRaw = readRowValue(row, headers, columnMap, "proposalSent");
  const pipelineStageRaw = readRowValue(row, headers, columnMap, "pipelineStage");
  const commercialProposalRaw = readRowValue(row, headers, columnMap, "commercialProposal");
  const diagnosisApprovedRaw = readRowValue(row, headers, columnMap, "diagnosisApproved");
  const diagnosisInProgressRaw = readRowValue(row, headers, columnMap, "diagnosisInProgress");
  const diagnosisCompletedRaw = readRowValue(row, headers, columnMap, "diagnosisCompleted");

  const businessLine = mapBusinessLine(businessLineRaw);
  if (!businessLine) {
    errors.push("Línea comercial no reconocida.");
  }

  if (!companyName) {
    errors.push("Empresa es obligatoria.");
  }
  if (!country) {
    errors.push("País es obligatorio.");
  }
  if (!contactName) {
    errors.push("Nombre es obligatorio.");
  }
  if (!contactRole) {
    errors.push("Cargo es obligatorio.");
  }

  const emailStatusMapped = mapEmailStatus(emailValidationRaw);
  if (emailValidationRaw && !emailStatusMapped) {
    pushUniqueWarning(warnings, "Validación de email no reconocida; se conserva en notas.");
  }

  const explicitContactStatus = mapContactStatus(contactStatusRaw) ?? mapContactStatus(stateRaw);
  const unknownContactStatus =
    (contactStatusRaw && !mapContactStatus(contactStatusRaw) && contactStatusRaw) ||
    (stateRaw && !mapContactStatus(stateRaw) && stateRaw) ||
    null;
  if (unknownContactStatus) {
    pushUniqueWarning(warnings, "Estado de contacto no reconocido; se usa estado seguro.");
  }

  const explicitPipelineStage = mapPipelineStage(pipelineStageRaw);
  const unknownPipelineStage =
    pipelineStageRaw && !explicitPipelineStage ? pipelineStageRaw : null;
  if (unknownPipelineStage) {
    pushUniqueWarning(warnings, "Etapa pipeline no reconocida; se usa etapa segura.");
  }

  const firstMessageDate = parseFlexibleDate(firstMessageDateRaw);
  if (firstMessageDateRaw && !firstMessageDate) {
    pushUniqueWarning(warnings, "Fecha primer mensaje no pudo parsearse.");
  }

  const followUp1Date = parseFlexibleDate(followUp1DateRaw);
  if (followUp1DateRaw && !followUp1Date) {
    pushUniqueWarning(warnings, "Fecha follow-up 1 no pudo parsearse.");
  }

  const meetingScheduled = parseBooleanOrDate(meetingScheduledRaw);
  if (meetingScheduledRaw && !meetingScheduled.truthy && !meetingScheduled.date) {
    pushUniqueWarning(warnings, "Reunión agendada no pudo interpretarse.");
  }

  const meetingDone = parseBooleanOrDate(meetingDoneRaw);
  if (meetingDoneRaw && !meetingDone.truthy && !meetingDone.date) {
    pushUniqueWarning(warnings, "Reunión realizada no pudo interpretarse.");
  }

  const proposalSent = parseBooleanOrDate(proposalSentRaw);
  if (proposalSentRaw && !proposalSent.truthy && !proposalSent.date) {
    pushUniqueWarning(warnings, "Propuesta enviada no pudo interpretarse.");
  }

  const diagnosisApproved = parseBooleanOrDate(diagnosisApprovedRaw);
  const diagnosisInProgress = parseBooleanOrDate(diagnosisInProgressRaw);
  const diagnosisCompleted = parseBooleanOrDate(diagnosisCompletedRaw);

  const messageSent = parseBooleanLike(messageSentRaw) === true;
  const emailSent = parseBooleanLike(emailSentRaw) === true;

  const derivedContactStatus = deriveContactStatus({
    explicitStatus: explicitContactStatus,
    messageSent,
    emailSent,
    firstMessageDate,
    followUp1Date,
    meetingScheduled,
    meetingDone,
    proposalSent,
  });

  const derivedPipelineStage = derivePipelineStage({
    explicitStage: explicitPipelineStage,
    meetingScheduled,
    meetingDone,
    proposalSent,
    diagnosisApproved,
    diagnosisInProgress,
    diagnosisCompleted,
    contactStatus: derivedContactStatus.value,
  });

  const nextAction = nextActionPrimary ?? nextActionSecondary ?? null;
  if (nextActionPrimary && nextActionSecondary && nextActionPrimary !== nextActionSecondary) {
    pushUniqueWarning(warnings, "Se priorizó Próxima acción; Siguiente acción queda en notas.");
  }

  const notes = buildImportNotes({
    originalState: stateRaw,
    originalPipelineStage: pipelineStageRaw,
    originalSecondaryAction:
      nextActionPrimary && nextActionSecondary && nextActionPrimary !== nextActionSecondary
        ? nextActionSecondary
        : null,
    originalEmailValidation: emailValidationRaw,
    originalCommercialProposal: commercialProposalRaw,
    unknownContactStatus,
    unknownPipelineStage,
  });

  const prepared =
    businessLine && companyName && country && contactName && contactRole
      ? ({
          businessLine,
          country,
          companyName,
          contactName,
          contactRole,
          linkedinUrl,
          email,
          emailStatus: emailStatusMapped ?? ConsultingEmailStatus.UNKNOWN,
          source: null,
          contactStatus: derivedContactStatus.value,
          pipelineStage: derivedPipelineStage.value,
          linkedinInviteSentAt: null,
          linkedinAcceptedAt: null,
          linkedinMessageSentAt: firstMessageDate,
          emailSentAt: emailSent ? firstMessageDate : null,
          respondedAt:
            derivedContactStatus.value === ConsultingContactStatus.RESPONDED ? firstMessageDate : null,
          meetingScheduledAt: meetingScheduled.date,
          meetingDoneAt: meetingDone.date,
          followUp1SentAt: followUp1Date,
          followUp2SentAt: null,
          nextAction,
          nextActionAt: null,
          notes,
          provided: {
            linkedinUrl: Boolean(linkedinUrl),
            email: Boolean(email),
            emailStatus: Boolean(emailStatusMapped),
            source: false,
            contactStatus: derivedContactStatus.provided,
            pipelineStage: derivedPipelineStage.provided,
            linkedinInviteSentAt: false,
            linkedinAcceptedAt: false,
            linkedinMessageSentAt: Boolean(firstMessageDate),
            emailSentAt: emailSent && Boolean(firstMessageDate),
            respondedAt:
              derivedContactStatus.value === ConsultingContactStatus.RESPONDED &&
              Boolean(firstMessageDate),
            meetingScheduledAt: Boolean(meetingScheduled.date),
            meetingDoneAt: Boolean(meetingDone.date),
            followUp1SentAt: Boolean(followUp1Date),
            followUp2SentAt: false,
            nextAction: Boolean(nextAction),
            nextActionAt: false,
            notes: Boolean(notes),
          },
        } satisfies ConsultingPreparedImportData)
      : null;

  return {
    rowNumber,
    warnings,
    errors,
    prepared,
  };
}

function selectExistingProspectForImport() {
  return prisma.consultingProspect.findMany({
    select: {
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
    },
  });
}

function indexExistingProspects(prospects: ExistingConsultingProspect[]) {
  const linkedin = new Map<string, ExistingConsultingProspect[]>();
  const email = new Map<string, ExistingConsultingProspect[]>();
  const composite = new Map<string, ExistingConsultingProspect[]>();

  function push(map: Map<string, ExistingConsultingProspect[]>, key: string | null, prospect: ExistingConsultingProspect) {
    if (!key) return;
    const current = map.get(key) ?? [];
    current.push(prospect);
    map.set(key, current);
  }

  prospects.forEach((prospect) => {
    push(linkedin, normalizeLookupUrl(prospect.linkedinUrl), prospect);
    push(email, normalizeEmail(prospect.email), prospect);
    push(
      composite,
      compositeDuplicateKey(prospect.companyName, prospect.contactName, prospect.country),
      prospect
    );
  });

  return { linkedin, email, composite };
}

function findExistingMatches(
  prepared: ConsultingPreparedImportData,
  indexes: ReturnType<typeof indexExistingProspects>
) {
  const linkedinKey = normalizeLookupUrl(prepared.linkedinUrl);
  const emailKey = normalizeEmail(prepared.email);
  const compositeKey = compositeDuplicateKey(
    prepared.companyName,
    prepared.contactName,
    prepared.country
  );

  const linkedinMatches = linkedinKey ? indexes.linkedin.get(linkedinKey) ?? [] : [];
  const emailMatches = emailKey ? indexes.email.get(emailKey) ?? [] : [];
  const compositeMatches = indexes.composite.get(compositeKey) ?? [];

  const primary =
    linkedinKey !== null
      ? { basis: "linkedin" as const, matches: linkedinMatches, key: `linkedin:${linkedinKey}` }
      : emailKey !== null
        ? { basis: "email" as const, matches: emailMatches, key: `email:${emailKey}` }
        : { basis: "composite" as const, matches: compositeMatches, key: `composite:${compositeKey}` };

  const secondaryMatchesById = new Map<string, ExistingConsultingProspect>();
  const pushSecondary = (items: ExistingConsultingProspect[]) => {
    items.forEach((item) => secondaryMatchesById.set(item.id, item));
  };

  if (primary.basis !== "linkedin") pushSecondary(linkedinMatches);
  if (primary.basis !== "email") pushSecondary(emailMatches);
  if (primary.basis !== "composite") pushSecondary(compositeMatches);

  return {
    primaryBasis: primary.basis,
    primaryKey: primary.key,
    primaryMatches: primary.matches,
    secondaryMatches: Array.from(secondaryMatchesById.values()),
  };
}

function mergeCreatedNotes(notes: string | null) {
  return normalizeText(notes);
}

function buildCreateInput(prepared: ConsultingPreparedImportData, actorUserId: string) {
  return {
    businessLine: prepared.businessLine,
    country: prepared.country,
    companyName: prepared.companyName,
    contactName: prepared.contactName,
    contactRole: prepared.contactRole,
    linkedinUrl: prepared.linkedinUrl,
    email: prepared.email,
    emailStatus: prepared.emailStatus,
    source: prepared.source,
    contactStatus: prepared.contactStatus,
    pipelineStage: prepared.pipelineStage,
    linkedinInviteSentAt: prepared.linkedinInviteSentAt,
    linkedinAcceptedAt: prepared.linkedinAcceptedAt,
    linkedinMessageSentAt: prepared.linkedinMessageSentAt,
    emailSentAt: prepared.emailSentAt,
    respondedAt: prepared.respondedAt,
    meetingScheduledAt: prepared.meetingScheduledAt,
    meetingDoneAt: prepared.meetingDoneAt,
    followUp1SentAt: prepared.followUp1SentAt,
    followUp2SentAt: prepared.followUp2SentAt,
    nextAction: prepared.nextAction,
    nextActionAt: prepared.nextActionAt,
    notes: mergeCreatedNotes(prepared.notes),
    createdBy: { connect: { id: actorUserId } },
    updatedBy: { connect: { id: actorUserId } },
  } satisfies Prisma.ConsultingProspectCreateInput;
}

function chooseUpdatedValue<T>(provided: boolean, imported: T, current: T) {
  return provided ? imported : current;
}

function chooseUpdatedDate(imported: Date | null, current: Date | null) {
  return imported ?? current;
}

function buildUpdateInput(
  current: ExistingConsultingProspect,
  prepared: ConsultingPreparedImportData,
  actorUserId: string
) {
  return {
    businessLine: prepared.businessLine,
    country: prepared.country,
    companyName: prepared.companyName,
    contactName: prepared.contactName,
    contactRole: prepared.contactRole,
    linkedinUrl: chooseUpdatedValue(
      prepared.provided.linkedinUrl,
      prepared.linkedinUrl,
      current.linkedinUrl
    ),
    email: chooseUpdatedValue(prepared.provided.email, prepared.email, current.email),
    emailStatus: chooseUpdatedValue(
      prepared.provided.emailStatus,
      prepared.emailStatus,
      current.emailStatus
    ),
    source: chooseUpdatedValue(prepared.provided.source, prepared.source, current.source),
    contactStatus: chooseUpdatedValue(
      prepared.provided.contactStatus,
      prepared.contactStatus,
      current.contactStatus
    ),
    pipelineStage: chooseUpdatedValue(
      prepared.provided.pipelineStage,
      prepared.pipelineStage,
      current.pipelineStage
    ),
    linkedinInviteSentAt: chooseUpdatedDate(prepared.linkedinInviteSentAt, current.linkedinInviteSentAt),
    linkedinAcceptedAt: chooseUpdatedDate(prepared.linkedinAcceptedAt, current.linkedinAcceptedAt),
    linkedinMessageSentAt: chooseUpdatedDate(
      prepared.linkedinMessageSentAt,
      current.linkedinMessageSentAt
    ),
    emailSentAt: chooseUpdatedDate(prepared.emailSentAt, current.emailSentAt),
    respondedAt: chooseUpdatedDate(prepared.respondedAt, current.respondedAt),
    meetingScheduledAt: chooseUpdatedDate(prepared.meetingScheduledAt, current.meetingScheduledAt),
    meetingDoneAt: chooseUpdatedDate(prepared.meetingDoneAt, current.meetingDoneAt),
    followUp1SentAt: chooseUpdatedDate(prepared.followUp1SentAt, current.followUp1SentAt),
    followUp2SentAt: chooseUpdatedDate(prepared.followUp2SentAt, current.followUp2SentAt),
    nextAction: chooseUpdatedValue(prepared.provided.nextAction, prepared.nextAction, current.nextAction),
    nextActionAt: chooseUpdatedValue(
      prepared.provided.nextActionAt,
      prepared.nextActionAt,
      current.nextActionAt
    ),
    notes: appendImportNotes(current.notes, prepared.notes),
    updatedBy: { connect: { id: actorUserId } },
  } satisfies Prisma.ConsultingProspectUpdateInput;
}

async function buildImportAnalysis(csvText: string): Promise<InternalImportAnalysis> {
  const parsed = parseCsvText(csvText);
  const columnMap = detectColumnMap(parsed.headers);
  const columns = buildPreviewColumns(parsed.headers, columnMap);
  const existingProspects = await selectExistingProspectForImport();
  const indexes = indexExistingProspects(existingProspects);

  const rows = parsed.rows.map((row, index) => {
    const preparedBase = buildPreparedRow(row, index + 2, parsed.headers, columnMap);

    if (!preparedBase.prepared) {
      return {
        rowNumber: preparedBase.rowNumber,
        status: "error" as const,
        matchBasis: null,
        existingProspectId: null,
        companyName: normalizeText(readRowValue(row, parsed.headers, columnMap, "companyName")),
        contactName: normalizeText(readRowValue(row, parsed.headers, columnMap, "contactName")),
        country: normalizeText(readRowValue(row, parsed.headers, columnMap, "country")),
        businessLineLabel: null,
        contactStatusLabel: null,
        pipelineStageLabel: null,
        nextAction:
          readRowValue(row, parsed.headers, columnMap, "nextActionPrimary") ??
          readRowValue(row, parsed.headers, columnMap, "nextActionSecondary"),
        warnings: preparedBase.warnings,
        errors: preparedBase.errors,
        duplicateKey: null,
        prepared: null,
      } satisfies InternalImportRow;
    }

    const matches = findExistingMatches(preparedBase.prepared, indexes);
    const primaryIds = new Set(matches.primaryMatches.map((item) => item.id));
    const secondaryIds = new Set(matches.secondaryMatches.map((item) => item.id));
    const combinedIds = new Set([...primaryIds, ...secondaryIds]);

    let status: ConsultingImportRowStatus = "new";
    let matchBasis: InternalImportRow["matchBasis"] = null;
    let existingProspectId: string | null = null;
    const errors = [...preparedBase.errors];
    const warnings = [...preparedBase.warnings];

    if (matches.primaryMatches.length > 1) {
      status = "possible_duplicate";
      matchBasis = matches.primaryBasis;
      pushUniqueWarning(warnings, "La fila coincide con más de un prospecto existente.");
    } else if (matches.primaryMatches.length === 1) {
      const primaryMatch = matches.primaryMatches[0];
      const conflictingSecondaryIds = Array.from(secondaryIds).filter((id) => id !== primaryMatch.id);

      if (conflictingSecondaryIds.length) {
        status = "possible_duplicate";
        matchBasis = "secondary";
        existingProspectId = primaryMatch.id;
        pushUniqueWarning(
          warnings,
          "La fila presenta coincidencias conflictivas entre LinkedIn, email o combinación base."
        );
      } else {
        status = "would_update";
        matchBasis = matches.primaryBasis;
        existingProspectId = primaryMatch.id;
      }
    } else if (combinedIds.size) {
      status = "possible_duplicate";
      matchBasis = "secondary";
      existingProspectId = Array.from(combinedIds)[0] ?? null;
      pushUniqueWarning(
        warnings,
        "La fila no coincide por identificador principal, pero sí por un identificador secundario."
      );
    }

    return {
      rowNumber: preparedBase.rowNumber,
      status,
      matchBasis,
      existingProspectId,
      companyName: preparedBase.prepared.companyName,
      contactName: preparedBase.prepared.contactName,
      country: preparedBase.prepared.country,
      businessLineLabel: businessLineLabel(preparedBase.prepared.businessLine),
      contactStatusLabel: contactStatusLabel(preparedBase.prepared.contactStatus),
      pipelineStageLabel: pipelineStageLabel(preparedBase.prepared.pipelineStage),
      nextAction: preparedBase.prepared.nextAction,
      warnings,
      errors,
      duplicateKey: matches.primaryKey,
      prepared: preparedBase.prepared,
    } satisfies InternalImportRow;
  });

  const keyCounts = new Map<string, number>();
  rows.forEach((row) => {
    if (row.duplicateKey) {
      keyCounts.set(row.duplicateKey, (keyCounts.get(row.duplicateKey) ?? 0) + 1);
    }
  });

  rows.forEach((row) => {
    if (!row.duplicateKey) return;
    if ((keyCounts.get(row.duplicateKey) ?? 0) > 1) {
      row.status = "possible_duplicate";
      row.matchBasis = row.matchBasis ?? "secondary";
      pushUniqueWarning(row.warnings, "La misma fila aparece repetida dentro del CSV.");
    }
  });

  const preview: ConsultingImportPreview = {
    delimiter: parsed.delimiter,
    totalRows: rows.length,
    validRows: rows.filter((row) => row.status !== "error").length,
    errorRows: rows.filter((row) => row.status === "error").length,
    possibleDuplicateRows: rows.filter((row) => row.status === "possible_duplicate").length,
    newRows: rows.filter((row) => row.status === "new").length,
    updateRows: rows.filter((row) => row.status === "would_update").length,
    warningsCount: rows.reduce((total, row) => total + row.warnings.length, 0),
    previewRows: rows.slice(0, 20).map((row) => ({
      rowNumber: row.rowNumber,
      status: row.status,
      matchBasis: row.matchBasis,
      existingProspectId: row.existingProspectId,
      companyName: row.companyName,
      contactName: row.contactName,
      country: row.country,
      businessLineLabel: row.businessLineLabel,
      contactStatusLabel: row.contactStatusLabel,
      pipelineStageLabel: row.pipelineStageLabel,
      nextAction: row.nextAction,
      warnings: row.warnings,
      errors: row.errors,
    })),
    columns,
  };

  return { preview, rows };
}

export async function previewConsultingCsvImport(csvText: string) {
  return (await buildImportAnalysis(csvText)).preview;
}

export async function commitConsultingCsvImport(
  csvText: string,
  modeInput: string | null | undefined,
  actorUserId: string
): Promise<ConsultingImportCommitResult> {
  const mode = normalizeImportMode(modeInput);
  const analysis = await buildImportAnalysis(csvText);

  let created = 0;
  let updated = 0;
  let omitted = 0;
  const errors: ConsultingImportCommitError[] = [];

  for (const row of analysis.rows) {
    if (row.status === "error" || !row.prepared) {
      omitted += 1;
      errors.push({
        rowNumber: row.rowNumber,
        message: row.errors[0] ?? "Fila inválida.",
      });
      continue;
    }

    if (row.status === "possible_duplicate") {
      omitted += 1;
      continue;
    }

    try {
      if (row.status === "new") {
        await prisma.consultingProspect.create({
          data: buildCreateInput(row.prepared, actorUserId),
          select: { id: true },
        });
        created += 1;
        continue;
      }

      if (mode !== "create_and_update") {
        omitted += 1;
        continue;
      }

      if (!row.existingProspectId) {
        omitted += 1;
        continue;
      }

      const current = await prisma.consultingProspect.findUnique({
        where: { id: row.existingProspectId },
        select: {
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
        },
      });

      if (!current) {
        omitted += 1;
        errors.push({
          rowNumber: row.rowNumber,
          message: "El prospecto existente ya no está disponible.",
        });
        continue;
      }

      await prisma.consultingProspect.update({
        where: { id: current.id },
        data: buildUpdateInput(current, row.prepared, actorUserId),
        select: { id: true },
      });
      updated += 1;
    } catch (error) {
      omitted += 1;
      errors.push({
        rowNumber: row.rowNumber,
        message: error instanceof Error ? error.message : "No fue posible procesar la fila.",
      });
    }
  }

  return {
    created,
    updated,
    omitted,
    errors: errors.slice(0, 20),
  };
}
