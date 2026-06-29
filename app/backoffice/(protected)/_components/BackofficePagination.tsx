import Link from "next/link";
import { buildBackofficeListHref, type BackofficePaginationMeta } from "@/lib/backofficeList";

function formatCount(value: number) {
  return new Intl.NumberFormat("es-CL").format(value);
}

function pagerClass(enabled: boolean) {
  return enabled
    ? "k21-btn-secondary inline-flex px-3 py-2 text-xs"
    : "inline-flex cursor-not-allowed rounded-xl border border-white/10 px-3 py-2 text-xs text-white/35";
}

export default function BackofficePagination({
  basePath,
  countLabel,
  params,
  pagination,
}: {
  basePath: string;
  countLabel: string;
  params: Record<string, string | number | null | undefined>;
  pagination: BackofficePaginationMeta;
}) {
  const summary = pagination.totalFiltered
    ? `Mostrando ${formatCount(pagination.start)}-${formatCount(pagination.end)} de ${formatCount(
        pagination.totalFiltered
      )} ${countLabel} filtrados.`
    : `Mostrando 0 de 0 ${countLabel} filtrados.`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
      <div className="text-sm text-white/55">
        {summary} Base total {formatCount(pagination.totalGlobal)}. Página {formatCount(
          pagination.page
        )} de {formatCount(pagination.totalPages)}.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {pagination.hasPrev ? (
          <Link
            href={buildBackofficeListHref(basePath, {
              ...params,
              page: pagination.page - 1,
            })}
            className={pagerClass(true)}
          >
            Anterior
          </Link>
        ) : (
          <span className={pagerClass(false)}>Anterior</span>
        )}

        {pagination.hasNext ? (
          <Link
            href={buildBackofficeListHref(basePath, {
              ...params,
              page: pagination.page + 1,
            })}
            className={pagerClass(true)}
          >
            Siguiente
          </Link>
        ) : (
          <span className={pagerClass(false)}>Siguiente</span>
        )}
      </div>
    </div>
  );
}
