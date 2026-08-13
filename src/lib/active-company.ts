import { cookies } from "next/headers";
import { getCompanies } from "@/lib/companies";
import { ACTIVE_COMPANY_COOKIE, resolveActiveCompany } from "@/lib/company-context";

/**
 * Resolve the active company (from the switcher cookie) for per-company data
 * isolation, usable from both server pages and API routes.
 */
export type ActiveCompany = { id: string; isHeadquarters: boolean };

export async function getActiveCompany(workspaceId: string): Promise<ActiveCompany | null> {
  const companies = await getCompanies(workspaceId);
  const store = await cookies();
  const c = resolveActiveCompany(companies, store.get(ACTIVE_COMPANY_COOKIE)?.value);
  return c ? { id: c.id, isHeadquarters: c.isHeadquarters } : null;
}

// Prisma `where` fragment that isolates by active company: a specific company
// sees only its own rows; headquarters (owner) also sees untagged/legacy rows.
export function companyScopeWhere(active: ActiveCompany | null | undefined): Record<string, unknown> {
  if (!active) return {};
  return active.isHeadquarters ? { OR: [{ companyId: active.id }, { companyId: null }] } : { companyId: active.id };
}
