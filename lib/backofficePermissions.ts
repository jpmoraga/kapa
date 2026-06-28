import { BackofficeRole } from "@prisma/client";

export type BackofficeSection = "home" | "consulting" | "mining" | "users";

export type BackofficeNavItem = {
  href: string;
  title: string;
  description: string;
  section: BackofficeSection;
};

export const BACKOFFICE_ROLE_LABELS: Record<BackofficeRole, string> = {
  OWNER: "Owner",
  CONSULTING_ADMIN: "Consulting Admin",
  MINING_ADMIN: "Mining Admin",
  MINING_PARTNER: "Mining Partner",
};

const BACKOFFICE_SECTION_ACCESS: Record<BackofficeSection, readonly BackofficeRole[]> = {
  home: [
    BackofficeRole.OWNER,
    BackofficeRole.CONSULTING_ADMIN,
    BackofficeRole.MINING_ADMIN,
    BackofficeRole.MINING_PARTNER,
  ],
  consulting: [BackofficeRole.OWNER, BackofficeRole.CONSULTING_ADMIN],
  mining: [BackofficeRole.OWNER, BackofficeRole.MINING_ADMIN],
  users: [BackofficeRole.OWNER],
};

const BACKOFFICE_NAV_ITEMS: readonly BackofficeNavItem[] = [
  {
    href: "/backoffice",
    title: "Inicio",
    description: "Hub base del nuevo backoffice comercial.",
    section: "home",
  },
  {
    href: "/backoffice/consulting",
    title: "Consulting",
    description: "Entrada reservada para el pipeline comercial de Consulting.",
    section: "consulting",
  },
  {
    href: "/backoffice/mining",
    title: "Mining",
    description: "Pipeline privado y operaciones internas de Mining.",
    section: "mining",
  },
  {
    href: "/backoffice/users",
    title: "Usuarios",
    description: "Gestión futura de usuarios, roles y permisos.",
    section: "users",
  },
] as const;

export function backofficeRoleLabel(role: BackofficeRole) {
  return BACKOFFICE_ROLE_LABELS[role];
}

export function canAccessBackofficeSection(role: BackofficeRole, section: BackofficeSection) {
  return BACKOFFICE_SECTION_ACCESS[section].includes(role);
}

export function getBackofficeNavItems(role: BackofficeRole) {
  return BACKOFFICE_NAV_ITEMS.filter((item) => canAccessBackofficeSection(role, item.section));
}
