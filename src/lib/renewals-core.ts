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

// ---------------------------------------------------------------------------
// Service renewals (standalone Renewal model). Its own reminder ladder, separate
// from the infra buckets above: invoice at -30d, nudge -15d & -7d, final -1d.
// ---------------------------------------------------------------------------

// Ordered most-urgent last. "invoice" is the -30d stage where you raise the bill.
export const SERVICE_STAGES = ["overdue", "1d", "7d", "15d", "invoice"] as const;
export type ServiceStage = (typeof SERVICE_STAGES)[number];

// Which stage a service renewal is in, or null if further out than 30 days.
export function serviceStage(daysLeft: number): ServiceStage | null {
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 1) return "1d";
  if (daysLeft <= 7) return "7d";
  if (daysLeft <= 15) return "15d";
  if (daysLeft <= 30) return "invoice";
  return null;
}

export function formatAmount(amountCents: number | null | undefined, currency = "AED"): string | null {
  if (amountCents == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountCents / 100);
}

export type ServiceRenewalLike = {
  service: string;
  clientName: string;
  amountCents: number | null;
  currency: string;
  renewalDate: Date | string;
};

// Pre-rendered notification message for a service-renewal stage.
export function serviceRenewalMessage(r: ServiceRenewalLike, daysLeft: number, stage: ServiceStage): string {
  const amt = formatAmount(r.amountCents, r.currency);
  const tail = amt ? ` — ${amt}` : "";
  const subject = `${r.service} for ${r.clientName}`;
  if (stage === "invoice") return `Send renewal invoice: ${subject} renews in ${daysLeft} days${tail}`;
  if (stage === "overdue") return `OVERDUE: ${subject} renewal date has passed${tail}`;
  if (daysLeft === 0) return `Final reminder: ${subject} renews today${tail}`;
  if (daysLeft === 1) return `Final reminder: ${subject} renews tomorrow${tail}`;
  return `Reminder: ${subject} renews in ${daysLeft} days${tail}`;
}

// A professional invoice/reminder email pre-filled from a renewal. Pure text so
// it's testable and client-safe; the UI adds copy / mailto around it.
export function buildInvoiceEmail(input: {
  service: string;
  clientName: string;
  renewalDate: Date | string;
  amountCents?: number | null;
  currency?: string;
  fromName?: string;
  fromEmail?: string;
}): { subject: string; body: string } {
  const dateStr = new Date(input.renewalDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const amt = formatAmount(input.amountCents ?? null, input.currency ?? "AED");
  const from = input.fromName ?? "Azmin Digital";
  const fromEmail = input.fromEmail ?? "it@azmindigital.com";
  const subject = `${input.service} renewal — invoice for ${input.clientName} (due ${dateStr})`;
  const amountLine = amt ? `\n- Amount: ${amt}` : "";
  const body = `Hi ${input.clientName},

Your ${input.service} subscription is due for its yearly renewal on ${dateStr}.

Please find the renewal details below:
- Service: ${input.service}${amountLine}
- Renewal date: ${dateStr}

Kindly settle the invoice before the renewal date so your service continues without any interruption. Once payment is confirmed, I'll process the renewal and confirm back.

Any questions, just reply to this email.

Best regards,
${from}
${fromEmail}`;
  return { subject, body };
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
