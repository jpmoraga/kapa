"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation, isAdminNavItemActive } from "@/lib/adminNavigation";

type AdminNavigationProps = {
  adminEmail: string;
  adminRole: string;
};

function statusLabel(status: "live" | "placeholder") {
  return status === "live" ? "Disponible" : "Base lista";
}

function navLinkClasses(active: boolean) {
  if (active) {
    return "border-white/20 bg-white/10 text-white";
  }
  return "border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white";
}

export default function AdminNavigation({ adminEmail, adminRole }: AdminNavigationProps) {
  const pathname = usePathname();

  return (
    <>
      <div className="border-b border-white/10 px-4 py-4 lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-neutral-500">Master Admin</div>
            <div className="mt-1 text-lg font-semibold text-white">Kapa21 /admin</div>
            <div className="mt-1 text-xs text-neutral-500">
              {adminEmail} · {adminRole}
            </div>
          </div>
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200 hover:bg-white/10"
            >
              Salir
            </button>
          </form>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {adminNavigation.map((item) => {
            const active = isAdminNavItemActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-xl border px-3 py-2 text-sm transition ${navLinkClasses(active)}`}
              >
                {item.shortLabel}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="hidden h-screen lg:flex lg:w-80 lg:flex-col lg:border-r lg:border-white/10 lg:bg-neutral-950/80">
        <div className="flex h-full flex-col px-5 py-6">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-neutral-500">Master Admin</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">Kapa21 /admin</div>
            <p className="mt-3 text-sm text-neutral-400">
              Hub de control para navegación, visibilidad y operaciones administrativas heredadas.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Sesión</div>
            <div className="mt-2 text-sm font-medium text-white">{adminEmail}</div>
            <div className="mt-1 text-xs text-neutral-500">{adminRole}</div>
          </div>

          <nav className="mt-6 flex-1 space-y-2">
            {adminNavigation.map((item) => {
              const active = isAdminNavItemActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl border p-4 transition ${navLinkClasses(active)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="mt-1 text-xs text-neutral-500">{item.description}</div>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
                      {statusLabel(item.status)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-100">
              Esta fase consolida acceso, navegación y visibilidad. No agrega acciones que modifiquen
              balances ni patrimonio.
            </div>
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-200 transition hover:bg-white/10"
              >
                Cerrar sesión admin
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
