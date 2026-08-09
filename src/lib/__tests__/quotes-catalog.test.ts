import { describe, expect, it } from "vitest";
import {
  isQuoteStatus,
  quoteStatusMeta,
  lineTotalCents,
  quoteSubtotalCents,
  quoteNumberLabel,
  nextQuoteActions,
  QUOTE_STATUSES,
} from "@/lib/quotes-catalog";

describe("isQuoteStatus", () => {
  it("accepts known statuses, rejects others", () => {
    expect(isQuoteStatus("SENT")).toBe(true);
    expect(isQuoteStatus("ACCEPTED")).toBe(true);
    expect(isQuoteStatus("PAID")).toBe(false);
  });
  it("has meta for every status", () => {
    for (const s of QUOTE_STATUSES) expect(quoteStatusMeta[s].label.length).toBeGreaterThan(0);
  });
});

describe("line math", () => {
  it("line total = qty × unit, qty floored to 1", () => {
    expect(lineTotalCents({ quantity: 3, unitPriceCents: 5000 })).toBe(15000);
    expect(lineTotalCents({ quantity: 0, unitPriceCents: 5000 })).toBe(5000);
  });
  it("subtotal sums all lines", () => {
    expect(quoteSubtotalCents([{ quantity: 2, unitPriceCents: 1000 }, { quantity: 1, unitPriceCents: 3000 }])).toBe(5000);
  });
});

describe("quoteNumberLabel", () => {
  it("zero-pads to 4 digits", () => {
    expect(quoteNumberLabel(7)).toBe("Q-0007");
    expect(quoteNumberLabel(1234)).toBe("Q-1234");
  });
});

describe("nextQuoteActions", () => {
  it("draft can send/accept/edit", () => {
    expect(nextQuoteActions("DRAFT")).toEqual(["send", "accept", "edit"]);
  });
  it("sent can accept/decline/edit", () => {
    expect(nextQuoteActions("SENT")).toEqual(["accept", "decline", "edit"]);
  });
  it("accepted is locked", () => {
    expect(nextQuoteActions("ACCEPTED")).toEqual([]);
  });
});
