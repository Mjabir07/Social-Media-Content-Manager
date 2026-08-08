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

// Total = quantity × unit price. Null when there is no unit price. Quantity
// falls back to 1 and never goes below 1.
export function computeAmountCents(quantity: number | null | undefined, unitPriceCents: number | null | undefined): number | null {
  if (unitPriceCents == null) return null;
  const qty = Math.max(1, Math.round(quantity ?? 1));
  return qty * Math.max(0, Math.round(unitPriceCents));
}
