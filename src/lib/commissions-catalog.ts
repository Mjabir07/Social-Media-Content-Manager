/**
 * Pure commission math (no database) — safe for client components. All money is
 * in minor units (cents) and rates in basis points (1000 = 10%) so every
 * calculation is integer-exact with no floating-point drift.
 */

export const COMMISSION_TYPES = ["PERCENT", "FLAT"] as const;
export type CommissionType = (typeof COMMISSION_TYPES)[number];

export type CommissionTerms = {
  commissionType: string;
  commissionRateBps: number;
  commissionFlatCents?: number | null;
};

export function isCommissionType(v: unknown): v is CommissionType {
  return typeof v === "string" && (COMMISSION_TYPES as readonly string[]).includes(v);
}

// Commission owed on a single closed deal.
export function commissionOwed(terms: CommissionTerms, dealValueCents: number | null | undefined): number {
  if (terms.commissionType === "FLAT") return Math.max(0, terms.commissionFlatCents ?? 0);
  const value = dealValueCents ?? 0;
  return Math.max(0, Math.round((value * (terms.commissionRateBps ?? 0)) / 10000));
}

export type Settlement = { earnedCents: number; paidCents: number; outstandingCents: number };

// Earned − paid = outstanding (never negative; overpayment shows as 0 owing).
export function settlement(earnedCents: number, paidCents: number): Settlement {
  return { earnedCents, paidCents, outstandingCents: Math.max(0, earnedCents - paidCents) };
}

export function formatRate(terms: CommissionTerms, currency = "AED"): string {
  if (terms.commissionType === "FLAT") return `${currency} ${((terms.commissionFlatCents ?? 0) / 100).toLocaleString()} flat`;
  return `${(terms.commissionRateBps / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

export function formatMoney(cents: number, currency = "AED"): string {
  return `${currency} ${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
