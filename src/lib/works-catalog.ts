/**
 * Pure Works logic — no prisma, client-safe & unit-testable. A Work is a piece
 * of service/work delivered under a client; for reseller clients each work can
 * name its own end-customer. Statuses + money formatting.
 */

export const WORK_STATUSES = ["LEAD", "ACTIVE", "DELIVERED", "CLOSED"] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const workStatusMeta: Record<WorkStatus, { label: string; color: string; bg: string }> = {
  LEAD: { label: "Lead", color: "#5C3AAE", bg: "#EFEBFB" },
  ACTIVE: { label: "Active", color: "#0758C9", bg: "#E7F0FD" },
  DELIVERED: { label: "Delivered", color: "#9A6711", bg: "#FFF1D5" },
  CLOSED: { label: "Closed", color: "#087B54", bg: "#E7F8EF" },
};

export function isWorkStatus(v: unknown): v is WorkStatus {
  return typeof v === "string" && (WORK_STATUSES as readonly string[]).includes(v);
}

export const CLIENT_TYPES = ["DIRECT", "RESELLER"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export function isClientType(v: unknown): v is ClientType {
  return typeof v === "string" && (CLIENT_TYPES as readonly string[]).includes(v);
}

export function formatWorkAmount(amountCents: number | null | undefined, currency = "AED"): string | null {
  if (amountCents == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountCents / 100);
}

// Sum the amounts of the given works (nulls ignored). Used for a client total.
export function worksTotalCents(works: Array<{ amountCents: number | null }>): number {
  return works.reduce((sum, w) => sum + (w.amountCents ?? 0), 0);
}

// Total = quantity × per-unit cents. Null when there is no unit figure. Quantity
// falls back to 1 and never goes below 1. Used for both revenue (unit price) and
// cost (unit cost).
export function computeAmountCents(quantity: number | null | undefined, unitCents: number | null | undefined): number | null {
  if (unitCents == null) return null;
  const qty = Math.max(1, Math.round(quantity ?? 1));
  return qty * Math.max(0, Math.round(unitCents));
}

// Labor cost = hours × hourly rate. 0 when either is missing.
export function laborCostCents(laborHours: number | null | undefined, hourlyRateCents: number | null | undefined): number {
  if (laborHours == null || hourlyRateCents == null) return 0;
  return Math.max(0, Math.round(laborHours * hourlyRateCents));
}

export type CostParts = {
  quantity?: number | null;
  unitCostCents?: number | null; // per-unit vendor cost
  laborHours?: number | null;
  hourlyRateCents?: number | null;
  operationalCents?: number | null;
  hostingCents?: number | null;
};

// Grand total cost = vendor (qty × unit cost) + labor (hours × rate) +
// operational + hosting. Returns null only when NO cost component was given at
// all (so "no cost" stays distinct from a real zero).
export function computeCostCents(p: CostParts): number | null {
  const anyGiven =
    p.unitCostCents != null || p.hourlyRateCents != null || p.laborHours != null ||
    p.operationalCents != null || p.hostingCents != null;
  if (!anyGiven) return null;
  const vendor = computeAmountCents(p.quantity, p.unitCostCents) ?? 0;
  const labor = laborCostCents(p.laborHours, p.hourlyRateCents);
  const ops = Math.max(0, Math.round(p.operationalCents ?? 0));
  const host = Math.max(0, Math.round(p.hostingCents ?? 0));
  return vendor + labor + ops + host;
}

// Profit = revenue − cost. Cost missing counts as 0, so profit falls back to the
// full amount. Null only when there's no revenue at all.
export function computeProfitCents(amountCents: number | null | undefined, costCents: number | null | undefined): number | null {
  if (amountCents == null) return null;
  return amountCents - (costCents ?? 0);
}
