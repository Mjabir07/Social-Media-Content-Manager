import { describe, expect, it } from "vitest";
import {
  billableHours,
  computeHourlyRateCents,
  DEFAULT_WORKING_HOURS,
  DEFAULT_BILLABLE_PERCENT,
} from "@/lib/rate-catalog";

describe("billableHours", () => {
  it("is working hours × utilization", () => {
    expect(billableHours(160, 60)).toBe(96);
  });
  it("falls back to defaults", () => {
    expect(billableHours(null, null)).toBe((DEFAULT_WORKING_HOURS * DEFAULT_BILLABLE_PERCENT) / 100);
  });
  it("clamps percent into 1..100", () => {
    expect(billableHours(100, 0)).toBe(1);
    expect(billableHours(100, 200)).toBe(100);
  });
});

describe("computeHourlyRateCents", () => {
  it("is (overhead + pay) ÷ billable hours, rounded", () => {
    // (200000 + 1000000) / (160 × 0.6 = 96) = 12500
    expect(computeHourlyRateCents({ monthlyOverheadCents: 200000, monthlyPayTargetCents: 1000000, workingHoursPerMonth: 160, billablePercent: 60 })).toBe(12500);
  });
  it("uses defaults when hours/percent missing", () => {
    // 96000 / 96 = 1000
    expect(computeHourlyRateCents({ monthlyPayTargetCents: 96000 })).toBe(1000);
  });
  it("is null when nothing to cover", () => {
    expect(computeHourlyRateCents({ workingHoursPerMonth: 160, billablePercent: 60 })).toBeNull();
  });
});
