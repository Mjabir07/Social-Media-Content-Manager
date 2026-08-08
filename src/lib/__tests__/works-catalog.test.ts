import { describe, expect, it } from "vitest";
import {
  isWorkStatus,
  isClientType,
  workStatusMeta,
  formatWorkAmount,
  worksTotalCents,
  computeAmountCents,
  computeProfitCents,
  computeCostCents,
  laborCostCents,
  WORK_STATUSES,
} from "@/lib/works-catalog";

describe("isWorkStatus", () => {
  it("accepts known statuses, rejects others", () => {
    expect(isWorkStatus("ACTIVE")).toBe(true);
    expect(isWorkStatus("DELIVERED")).toBe(true);
    expect(isWorkStatus("PAID")).toBe(false);
    expect(isWorkStatus(null)).toBe(false);
  });
  it("has meta for every status", () => {
    for (const s of WORK_STATUSES) expect(workStatusMeta[s].label.length).toBeGreaterThan(0);
  });
});

describe("isClientType", () => {
  it("validates DIRECT and RESELLER only", () => {
    expect(isClientType("DIRECT")).toBe(true);
    expect(isClientType("RESELLER")).toBe(true);
    expect(isClientType("PARTNER")).toBe(false);
  });
});

describe("worksTotalCents", () => {
  it("sums amounts, ignoring nulls", () => {
    expect(worksTotalCents([{ amountCents: 5000 }, { amountCents: null }, { amountCents: 2500 }])).toBe(7500);
    expect(worksTotalCents([])).toBe(0);
  });
});

describe("formatWorkAmount", () => {
  it("formats cents into a currency string", () => {
    expect(formatWorkAmount(150000, "AED")).toContain("1,500");
    expect(formatWorkAmount(null)).toBeNull();
  });
});

describe("computeAmountCents", () => {
  it("multiplies quantity by unit price", () => {
    expect(computeAmountCents(3, 5000)).toBe(15000);
  });
  it("defaults quantity to 1 and floors it to at least 1", () => {
    expect(computeAmountCents(null, 5000)).toBe(5000);
    expect(computeAmountCents(0, 5000)).toBe(5000);
  });
  it("is null when there is no unit price", () => {
    expect(computeAmountCents(3, null)).toBeNull();
  });
});

describe("laborCostCents", () => {
  it("is hours × hourly rate", () => {
    expect(laborCostCents(2.5, 4000)).toBe(10000);
  });
  it("is 0 when hours or rate missing", () => {
    expect(laborCostCents(null, 4000)).toBe(0);
    expect(laborCostCents(2, null)).toBe(0);
  });
});

describe("computeCostCents", () => {
  it("sums vendor + labor + operational + hosting", () => {
    // vendor 5×1200=6000, labor 2×4000=8000, ops 1000, hosting 500 = 15500
    expect(computeCostCents({ quantity: 5, unitCostCents: 1200, laborHours: 2, hourlyRateCents: 4000, operationalCents: 1000, hostingCents: 500 })).toBe(15500);
  });
  it("is null when no cost component is given", () => {
    expect(computeCostCents({ quantity: 5 })).toBeNull();
  });
  it("counts a single component", () => {
    expect(computeCostCents({ hostingCents: 2500 })).toBe(2500);
  });
});

describe("computeProfitCents", () => {
  it("is revenue minus cost", () => {
    expect(computeProfitCents(10000, 6000)).toBe(4000);
  });
  it("treats missing cost as zero", () => {
    expect(computeProfitCents(10000, null)).toBe(10000);
  });
  it("is null with no revenue", () => {
    expect(computeProfitCents(null, 6000)).toBeNull();
  });
});
