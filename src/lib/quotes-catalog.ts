/**
 * Pure quotation logic — no prisma, client-safe & unit-testable. Statuses, line
 * math, and the small state machine (which actions a quote allows next).
 */

export const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "DECLINED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const quoteStatusMeta: Record<QuoteStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Draft", color: "#5A7189", bg: "#EDF1F6" },
  SENT: { label: "Sent", color: "#0758C9", bg: "#E7F0FD" },
  ACCEPTED: { label: "Accepted", color: "#087B54", bg: "#E7F8EF" },
  DECLINED: { label: "Declined", color: "#B4231C", bg: "#FDECEC" },
};

export function isQuoteStatus(v: unknown): v is QuoteStatus {
  return typeof v === "string" && (QUOTE_STATUSES as readonly string[]).includes(v);
}

export type QuoteLineLike = { quantity: number; unitPriceCents: number };

export function lineTotalCents(line: QuoteLineLike): number {
  return Math.max(1, Math.round(line.quantity || 1)) * Math.max(0, Math.round(line.unitPriceCents || 0));
}

export function quoteSubtotalCents(lines: QuoteLineLike[]): number {
  return lines.reduce((sum, l) => sum + lineTotalCents(l), 0);
}

export function formatQuoteMoney(cents: number | null | undefined, currency = "AED"): string | null {
  if (cents == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

// e.g. 7 → "Q-0007"
export function quoteNumberLabel(n: number): string {
  return `Q-${String(n).padStart(4, "0")}`;
}

// Which lifecycle actions a quote allows next, given its status.
export type QuoteAction = "send" | "accept" | "decline" | "edit";

export function nextQuoteActions(status: QuoteStatus): QuoteAction[] {
  switch (status) {
    case "DRAFT":
      return ["send", "accept", "edit"];
    case "SENT":
      return ["accept", "decline", "edit"];
    case "ACCEPTED":
      return [];
    case "DECLINED":
      return ["send", "edit"];
  }
}
