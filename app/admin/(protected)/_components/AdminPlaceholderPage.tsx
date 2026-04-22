import AdminPageHeader from "./AdminPageHeader";

type AdminPlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  readyItems: string[];
  nextPhaseItems: string[];
  tableColumns?: string[];
  emptyMessage?: string;
  searchPlaceholder?: string;
};

export default function AdminPlaceholderPage({
  eyebrow,
  title,
  description,
  readyItems,
  nextPhaseItems,
  tableColumns,
  emptyMessage,
  searchPlaceholder,
}: AdminPlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <AdminPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-neutral-400">
            Próximamente
          </span>
        }
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section className="k21-card p-6">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Base estructural</div>
          <h2 className="mt-2 text-lg font-semibold text-white">Módulo preparado para la siguiente fase</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Esta pantalla ya vive dentro del layout admin real. La lógica de negocio específica queda
            pendiente de implementación.
          </p>

          {searchPlaceholder ? (
            <div className="mt-5">
              <label className="text-xs text-neutral-400">Buscador</label>
              <input
                disabled
                value=""
                placeholder={searchPlaceholder}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-neutral-400 outline-none"
                readOnly
              />
            </div>
          ) : null}

          {tableColumns?.length ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    {tableColumns.map((column) => (
                      <th key={column} className="px-4 py-3 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={tableColumns.length}
                      className="px-4 py-8 text-center text-sm text-neutral-500"
                    >
                      {emptyMessage ?? "Pendiente de implementación."}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <div className="space-y-6">
          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Listo en esta fase</div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-200">
              {readyItems.map((item) => (
                <li key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="k21-card p-6">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Siguiente fase</div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-200">
              {nextPhaseItems.map((item) => (
                <li key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
