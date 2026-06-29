export const BACKOFFICE_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

export type BackofficePaginationMeta = {
  page: number;
  pageSize: number;
  totalFiltered: number;
  totalGlobal: number;
  totalPages: number;
  start: number;
  end: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export function normalizeSearchQuery(value: string | null | undefined) {
  return String(value ?? "").trim();
}

export function normalizeSearchText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSearchQuery(
  query: string,
  fields: Array<string | null | undefined | number>
) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  return fields.some((field) => normalizeSearchText(String(field ?? "")).includes(normalizedQuery));
}

export function normalizePage(value: string | number | null | undefined) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function normalizePageSize(value: string | number | null | undefined) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? "").trim(), 10);
  return BACKOFFICE_PAGE_SIZE_OPTIONS.includes(parsed as (typeof BACKOFFICE_PAGE_SIZE_OPTIONS)[number])
    ? parsed
    : DEFAULT_PAGE_SIZE;
}

export function paginateItems<T>(
  items: T[],
  pageValue: string | number | null | undefined,
  pageSizeValue: string | number | null | undefined,
  totalGlobal: number
) {
  const pageSize = normalizePageSize(pageSizeValue);
  const requestedPage = normalizePage(pageValue);
  const totalFiltered = items.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const startIndex = totalFiltered ? (page - 1) * pageSize : 0;
  const endIndex = totalFiltered ? Math.min(startIndex + pageSize, totalFiltered) : 0;

  return {
    items: items.slice(startIndex, endIndex),
    pagination: {
      page,
      pageSize,
      totalFiltered,
      totalGlobal,
      totalPages,
      start: totalFiltered ? startIndex + 1 : 0,
      end: endIndex,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    } satisfies BackofficePaginationMeta,
  };
}

export function buildBackofficeListHref(
  pathname: string,
  params: Record<string, string | number | null | undefined>
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    const normalized = typeof value === "number" ? String(value) : String(value).trim();
    if (!normalized) return;
    if (key === "page" && normalized === "1") return;

    searchParams.set(key, normalized);
  });

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
