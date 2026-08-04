import "server-only";

/**
 * Minimal Coolify REST client. Talks to a self-hosted Coolify instance (your
 * VPS) with a Bearer API token. Only read + a couple of control calls for now;
 * deploy/restart land in the next slice. Everything degrades to a clear error
 * when the instance is unreachable, so the platform stays usable before the VPS.
 */

// Normalize a Coolify base URL + API path into a full URL (no double slashes).
export function coolifyUrl(baseUrl: string, path: string): string {
  const base = baseUrl.trim().replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function coolifyFetch(baseUrl: string, token: string, path: string, init?: RequestInit) {
  return fetch(coolifyUrl(baseUrl, path), {
    ...init,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
}

export type CoolifyTestResult = { ok: boolean; detail: string; version?: string };

// Validate a base URL + token by asking Coolify for its version.
export async function testCoolify(baseUrl: string, token: string): Promise<CoolifyTestResult> {
  if (!/^https?:\/\//.test(baseUrl.trim())) return { ok: false, detail: "Base URL must start with http:// or https://" };
  try {
    const res = await coolifyFetch(baseUrl, token, "/api/v1/version");
    if (res.status === 401 || res.status === 403) return { ok: false, detail: "Coolify rejected this API token." };
    if (!res.ok) return { ok: false, detail: `Coolify returned HTTP ${res.status}.` };
    const version = (await res.text()).replace(/"/g, "").trim();
    return { ok: true, detail: `Connected to Coolify ${version || ""}`.trim(), version };
  } catch (error) {
    return { ok: false, detail: error instanceof Error && error.name === "TimeoutError" ? "Coolify did not respond (check the URL / that the VPS is up)." : "Could not reach Coolify." };
  }
}

export type CoolifyApp = { uuid: string; name: string; status?: string; fqdn?: string };

// List applications on the connected Coolify instance (used by the live view).
export async function listCoolifyApplications(baseUrl: string, token: string): Promise<CoolifyApp[]> {
  const res = await coolifyFetch(baseUrl, token, "/api/v1/applications");
  if (!res.ok) throw new Error(`Coolify returned HTTP ${res.status}.`);
  const data = (await res.json().catch(() => [])) as Array<Record<string, unknown>>;
  return (Array.isArray(data) ? data : []).map((a) => ({
    uuid: String(a.uuid ?? ""),
    name: String(a.name ?? a.uuid ?? "app"),
    status: typeof a.status === "string" ? a.status : undefined,
    fqdn: typeof a.fqdn === "string" ? a.fqdn : undefined,
  }));
}
