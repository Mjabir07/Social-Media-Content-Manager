import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  company: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: { company: mocks.company } }));

import { companySlug, getCompanies, getCompany, uniqueCompanySlug } from "@/lib/companies";

describe("company tenant isolation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("always scopes a company lookup by workspace and excludes archived records", async () => {
    mocks.company.findFirst.mockResolvedValue(null);
    await getCompany("tenant-a", "company-from-tenant-b");
    expect(mocks.company.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "company-from-tenant-b", workspaceId: "tenant-a", status: { not: "ARCHIVED" } },
    }));
  });

  it("always scopes company lists by workspace", async () => {
    mocks.company.findMany.mockResolvedValue([]);
    await getCompanies("tenant-a");
    expect(mocks.company.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { workspaceId: "tenant-a", status: { not: "ARCHIVED" } },
    }));
  });

  it("generates URL-safe slugs and resolves collisions within the same workspace", async () => {
    expect(companySlug("AZMIN Pulse & AI")).toBe("azmin-pulse-ai");
    mocks.company.findUnique.mockResolvedValueOnce({ id: "existing" }).mockResolvedValueOnce(null);
    await expect(uniqueCompanySlug("tenant-a", "AZMIN Digital")).resolves.toBe("azmin-digital-2");
    expect(mocks.company.findUnique).toHaveBeenNthCalledWith(1, {
      where: { workspaceId_slug: { workspaceId: "tenant-a", slug: "azmin-digital" } },
      select: { id: true },
    });
  });
});
