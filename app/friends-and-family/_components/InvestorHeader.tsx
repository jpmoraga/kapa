"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

type InvestorHeaderProps = {
  navItems: readonly NavItem[];
  whatsappUrl: string;
};

export function InvestorHeader({ navItems, whatsappUrl }: InvestorHeaderProps) {
  const [activeHref, setActiveHref] = useState(navItems[0]?.href || "#oportunidad");
  const pillRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const sections = navItems
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((section): section is HTMLElement => section !== null);

    const updateActive = () => {
      const scrollPosition = window.scrollY + 180;
      let current = navItems[0]?.href || "#oportunidad";

      sections.forEach((section) => {
        if (section.offsetTop <= scrollPosition) {
          current = `#${section.id}`;
        }
      });

      setActiveHref(current);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("hashchange", updateActive);

    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("hashchange", updateActive);
    };
  }, [navItems]);

  useEffect(() => {
    const node = pillRefs.current[activeHref];
    if (!node) return;

    node.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeHref]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(8,10,14,0.72)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/brand/k21-lockup-white.svg"
              alt="Kapa21"
              width={420}
              height={120}
              priority
              className="h-12 w-auto sm:h-14"
            />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="k21-btn-secondary border-white/12 bg-white/[0.04] px-4 py-2.5 text-neutral-100 hover:bg-white/[0.08]"
          >
            WhatsApp
          </a>
        </div>

        <div className="relative mt-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-[rgba(8,10,14,0.92)] to-transparent sm:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 bg-gradient-to-l from-[rgba(8,10,14,0.92)] to-transparent sm:hidden" />
          <nav
            className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Navegación de investor page"
          >
            <div className="flex min-w-max snap-x gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1.5 pr-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:pr-1.5">
              {navItems.map((item) => {
                const isActive = activeHref === item.href;

                return (
                  <a
                    key={item.href}
                    ref={(node) => {
                      pillRefs.current[item.href] = node;
                    }}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`snap-start rounded-full border px-3.5 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:px-4 sm:text-sm ${
                      isActive
                        ? "border-[#F7931A]/25 bg-[#F7931A]/12 text-[#FFD29E] shadow-[0_8px_18px_rgba(247,147,26,0.14)]"
                        : "border-transparent bg-transparent text-neutral-200 hover:border-white/12 hover:bg-white/[0.09] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
