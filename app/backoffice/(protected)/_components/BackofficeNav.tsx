import Link from "next/link";
import type { BackofficeRole } from "@prisma/client";
import {
  backofficeRoleLabel,
  getBackofficeNavItems,
} from "@/lib/backofficePermissions";

export default function BackofficeNav({
  userEmail,
  userName,
  userRole,
}: {
  userEmail: string;
  userName: string | null;
  userRole: BackofficeRole;
}) {
  const items = getBackofficeNavItems(userRole);

  return (
    <aside className="border-b border-white/10 bg-black/20 px-5 py-5 backdrop-blur lg:sticky lg:top-0 lg:min-h-screen lg:w-[288px] lg:flex-none lg:border-b-0 lg:border-r">
      <div className="flex items-start justify-between gap-3 lg:block">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-amber-200/70">Kapa21</div>
          <h1 className="mt-2 text-lg font-semibold text-white">Backoffice</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Shell comercial aislado del admin legado.
          </p>
        </div>
        <form action="/api/backoffice/logout" method="post">
          <button type="submit" className="k21-btn-secondary px-3 py-2 text-xs">
            Salir
          </button>
        </form>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-medium text-white">{userName ?? userEmail}</div>
        <div className="mt-1 text-xs text-white/50">{userEmail}</div>
        <div className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100">
          {backofficeRoleLabel(userRole)}
        </div>
      </div>

      <nav className="mt-5 space-y-2.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2.5 transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="text-sm font-medium text-white">{item.title}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-white/50">{item.description}</div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
