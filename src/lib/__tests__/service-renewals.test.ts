import { describe, expect, it } from "vitest";
import {
  serviceStage,
  serviceRenewalMessage,
  formatAmount,
  buildInvoiceEmail,
  type ServiceRenewalLike,
} from "@/lib/renewals-core";

describe("serviceStage ladder", () => {
  it("maps days-left to the invoice/15/7/1/overdue stages", () => {
    expect(serviceStage(40)).toBeNull();
    expect(serviceStage(30)).toBe("invoice");
    expect(serviceStage(16)).toBe("invoice");
    expect(serviceStage(15)).toBe("15d");
    expect(serviceStage(8)).toBe("15d");
    expect(serviceStage(7)).toBe("7d");
    expect(serviceStage(2)).toBe("7d");
    expect(serviceStage(1)).toBe("1d");
    expect(serviceStage(0)).toBe("1d");
    expect(serviceStage(-1)).toBe("overdue");
  });
});

const base: ServiceRenewalLike = {
  service: "Google Workspace",
  clientName: "Acme",
  amountCents: 120000,
  currency: "AED",
  renewalDate: "2026-09-01",
};

describe("serviceRenewalMessage", () => {
  it("tells you to invoice at the 30-day stage, with the amount", () => {
    const msg = serviceRenewalMessage(base, 30, "invoice");
    expect(msg).toMatch(/Send renewal invoice/);
    expect(msg).toContain("Google Workspace for Acme");
    expect(msg).toContain("AED");
  });
  it("phrases final reminders for today and tomorrow", () => {
    expect(serviceRenewalMessage(base, 0, "1d")).toMatch(/renews today/);
    expect(serviceRenewalMessage(base, 1, "1d")).toMatch(/renews tomorrow/);
  });
  it("flags overdue", () => {
    expect(serviceRenewalMessage(base, -3, "overdue")).toMatch(/OVERDUE/);
  });
  it("mid-ladder reminder counts the days", () => {
    expect(serviceRenewalMessage(base, 7, "7d")).toMatch(/renews in 7 days/);
  });
});

describe("formatAmount", () => {
  it("returns null when no amount", () => {
    expect(formatAmount(null)).toBeNull();
  });
  it("formats cents to a whole-unit currency string", () => {
    expect(formatAmount(120000, "AED")).toContain("1,200");
  });
});

describe("buildInvoiceEmail", () => {
  const inv = buildInvoiceEmail({ service: "Google Workspace", clientName: "Acme", renewalDate: "2026-09-01", amountCents: 120000, currency: "AED" });
  it("subject names the service, client and due date", () => {
    expect(inv.subject).toContain("Google Workspace renewal");
    expect(inv.subject).toContain("Acme");
    expect(inv.subject).toContain("1 September 2026");
  });
  it("body greets the client, states amount, and signs off with the brand", () => {
    expect(inv.body).toContain("Hi Acme,");
    expect(inv.body).toContain("AED");
    expect(inv.body).toContain("Azmin Digital");
    expect(inv.body).toContain("it@azmindigital.com");
  });
  it("omits the amount line when no amount is given", () => {
    const noAmt = buildInvoiceEmail({ service: "Domain", clientName: "X", renewalDate: "2026-09-01" });
    expect(noAmt.body).not.toContain("Amount:");
  });
});
