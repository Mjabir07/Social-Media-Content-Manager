/**
 * Pure client-vault taxonomy — no prisma, client-safe. Categories for grouping
 * stored client credentials (domain panels, email logins, hosting, …).
 */

export const VAULT_CATEGORIES = ["DOMAIN", "EMAIL", "HOSTING", "CPANEL", "FTP", "SOCIAL", "OTHER"] as const;
export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

export const vaultCategoryMeta: Record<VaultCategory, { label: string; color: string; bg: string }> = {
  DOMAIN: { label: "Domain / DNS", color: "#16A34A", bg: "#EAF9EF" },
  EMAIL: { label: "Email", color: "#0758C9", bg: "#E7F0FD" },
  HOSTING: { label: "Hosting / VPS", color: "#5C3AAE", bg: "#EFEBFB" },
  CPANEL: { label: "cPanel / Admin", color: "#8A5A0B", bg: "#FFF4E0" },
  FTP: { label: "FTP / SSH", color: "#234B70", bg: "#EAF1F9" },
  SOCIAL: { label: "Social / Ads", color: "#B4231C", bg: "#FDECEC" },
  OTHER: { label: "Other", color: "#456784", bg: "#EEF3F8" },
};

export function isVaultCategory(v: unknown): v is VaultCategory {
  return typeof v === "string" && (VAULT_CATEGORIES as readonly string[]).includes(v);
}

export type VaultGroup<T> = { clientName: string; items: T[] };

// Group flat credentials by client, clients sorted A→Z.
export function groupByClient<T extends { clientName: string }>(items: T[]): VaultGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const arr = map.get(it.clientName) ?? [];
    arr.push(it);
    map.set(it.clientName, arr);
  }
  return Array.from(map.entries())
    .map(([clientName, items]) => ({ clientName, items }))
    .sort((a, b) => a.clientName.localeCompare(b.clientName));
}
