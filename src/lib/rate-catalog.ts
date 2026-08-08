/**
 * Pure hourly-cost-rate logic — no prisma, client-safe & unit-testable.
 *
 * A freelancer's true hourly cost is what they must cover (business overhead +
 * the pay they want to take home) spread over the hours they can actually bill:
 *
 *   billable hours = workingHoursPerMonth × (billablePercent / 100)
 *   hourly rate    = (monthlyOverhead + monthlyPayTarget) / billable hours
 *
 * Not every worked hour is billable (admin, sales, learning), so utilization
 * matters — 100 worked hours at 60% is 60 billable hours.
 */

export const DEFAULT_WORKING_HOURS = 160; // ~ full-time month
export const DEFAULT_BILLABLE_PERCENT = 60; // realistic freelancer utilization

export type RateSettings = {
  currency: string;
  monthlyOverheadCents: number | null;
  monthlyPayTargetCents: number | null;
  workingHoursPerMonth: number | null;
  billablePercent: number | null;
  hourlyRateCents: number | null;
};

export type RateInputs = {
  monthlyOverheadCents?: number | null;
  monthlyPayTargetCents?: number | null;
  workingHoursPerMonth?: number | null;
  billablePercent?: number | null;
};

// Billable hours per month from working hours × utilization. Falls back to the
// defaults; never returns 0 (so we don't divide by zero).
export function billableHours(workingHoursPerMonth?: number | null, billablePercent?: number | null): number {
  const hours = workingHoursPerMonth && workingHoursPerMonth > 0 ? workingHoursPerMonth : DEFAULT_WORKING_HOURS;
  const pctRaw = billablePercent == null ? DEFAULT_BILLABLE_PERCENT : billablePercent;
  const pct = Math.min(100, Math.max(1, pctRaw));
  return (hours * pct) / 100;
}

// Computed hourly cost rate in cents (rounded). Null when there's nothing to
// cover (no overhead and no pay target).
export function computeHourlyRateCents(input: RateInputs): number | null {
  const cover = (input.monthlyOverheadCents ?? 0) + (input.monthlyPayTargetCents ?? 0);
  if (cover <= 0) return null;
  const hrs = billableHours(input.workingHoursPerMonth, input.billablePercent);
  if (hrs <= 0) return null;
  return Math.round(cover / hrs);
}
