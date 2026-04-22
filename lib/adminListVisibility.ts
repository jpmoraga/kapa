export function isHiddenAuditOrTestCompanyName(name: string | null | undefined) {
  const normalized = String(name ?? "").trim().toLowerCase();
  if (!normalized) return false;

  // Conservative UI-only filter for known audit fixtures created by local/test scripts.
  return normalized.startsWith("audit audit+") || normalized.includes("@local.test");
}
