import { describe, expect, it } from "vitest";
import {
  ACTIVE_COMPANY_COOKIE,
  activeCompanyCookieOptions,
  resolveActiveCompany,
  type CompanyContextItem,
} from "@/lib/company-context";

function company(overrides: Partial<CompanyContextItem>): CompanyContextItem {
  return {
    id: "company",
    name: "Company",
    relationshipType: "CLIENT",
    isHeadquarters: false,
    primaryColor: "#087CFA",
    status: "ACTIVE",
    ...overrides,
  };
}

describe("company context switcher", () => {
  const companies = [
    company({
      id: "hq",
      name: "AZMIN Digital",
      relationshipType: "OWN_BRAND",
      isHeadquarters: true,
    }),
    company({ id: "client", name: "Client Company" }),
    company({
      id: "partner",
      name: "Partner Company",
      relationshipType: "PARTNER",
    }),
  ];

  it("uses the requested company when it exists in the tenant list", () => {
    expect(resolveActiveCompany(companies, "partner")?.id).toBe("partner");
  });

  it("falls back to headquarters and then the first company", () => {
    expect(resolveActiveCompany(companies)?.id).toBe("hq");
    expect(resolveActiveCompany(companies.slice(1))?.id).toBe("client");
  });

  it("returns undefined for an empty company list", () => {
    expect(resolveActiveCompany([])).toBeUndefined();
  });

  it("uses a protected, tenant-neutral cookie name and safe defaults", () => {
    expect(ACTIVE_COMPANY_COOKIE).toBe("azmin_active_company_id");
    expect(activeCompanyCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 31_536_000,
    });
  });
});