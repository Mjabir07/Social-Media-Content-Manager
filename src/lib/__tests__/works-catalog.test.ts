import { describe, expect, it } from "vitest";
import {
  isWorkStatus,
  isClientType,
  workStatusMeta,
  formatWorkAmount,
  worksTotalCents,
  computeAmountCents,
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
