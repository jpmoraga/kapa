import Link from "next/link";

type AdminModuleCardProps = {
  href: string;
  title: string;
  description: string;
  status: string;
  meta?: string;
};

export default function AdminModuleCard({
  href,
  title,
  description,
  status,
  meta,
}: AdminModuleCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold tracking-tight text-white">{title}</div>
          <p className="mt-2 text-sm text-neutral-400">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
          {status}
        </span>
      </div>
      {meta ? <div className="mt-4 text-xs text-neutral-500">{meta}</div> : null}
      <div className="mt-4 text-sm text-neutral-200 group-hover:text-white">Abrir módulo</div>
    </Link>
  );
}
