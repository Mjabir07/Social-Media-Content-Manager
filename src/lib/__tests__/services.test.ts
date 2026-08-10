import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  service: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), createMany: vi.fn(), updateMany: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: { service: mocks.service } }));

import {
  formatServicePrice,
  installAgencyServiceCatalogue,
  getService,
  getServices,
  isPricingModel,
  pricingModelLabels,
  updateService,
} from "@/lib/services";

beforeEach(() => vi.clearAllMocks());

describe("pricing helpers", () => {
  it("labels every pricing model and validates unknown values", () => {
    expect(Object.keys(pricingModelLabels)).toContain("RETAINER");
    expect(isPricingModel("HOURLY")).toBe(true);
    expect(isPricingModel("BARTER")).toBe(false);
  });

  it("installs the canonical catalogue idempotently", async () => {
    mocks.service.findMany.mockResolvedValue([]);
    mocks.service.createMany.mockResolvedValue({ count: 62 });
    const result = await installAgencyServiceCatalogue("tenant-a", "user-a");
    expect(result.created).toBeGreaterThan(50);
    expect(mocks.service.createMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Array) }));
  });

  it("formats prices from minor units and shows a quote label for null", () => {
    expect(formatServicePrice(150000, "AED", "per project")).toBe("AED 1,500 per project");
    expect(formatServicePrice(2500, "USD")).toBe("USD 25");
    expect(formatServicePrice(null)).toBe("Custom quote");
  });
});

describe("service catalogue is workspace scoped", () => {
  it("lists services scoped to the workspace, excluding archived", async () => {
    mocks.service.findMany.mockResolvedValue([]);
    await getServices("tenant-a");
    expect(mocks.service.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { workspaceId: "tenant-a", status: { not: "ARCHIVED" } },
    }));
  });

  it("for a company, returns its own plus shared (company-less) items", async () => {
    mocks.service.findMany.mockResolvedValue([]);
    await getServices("tenant-a", "grace");
    expect(mocks.service.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        workspaceId: "tenant-a",
        status: { not: "ARCHIVED" },
        OR: [{ companyId: "grace" }, { companyId: null }],
      },
    }));
  });

  it("reads a single service only within its workspace", async () => {
    mocks.service.findFirst.mockResolvedValue(null);
    await getService("tenant-a", "svc-from-tenant-b");
    expect(mocks.service.findFirst).toHaveBeenCalledWith({
      where: { id: "svc-from-tenant-b", workspaceId: "tenant-a" },
    });
  });

  it("scopes updates so a foreign id can never be written", async () => {
    mocks.service.updateMany.mockResolvedValue({ count: 0 });
    const count = await updateService("tenant-a", "rival-svc", { name: "Hijack" });
    expect(mocks.service.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "rival-svc", workspaceId: "tenant-a" },
    }));
    expect(count).toBe(0);
  });
});
