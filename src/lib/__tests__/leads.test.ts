import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  lead: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  automation: { findMany: vi.fn() },
  automationRun: { create: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: mocks }));

import {
  LEAD_STAGES,
  createLead,
  getLeads,
  leadSummaryFallback,
  leadTemperature,
  scoreLead,
  updateLead,
} from "@/lib/leads";

beforeEach(() => vi.clearAllMocks());

describe("lead scoring (works with zero AI)", () => {
  it("scores on reachability, intent and deal size", () => {
    expect(scoreLead({})).toBe(15);
    expect(scoreLead({ email: "a@b.c", phone: "123", serviceId: "svc", valueCents: 5000, notes: "wants automation" })).toBe(100);
    expect(leadTemperature(scoreLead({ email: "a@b.c", phone: "1" }))).toBe("Warm");
  });

  it("writes a deterministic summary and lists stages", () => {
    expect(leadSummaryFallback({ email: "a@b.c", phone: "1", serviceId: "svc" })).toContain("Hot lead");
    expect(LEAD_STAGES).toContain("QUALIFIED");
  });
});

describe("createLead fires the automation loop", () => {
  it("stores the lead scoped to the workspace and dispatches LEAD_CREATED", async () => {
    mocks.lead.create.mockResolvedValue({ id: "l1", name: "Sam", email: "s@x.co", phone: "999", companyId: "grace" });
    mocks.automation.findMany.mockResolvedValue([]); // engine finds no recipes
    mocks.automationRun.create.mockResolvedValue({});

    await createLead("tenant-a", "user-1", { name: "Sam", email: "s@x.co", phone: "999", companyId: "grace", companyName: "Grace" });

    // Lead persisted with a computed score.
    expect(mocks.lead.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ workspaceId: "tenant-a", name: "Sam", score: 65 }),
    }));
    // Automation engine queried for LEAD_CREATED recipes in this workspace+company.
    expect(mocks.automation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ workspaceId: "tenant-a", trigger: "LEAD_CREATED", enabled: true }),
    }));
  });
});

describe("scoping", () => {
  it("lists leads scoped to the workspace", async () => {
    mocks.lead.findMany.mockResolvedValue([]);
    await getLeads("tenant-a");
    expect(mocks.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { workspaceId: "tenant-a" } }));
  });

  it("scopes updates so a foreign id can never be written", async () => {
    // Foreign id isn't visible in this tenant → the pre-read returns nothing and
    // no write (or win→bill conversion) ever happens.
    mocks.lead.findFirst.mockResolvedValue(null);
    const count = await updateLead("tenant-a", "rival-lead", { stage: "WON" });
    expect(mocks.lead.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "rival-lead", workspaceId: "tenant-a" },
    }));
    expect(count).toBe(0);
    expect(mocks.lead.updateMany).not.toHaveBeenCalled();
  });
});
