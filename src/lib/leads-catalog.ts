/**
 * Pure lead helpers (no database) — safe for client components. Pipeline stages
 * and a transparent heuristic lead score that works with zero AI configured; a
 * richer AI summary layers on top when a provider is connected.
 */

export const LEAD_STAGES = ["NEW", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const stageMeta: Record<LeadStage, { label: string; color: string; open: boolean }> = {
  NEW: { label: "New", color: "#6EA8FF", open: true },
  QUALIFIED: { label: "Qualified", color: "#22D3EE", open: true },
  PROPOSAL: { label: "Proposal", color: "#F4B942", open: true },
  WON: { label: "Won", color: "#22C55E", open: false },
  LOST: { label: "Lost", color: "#94A3B8", open: false },
};

export function isLeadStage(v: unknown): v is LeadStage {
  return typeof v === "string" && (LEAD_STAGES as readonly string[]).includes(v);
}

export type LeadSignals = {
  email?: string | null;
  phone?: string | null;
  serviceId?: string | null;
  valueCents?: number | null;
  notes?: string | null;
};

// Transparent 0–100 heuristic: contact reachability + intent + deal size.
export function scoreLead(i: LeadSignals): number {
  let s = 15;
  if (i.email) s += 25;
  if (i.phone) s += 25;
  if (i.serviceId) s += 15;
  if (i.valueCents && i.valueCents > 0) s += 15;
  if (i.notes && i.notes.trim().length > 10) s += 5;
  return Math.min(100, s);
}

export function leadTemperature(score: number): "Hot" | "Warm" | "Cold" {
  return score >= 75 ? "Hot" : score >= 45 ? "Warm" : "Cold";
}

// Deterministic summary used when no AI provider is connected.
export function leadSummaryFallback(i: LeadSignals): string {
  const score = scoreLead(i);
  const contact = i.email && i.phone ? "full contact details" : i.email || i.phone ? "partial contact details" : "no contact details yet";
  const bits = [contact];
  if (i.serviceId) bits.push("a specific service in mind");
  if (i.valueCents && i.valueCents > 0) bits.push("an estimated deal value");
  return `${leadTemperature(score)} lead — ${bits.join(", ")}. Suggested next step: ${score >= 75 ? "reach out now while intent is high." : score >= 45 ? "follow up and confirm the requirement." : "gather contact details and qualify."}`;
}
