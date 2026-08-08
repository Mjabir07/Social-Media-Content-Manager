/**
 * Pure Development Studio logic — no prisma, client-safe & unit-testable.
 * Dev-project statuses, repo providers, repo URL derivation, and branch
 * list (de)serialization (branches are stored as a JSON string[]).
 */

export const DEV_PROJECT_STATUSES = ["PLANNING", "ACTIVE", "MAINTENANCE", "ARCHIVED"] as const;
export type DevProjectStatus = (typeof DEV_PROJECT_STATUSES)[number];

export const devProjectStatusMeta: Record<DevProjectStatus, { label: string; color: string; bg: string }> = {
  PLANNING: { label: "Planning", color: "#5C3AAE", bg: "#EFEBFB" },
  ACTIVE: { label: "Active", color: "#0758C9", bg: "#E7F0FD" },
  MAINTENANCE: { label: "Maintenance", color: "#9A6711", bg: "#FFF1D5" },
  ARCHIVED: { label: "Archived", color: "#5A7189", bg: "#EDF1F6" },
};

export function isDevProjectStatus(v: unknown): v is DevProjectStatus {
  return typeof v === "string" && (DEV_PROJECT_STATUSES as readonly string[]).includes(v);
}

export const REPO_PROVIDERS = ["github", "gitlab", "bitbucket", "other"] as const;
export type RepoProvider = (typeof REPO_PROVIDERS)[number];

export const repoProviderMeta: Record<RepoProvider, { label: string; host: string }> = {
  github: { label: "GitHub", host: "github.com" },
  gitlab: { label: "GitLab", host: "gitlab.com" },
  bitbucket: { label: "Bitbucket", host: "bitbucket.org" },
  other: { label: "Other", host: "" },
};

export function isRepoProvider(v: unknown): v is RepoProvider {
  return typeof v === "string" && (REPO_PROVIDERS as readonly string[]).includes(v);
}

// owner/repo — 1-2 path segments of safe chars, no leading/trailing slash.
const FULL_NAME_RE = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

export function isValidFullName(fullName: string): boolean {
  return FULL_NAME_RE.test(fullName.trim());
}

/**
 * Build a browsable repo URL. If the user pasted a full http(s) URL we keep it
 * (normalizing trailing slash); otherwise we compose provider host + owner/repo.
 * Returns null when neither a URL nor a valid owner/repo is available.
 */
export function deriveRepoUrl(provider: RepoProvider, fullName: string, explicitUrl?: string | null): string | null {
  const url = explicitUrl?.trim();
  if (url && /^https?:\/\//i.test(url)) return url.replace(/\/+$/, "");
  const name = fullName.trim();
  if (!isValidFullName(name)) return null;
  const host = repoProviderMeta[provider].host;
  if (!host) return null;
  return `https://${host}/${name}`;
}

// Parse the stored JSON string[] of branch names; tolerant of bad data.
export function parseBranches(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((b): b is string => typeof b === "string" && b.trim().length > 0).map((b) => b.trim());
  } catch {
    return [];
  }
}

// Normalize a list of branch names: trim, drop empties, de-dupe (case-sensitive),
// then serialize to the JSON string we persist.
export function serializeBranches(branches: string[]): string {
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const b of branches) {
    const name = b.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      clean.push(name);
    }
  }
  return JSON.stringify(clean);
}

// All tracked branches for a repo: default branch first, then the extras
// (de-duped against the default).
export function allBranches(defaultBranch: string, extra: string[]): string[] {
  const def = defaultBranch.trim() || "main";
  return [def, ...extra.filter((b) => b.trim() && b.trim() !== def)];
}
