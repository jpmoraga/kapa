export function envFlag(name: string, defaultValue = false) {
  const v = process.env[name];
  if (v === undefined) return defaultValue;
  return v.toLowerCase() === "true" || v === "1";
}

export function requireEnv(keys: string[], label: string) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  throw new Error(`MISSING_ENV:${label}`);
}

export function parseAllowlist(input: string | undefined) {
  return (input ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

