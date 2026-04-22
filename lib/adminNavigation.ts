export type AdminNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  status: "live" | "placeholder";
  matchPaths?: string[];
};

export const adminNavigation: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    shortLabel: "Dashboard",
    description: "Hub principal del master admin.",
    status: "live",
  },
  {
    href: "/admin/customers",
    label: "Clientes",
    shortLabel: "Clientes",
    description: "Base para el futuro control center por cliente.",
    status: "live",
  },
  {
    href: "/admin/companies",
    label: "Empresas",
    shortLabel: "Empresas",
    description: "Alta, aprobación manual y lifecycle comercial.",
    status: "live",
  },
  {
    href: "/admin/treasury",
    label: "Tesorería",
    shortLabel: "Tesorería",
    description: "Acceso a overview y operaciones heredadas.",
    status: "live",
    matchPaths: ["/admin/overview", "/admin/ops"],
  },
  {
    href: "/admin/subscriptions",
    label: "Suscripciones",
    shortLabel: "Suscripciones",
    description: "Modelo comercial company-level y control admin de suscripción.",
    status: "live",
  },
  {
    href: "/admin/pricing",
    label: "Pricing",
    shortLabel: "Pricing",
    description: "Pricing comercial base, overrides por empresa y precedencia efectiva.",
    status: "live",
  },
  {
    href: "/admin/loans",
    label: "Créditos",
    shortLabel: "Créditos",
    description: "Base para créditos administrados manualmente.",
    status: "placeholder",
  },
  {
    href: "/admin/audit",
    label: "Auditoría",
    shortLabel: "Auditoría",
    description: "Acciones admin auditables, historial y resultados.",
    status: "live",
  },
];

export function isAdminNavItemActive(item: AdminNavItem, pathname: string) {
  if (pathname === item.href) return true;
  if (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) return true;
  return (item.matchPaths ?? []).some((candidate) =>
    pathname === candidate || pathname.startsWith(`${candidate}/`)
  );
}
