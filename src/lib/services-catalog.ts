/**
 * Pure (no-database) service catalogue helpers — safe to import from client
 * components. Database CRUD lives in "@/lib/services", which re-exports these.
 */

export const PRICING_MODELS = ["FIXED", "HOURLY", "RETAINER", "PROJECT", "CUSTOM"] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const pricingModelLabels: Record<PricingModel, string> = {
  FIXED: "Fixed price",
  HOURLY: "Hourly rate",
  RETAINER: "Monthly retainer",
  PROJECT: "Per project",
  CUSTOM: "Custom / quote",
};

export function isPricingModel(value: unknown): value is PricingModel {
  return typeof value === "string" && (PRICING_MODELS as readonly string[]).includes(value);
}

// Format a stored price for display. null cents -> a custom-quote label.
export function formatServicePrice(priceCents: number | null | undefined, currency = "AED", unit?: string | null): string {
  if (priceCents === null || priceCents === undefined) return "Custom quote";
  const amount = (priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${currency} ${amount}${unit ? ` ${unit}` : ""}`;
}

export type ServiceInput = {
  name: string;
  category: string;
  description?: string | null;
  pricingModel: PricingModel;
  priceCents?: number | null;
  currency?: string;
  unit?: string | null;
  companyId?: string | null;
};
