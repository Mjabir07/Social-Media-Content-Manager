/**
 * Pure renewal-reminder logic (no prisma, client-safe & unit-testable).
 * Given dated infra items and "now", decide which ones deserve a reminder and
 * which threshold bucket they fall in. Buckets shrink as the date nears, so each
 * record fires at most once per bucket (the daily scan dedups on the bucket).
 */

export type RenewalKind = "domain" | "hosting" | "email";

export type RenewalItem = {
  kind: RenewalKind;
  id: string;
  label: string; // human name, e.g. "azmin.dev" or "Hetzner VPS"
  companyName?: string | null;
  expiryDate: Date | null;
};

// Bucket labels, ordered from most to least urgent. "overdue" means past expiry.
export const RENEWAL_BUCKETS = ["overdue", "1d", "7d", "14d", "30d"] as const;
export type RenewalBucket = (typeof RENEWAL_BUCKETS)[number];

export function daysUntil(date: Date, now: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  // Compare on calendar-day boundaries so "expires today" reads as 0, not -0.4.
  const a = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((a - b) / MS);
}

// Which reminder bucket a given days-left falls into, or null if too far out.
export function reminderBucket(daysLeft: number): RenewalBucket | null {
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 1) return "1d";
  if (daysLeft <= 7) return "7d";
  if (daysLeft <= 14) return "14d";
  if (daysLeft <= 30) return "30d";
  return null;
}

export type RenewalReminder = RenewalItem & { daysLeft: number; bucket: RenewalBucket };

// The reminders due right now, most urgent first. Items without a date, or too
// far out, are skipped.
export function computeRenewalReminders(items: RenewalItem[], now: Date): RenewalReminder[] {
  const out: RenewalReminder[] = [];
  for (const item of items) {
    if (!item.expiryDate) continue;
    const daysLeft = daysUntil(item.expiryDate, now);
    const bucket = reminderBucket(daysLeft);
    if (bucket) out.push({ ...item, daysLeft, bucket });
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

const KIND_NOUN: Record<RenewalKind, string> = { domain: "Domain", hosting: "Hosting", email: "Email service" };

// Pre-rendered notification message for a reminder.
export function renewalMessage(r: RenewalReminder): string {
  const noun = KIND_NOUN[r.kind];
  const who = r.companyName ? ` (${r.companyName})` : "";
  if (r.bucket === "overdue") return `${noun} "${r.label}"${who} has expired — renew now`;
  if (r.daysLeft === 0) return `${noun} "${r.label}"${who} expires today`;
  const day = r.daysLeft === 1 ? "day" : "days";
  return `${noun} "${r.label}"${who} expires in ${r.daysLeft} ${day}`;
}
