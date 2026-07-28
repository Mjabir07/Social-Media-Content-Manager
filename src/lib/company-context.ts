export const ACTIVE_COMPANY_COOKIE = "azmin_active_company_id";

export type CompanyContextItem = {
  id: string;
  name: string;
  relationshipType: string;
  isHeadquarters: boolean;
  primaryColor: string;
  status: string;
};

export function resolveActiveCompany<T extends CompanyContextItem>(
  companies: T[],
  requestedCompanyId?: string,
): T | undefined {
  return (
    companies.find((company) => company.id === requestedCompanyId) ??
    companies.find((company) => company.isHeadquarters) ??
    companies[0]
  );
}

export function activeCompanyCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}