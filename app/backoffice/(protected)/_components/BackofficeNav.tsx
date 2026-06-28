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
    <aside className="border-b border-white/10 bg-black/20 px-6 py-6 lg:min-h-screen lg:w-[320px] lg:border-b-0 lg:border-r">
      <div className="flex items-start justify-between gap-3 lg:block">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-white/45">Kapa21</div>
          <h1 className="mt-2 text-xl font-semibold text-white">Backoffice</h1>
          <p className="mt-2 text-sm text-white/60">
            Shell comercial nuevo y aislado del admin legado.
          </p>
        </div>
        <form action="/api/backoffice/logout" method="post">
          <button type="submit" className="k21-btn-secondary px-3 py-2 text-sm">
            Salir
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="text-sm font-medium text-white">{userName ?? userEmail}</div>
        <div className="mt-1 text-xs text-white/50">{userEmail}</div>
        <div className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] uppercase tracking-wide text-amber-100">
          {backofficeRoleLabel(userRole)}
        </div>
      </div>

      <nav className="mt-6 space-y-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="text-sm font-medium text-white">{item.title}</div>
            <div className="mt-1 text-xs text-white/55">{item.description}</div>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
