"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import type { BackofficeNavItem } from "@/lib/backofficePermissions";

const STORAGE_KEY = "k21-backoffice-nav-collapsed";
const STORAGE_EVENT = "k21-backoffice-nav-storage";

function initialsForUser(value: string | null | undefined) {
  const parts = String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "K";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function isActiveNavItem(pathname: string, href: string) {
  if (href === "/backoffice") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function subscribeToCollapsedState(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function readCollapsedState() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export default function BackofficeNavClient({
  items,
  roleLabel,
  userEmail,
  userName,
}: {
  items: BackofficeNavItem[];
  roleLabel: string;
  userEmail: string;
  userName: string | null;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeToCollapsedState,
    readCollapsedState,
    () => false
  );
  const userInitials = useMemo(() => initialsForUser(userName ?? userEmail), [userEmail, userName]);

  function toggleCollapsed() {
    const next = !collapsed;
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  return (
    <aside
      className={[
        "border-b border-white/10 bg-black/20 px-4 py-5 backdrop-blur transition-[width,padding] duration-200 lg:sticky lg:top-0 lg:min-h-screen lg:flex-none lg:border-b-0 lg:border-r",
        collapsed ? "lg:w-[116px]" : "lg:w-[288px]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3 lg:block">
        <div className={collapsed ? "lg:text-center" : ""}>
          <div className="text-[11px] uppercase tracking-[0.24em] text-amber-200/70">Kapa21</div>
          <h1 className="mt-2 text-lg font-semibold text-white">
            {collapsed ? "BO" : "Backoffice"}
          </h1>
          {!collapsed ? (
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Shell comercial aislado del admin legado.
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 lg:mt-3 lg:justify-between">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden lg:inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-[11px] font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
            aria-pressed={collapsed}
            title={collapsed ? "Expandir sidebar" : "Compactar sidebar"}
          >
            {collapsed ? "Expandir" : "Compactar"}
          </button>

          <form action="/api/backoffice/logout" method="post">
            <button
              type="submit"
              className={[
                "k21-btn-secondary px-3 py-2 text-xs",
                collapsed ? "lg:px-2.5" : "",
              ].join(" ")}
              title="Salir"
            >
              {collapsed ? "Salir" : "Salir"}
            </button>
          </form>
        </div>
      </div>

      <div
        className={[
          "mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4",
          collapsed ? "lg:px-3 lg:text-center" : "",
        ].join(" ")}
      >
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 text-sm font-semibold text-amber-100">
          {userInitials}
        </div>
        {!collapsed ? (
          <>
            <div className="mt-3 text-sm font-medium text-white">{userName ?? userEmail}</div>
            <div className="mt-1 break-all text-xs text-white/50">{userEmail}</div>
          </>
        ) : null}
        <div className="mt-3 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-100">
          {collapsed ? roleLabel.slice(0, 5) : roleLabel}
        </div>
      </div>

      <nav className="mt-5 space-y-2.5">
        {items.map((item) => {
          const active = isActiveNavItem(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={[
                "block rounded-2xl border px-4 py-2.5 transition",
                active
                  ? "border-amber-500/35 bg-amber-500/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
                collapsed ? "lg:px-3 lg:text-center" : "",
              ].join(" ")}
            >
              <div
                className={[
                  "text-sm font-medium",
                  active ? "text-amber-100" : "text-white",
                ].join(" ")}
              >
                {item.title}
              </div>
              {!collapsed ? (
                <div className="mt-1 text-[11px] leading-relaxed text-white/50">
                  {item.description}
                </div>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
