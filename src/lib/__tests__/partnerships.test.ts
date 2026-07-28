import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  partnership: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  lead: { findMany: vi.fn() },
  commissionPayment: { findMany: vi.fn(), create: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: mocks }));

import {
  commissionOwed,
  formatRate,
  getPartnershipSettlement,
  getPartnerships,
  recordPayment,
  settlement,
} from "@/lib/partnerships";

beforeEach(() => vi.clearAllMocks());

describe("commission math", () => {
  it("computes percentage and flat commissions exactly", () => {
    // 10% of AED 10,000 = AED 1,000
    expect(commissionOwed({ commissionType: "PERCENT", commissionRateBps: 1000 }, 1_000_000)).toBe(100_000);
    // FLAT ignores deal value
    expect(commissionOwed({ commissionType: "FLAT", commissionRateBps: 0, commissionFlatCents: 50_000 }, 999_999)).toBe(50_000);
    expect(formatRate({ commissionType: "PERCENT", commissionRateBps: 1500 })).toBe("15%");
  });

  it("never returns a negative outstanding balance", () => {
    expect(settlement(100_000, 120_000).outstandingCents).toBe(0);
  });
});

describe("Phase 2 exit gate — partner lead → won → partial payment → settlement", () => {
  it("earns commission on the won deal and computes the outstanding balance after a partial payment", async () => {
    // 10% partnership.
    mocks.partnership.findFirst.mockResolvedValue({ id: "p1", commissionType: "PERCENT", commissionRateBps: 1000, commissionFlatCents: null, currency: "AED" });
    // One WON partner lead worth AED 10,000.
    mocks.lead.findMany.mockResolvedValue([{ valueCents: 1_000_000 }]);
    // A partial payment of AED 400.
    mocks.commissionPayment.findMany.mockResolvedValue([{ amountCents: 40_000 }]);

    const result = await getPartnershipSettlement("tenant-a", "p1");

    expect(result).not.toBeNull();
    expect(result!.earnedCents).toBe(100_000); // AED 1,000 earned
    expect(result!.paidCents).toBe(40_000); //   AED 400 paid
    expect(result!.outstandingCents).toBe(60_000); // AED 600 outstanding
    expect(result!.wonCount).toBe(1);
    // Everything queried within the workspace.
    expect(mocks.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { workspaceId: "tenant-a", partnershipId: "p1", stage: "WON" },
    }));
  });
});

describe("scoping", () => {
  it("lists partnerships scoped to the workspace", async () => {
    mocks.partnership.findMany.mockResolvedValue([]);
    await getPartnerships("tenant-a");
    expect(mocks.partnership.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { workspaceId: "tenant-a" } }));
  });

  it("refuses to record a payment against another workspace's partnership", async () => {
    mocks.partnership.findFirst.mockResolvedValue(null); // not found in this workspace
    const res = await recordPayment("tenant-a", "user-1", { partnershipId: "rival-p", amountCents: 1000 });
    expect(res).toBeNull();
    expect(mocks.commissionPayment.create).not.toHaveBeenCalled();
  });
});
