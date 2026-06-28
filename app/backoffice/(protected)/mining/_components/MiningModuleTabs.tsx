"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/backoffice/mining",
    title: "Prospectos Mining",
    description: "Pipeline privado",
    isActive: (pathname: string) => !pathname.startsWith("/backoffice/mining/operations"),
  },
  {
    href: "/backoffice/mining/operations",
    title: "Operaciones Mining",
    description: "Ventas en cierre o activación",
    isActive: (pathname: string) => pathname.startsWith("/backoffice/mining/operations"),
  },
];

export default function MiningModuleTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/10 bg-black/10">
      <div className="mx-auto flex max-w-[1500px] flex-wrap gap-3 px-6 py-4">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "rounded-2xl border px-4 py-3 transition",
                active
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]",
              ].join(" ")}
            >
              <div className={active ? "text-sm font-medium text-amber-100" : "text-sm font-medium text-white"}>
                {tab.title}
              </div>
              <div className={active ? "mt-1 text-xs text-amber-100/70" : "mt-1 text-xs text-white/55"}>
                {tab.description}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
