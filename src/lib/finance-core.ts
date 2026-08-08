/**
 * Pure finance logic — no prisma, client-safe & unit-testable. Categories,
 * money formatting, and the roll-ups that turn a list of transactions into a
 * profit/loss summary, per-category totals, and per-client P&L.
 */

export const TX_TYPES = ["INCOME", "EXPENSE"] as const;
export type TxType = (typeof TX_TYPES)[number];

export const INCOME_CATEGORIES = ["RENEWAL", "SERVICE", "PROJECT", "RETAINER", "OTHER_INCOME"] as const;
export const EXPENSE_CATEGORIES = ["SERVER", "EMAIL_LICENSE", "DOMAIN", "SOFTWARE", "VENDOR", "ADS", "SALARY", "OTHER_EXPENSE"] as const;

export const TX_STATUSES = ["PAID", "PENDING"] as const;
export type TxStatus = (typeof TX_STATUSES)[number];

export const categoryLabels: Record<string, string> = {
  RENEWAL: "Renewal", SERVICE: "Service", PROJECT: "Project", RETAINER: "Retainer", OTHER_INCOME: "Other income",
  SERVER: "Server / Hosting", EMAIL_LICENSE: "Email license", DOMAIN: "Domain", SOFTWARE: "Software / SaaS",
  VENDOR: "Vendor payment", ADS: "Ads", SALARY: "Salary / Payout", OTHER_EXPENSE: "Other expense",
};

export function categoriesFor(type: TxType): readonly string[] {
  return type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function isTxType(v: unknown): v is TxType {
  return typeof v === "string" && (TX_TYPES as readonly string[]).includes(v);
}
export function isTxStatus(v: unknown): v is TxStatus {
  return typeof v === "string" && (TX_STATUSES as readonly string[]).includes(v);
}

export function formatMoney(cents: number, currency = "AED"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export type TxLike = {
  type: TxType;
  amountCents: number;
  status: TxStatus;
  category: string;
  clientId?: string | null;
};

export type FinanceSummary = {
  incomeCents: number; // PAID income
  expenseCents: number; // PAID expense
  netCents: number; // income − expense (PAID)
  pendingIncomeCents: number;
  pendingExpenseCents: number;
  count: number;
};

// Roll a transaction list into headline totals. Only PAID rows count toward
// realized income/expense/net; PENDING rows are surfaced separately.
export function computeSummary(txns: TxLike[]): FinanceSummary {
  const s: FinanceSummary = { incomeCents: 0, expenseCents: 0, netCents: 0, pendingIncomeCents: 0, pendingExpenseCents: 0, count: txns.length };
  for (const t of txns) {
    if (t.status === "PENDING") {
      if (t.type === "INCOME") s.pendingIncomeCents += t.amountCents;
      else s.pendingExpenseCents += t.amountCents;
      continue;
    }
    if (t.type === "INCOME") s.incomeCents += t.amountCents;
    else s.expenseCents += t.amountCents;
  }
  s.netCents = s.incomeCents - s.expenseCents;
  return s;
}

export type CategoryTotal = { category: string; label: string; type: TxType; totalCents: number };

// PAID totals per category, biggest first.
export function byCategory(txns: TxLike[]): CategoryTotal[] {
  const map = new Map<string, CategoryTotal>();
  for (const t of txns) {
    if (t.status !== "PAID") continue;
    const cur = map.get(t.category) ?? { category: t.category, label: categoryLabels[t.category] ?? t.category, type: t.type, totalCents: 0 };
    cur.totalCents += t.amountCents;
    map.set(t.category, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.totalCents - a.totalCents);
}

export type MonthTotal = { month: string; label: string; incomeCents: number; expenseCents: number; netCents: number };

// PAID totals per calendar month (YYYY-MM), oldest→newest. `date` is ISO/Date.
export function byMonth(txns: Array<TxLike & { date: string | Date }>): MonthTotal[] {
  const map = new Map<string, MonthTotal>();
  for (const t of txns) {
    if (t.status !== "PAID") continue;
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) continue;
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
    const cur = map.get(month) ?? { month, label, incomeCents: 0, expenseCents: 0, netCents: 0 };
    if (t.type === "INCOME") cur.incomeCents += t.amountCents;
    else cur.expenseCents += t.amountCents;
    cur.netCents = cur.incomeCents - cur.expenseCents;
    map.set(month, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export type ClientPnL = { clientId: string; incomeCents: number; expenseCents: number; netCents: number };

// Per-client profit/loss (PAID). Unassigned transactions (no clientId) are skipped.
export function byClient(txns: TxLike[]): ClientPnL[] {
  const map = new Map<string, ClientPnL>();
  for (const t of txns) {
    if (t.status !== "PAID" || !t.clientId) continue;
    const cur = map.get(t.clientId) ?? { clientId: t.clientId, incomeCents: 0, expenseCents: 0, netCents: 0 };
    if (t.type === "INCOME") cur.incomeCents += t.amountCents;
    else cur.expenseCents += t.amountCents;
    cur.netCents = cur.incomeCents - cur.expenseCents;
    map.set(t.clientId, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.netCents - a.netCents);
}
