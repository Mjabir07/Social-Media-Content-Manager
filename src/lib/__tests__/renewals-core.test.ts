import { describe, expect, it } from "vitest";
import {
  daysUntil,
  reminderBucket,
  computeRenewalReminders,
  renewalMessage,
  type RenewalItem,
} from "@/lib/renewals-core";

const NOW = new Date("2026-08-05T12:00:00Z");
const inDays = (n: number) => new Date(Date.UTC(2026, 7, 5 + n));

describe("daysUntil", () => {
  it("reads same calendar day as 0 regardless of time of day", () => {
    expect(daysUntil(new Date("2026-08-05T23:00:00Z"), NOW)).toBe(0);
  });
  it("counts whole days forward and backward", () => {
    expect(daysUntil(inDays(7), NOW)).toBe(7);
    expect(daysUntil(inDays(-3), NOW)).toBe(-3);
  });
});

describe("reminderBucket", () => {
  it("maps days-left to the right bucket", () => {
    expect(reminderBucket(-1)).toBe("overdue");
    expect(reminderBucket(0)).toBe("1d");
    expect(reminderBucket(1)).toBe("1d");
    expect(reminderBucket(5)).toBe("7d");
    expect(reminderBucket(14)).toBe("14d");
    expect(reminderBucket(30)).toBe("30d");
  });
  it("returns null when the date is further out than 30 days", () => {
    expect(reminderBucket(31)).toBeNull();
    expect(reminderBucket(365)).toBeNull();
  });
});

describe("computeRenewalReminders", () => {
  const items: RenewalItem[] = [
    { kind: "domain", id: "d1", label: "azmin.dev", companyName: "AZMIN", expiryDate: inDays(3) },
    { kind: "hosting", id: "h1", label: "Hetzner", companyName: null, expiryDate: inDays(90) },
    { kind: "email", id: "e1", label: "Google Workspace", companyName: null, expiryDate: inDays(-2) },
    { kind: "domain", id: "d2", label: "no-date.dev", companyName: null, expiryDate: null },
  ];

  it("keeps only dated items within a threshold and sorts most-urgent first", () => {
    const due = computeRenewalReminders(items, NOW);
    expect(due.map((r) => r.id)).toEqual(["e1", "d1"]);
  });

  it("skips items with no date and items too far out", () => {
    const due = computeRenewalReminders(items, NOW);
    expect(due.find((r) => r.id === "h1")).toBeUndefined();
    expect(due.find((r) => r.id === "d2")).toBeUndefined();
  });
});

describe("renewalMessage", () => {
  it("phrases overdue, today, and future differently", () => {
    expect(renewalMessage({ kind: "email", id: "e1", label: "GW", companyName: null, expiryDate: inDays(-2), daysLeft: -2, bucket: "overdue" })).toMatch(/has expired/);
    expect(renewalMessage({ kind: "domain", id: "d", label: "x.dev", companyName: "AZMIN", expiryDate: inDays(0), daysLeft: 0, bucket: "1d" })).toMatch(/expires today/);
    expect(renewalMessage({ kind: "hosting", id: "h", label: "Hetzner", companyName: null, expiryDate: inDays(6), daysLeft: 6, bucket: "7d" })).toMatch(/expires in 6 days/);
  });
  it("includes the company name when present", () => {
    expect(renewalMessage({ kind: "domain", id: "d", label: "x.dev", companyName: "Acme", expiryDate: inDays(3), daysLeft: 3, bucket: "7d" })).toContain("(Acme)");
  });
});
