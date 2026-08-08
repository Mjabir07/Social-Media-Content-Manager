import { describe, expect, it } from "vitest";
import {
  isTxType, isTxStatus, categoriesFor, formatMoney,
  computeSummary, byCategory, byClient,
  type TxLike,
} from "@/lib/finance-core";

const tx = (o: Partial<TxLike>): TxLike => ({ type: "INCOME", amountCents: 0, status: "PAID", category: "OTHER_INCOME", clientId: null, ...o });

describe("guards & helpers", () => {
  it("validates type and status", () => {
    expect(isTxType("INCOME")).toBe(true);
    expect(isTxType("REFUND")).toBe(false);
    expect(isTxStatus("PENDING")).toBe(true);
    expect(isTxStatus("VOID")).toBe(false);
  });
  it("gives the right categories per type", () => {
    expect(categoriesFor("INCOME")).toContain("RENEWAL");
    expect(categoriesFor("EXPENSE")).toContain("EMAIL_LICENSE");
  });
  it("formats money from cents", () => {
    expect(formatMoney(120000, "AED")).toContain("1,200");
  });
});

describe("computeSummary", () => {
  it("nets PAID income minus PAID expense, keeps PENDING separate", () => {
    const s = computeSummary([
      tx({ type: "INCOME", amountCents: 120000 }),
      tx({ type: "EXPENSE", amountCents: 90000, category: "EMAIL_LICENSE" }),
      tx({ type: "INCOME", amountCents: 50000, status: "PENDING" }),
      tx({ type: "EXPENSE", amountCents: 10000, status: "PENDING", category: "SERVER" }),
    ]);
    expect(s.incomeCents).toBe(120000);
    expect(s.expenseCents).toBe(90000);
    expect(s.netCents).toBe(30000); // the Google case: 1200 in − 900 out = 300 profit
    expect(s.pendingIncomeCents).toBe(50000);
    expect(s.pendingExpenseCents).toBe(10000);
    expect(s.count).toBe(4);
  });
  it("can go negative (loss)", () => {
    expect(computeSummary([tx({ type: "EXPENSE", amountCents: 5000, category: "SERVER" })]).netCents).toBe(-5000);
  });
});

describe("byCategory", () => {
  it("sums PAID rows per category, biggest first, ignores pending", () => {
    const rows = byCategory([
      tx({ category: "RENEWAL", amountCents: 100 }),
      tx({ category: "RENEWAL", amountCents: 300 }),
      tx({ type: "EXPENSE", category: "SERVER", amountCents: 500 }),
      tx({ category: "RENEWAL", amountCents: 999, status: "PENDING" }),
    ]);
    expect(rows[0]).toMatchObject({ category: "SERVER", totalCents: 500 });
    expect(rows.find((r) => r.category === "RENEWAL")!.totalCents).toBe(400);
  });
});

describe("byClient", () => {
  it("computes per-client P&L for PAID rows only, sorted by net", () => {
    const rows = byClient([
      tx({ clientId: "a", type: "INCOME", amountCents: 1000 }),
      tx({ clientId: "a", type: "EXPENSE", amountCents: 400, category: "SERVER" }),
      tx({ clientId: "b", type: "INCOME", amountCents: 200 }),
      tx({ clientId: null, type: "INCOME", amountCents: 9999 }),
    ]);
    expect(rows.map((r) => r.clientId)).toEqual(["a", "b"]);
    expect(rows[0]).toMatchObject({ clientId: "a", incomeCents: 1000, expenseCents: 400, netCents: 600 });
  });
});
