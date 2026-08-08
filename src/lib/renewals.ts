import { prisma } from "@/lib/db";
import { createNotifications } from "@/lib/notifications";
import { createTransaction } from "@/lib/finance";
import {
  computeRenewalReminders,
  renewalMessage,
  daysUntil,
  serviceStage,
  serviceRenewalMessage,
  type RenewalItem,
  type RenewalReminder,
  type ServiceStage,
} from "@/lib/renewals-core";

export * from "@/lib/renewals-core";

const RENEWAL_ACTION = "infra.renewal";
const SERVICE_ACTION = "renewal.service";

// Gather every dated infra record in a workspace as generic renewal items.
async function collectRenewalItems(workspaceId: string): Promise<RenewalItem[]> {
  const [domains, hosting, email] = await Promise.all([
    prisma.domainRecord.findMany({
      where: { workspaceId, autoRenew: false, expiryDate: { not: null } },
      select: { id: true, domainName: true, expiryDate: true, company: { select: { name: true } } },
    }),
    prisma.hostingRecord.findMany({
      where: { workspaceId, renewalDate: { not: null } },
      select: { id: true, provider: true, planDetails: true, renewalDate: true, company: { select: { name: true } } },
    }),
    prisma.emailServiceRecord.findMany({
      where: { workspaceId, renewalDate: { not: null } },
      select: { id: true, provider: true, renewalDate: true, company: { select: { name: true } } },
    }),
  ]);

  return [
    ...domains.map((d): RenewalItem => ({ kind: "domain", id: d.id, label: d.domainName, companyName: d.company?.name ?? null, expiryDate: d.expiryDate })),
    ...hosting.map((h): RenewalItem => ({ kind: "hosting", id: h.id, label: h.planDetails ? `${h.provider} · ${h.planDetails}` : h.provider, companyName: h.company?.name ?? null, expiryDate: h.renewalDate })),
    ...email.map((e): RenewalItem => ({ kind: "email", id: e.id, label: e.provider, companyName: e.company?.name ?? null, expiryDate: e.renewalDate })),
  ];
}

// Read-only preview of what's coming up for renewal (used by UI / reports).
export async function getUpcomingRenewals(workspaceId: string): Promise<RenewalReminder[]> {
  const items = await collectRenewalItems(workspaceId);
  return computeRenewalReminders(items, new Date());
}

// System actor for notifications that originate from the scheduler, not a user.
function systemActor(workspaceId: string) {
  return { id: "system", name: "AZMIN AI", avatarColor: "#5C3AAE", workspaceId };
}

async function ownerAdminIds(workspaceId: string): Promise<string[]> {
  const rows = await prisma.membership.findMany({ where: { workspaceId, role: { in: ["OWNER", "ADMIN"] } }, select: { userId: true } });
  return rows.map((r) => r.userId);
}

// Has this exact record+bucket reminder already been sent? Dedups the daily scan
// so a record only pings once per bucket (targetLabel holds the bucket).
async function alreadyReminded(workspaceId: string, action: string, targetId: string, bucket: string): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: { workspaceId, action, targetId, targetLabel: bucket },
    select: { id: true },
  });
  return existing !== null;
}

export type RenewalScanResult = { workspaces: number; reminders: number };

// Scan every workspace for due renewals and notify owners/admins. Idempotent
// per (record, bucket): safe to run daily. Never throws for one bad workspace.
export async function runRenewalReminders(now: Date = new Date()): Promise<RenewalScanResult> {
  const workspaces = await prisma.workspace.findMany({ select: { id: true } });
  let reminders = 0;

  for (const { id: workspaceId } of workspaces) {
    try {
      const items = await collectRenewalItems(workspaceId);
      const due = computeRenewalReminders(items, now);
      if (due.length === 0) continue;

      const recipients = await ownerAdminIds(workspaceId);
      if (recipients.length === 0) continue;

      for (const r of due) {
        if (await alreadyReminded(workspaceId, RENEWAL_ACTION, r.id, r.bucket)) continue;
        await createNotifications(systemActor(workspaceId), recipients, {
          action: RENEWAL_ACTION,
          message: renewalMessage(r),
          targetType: r.kind,
          targetId: r.id,
          targetLabel: r.bucket,
        });
        reminders += 1;
      }
    } catch (err) {
      console.error(`runRenewalReminders failed for workspace ${workspaceId}`, err);
    }
  }

  return { workspaces: workspaces.length, reminders };
}

// ---------------------------------------------------------------------------
// Service renewals (standalone Renewal model) — CRUD + the invoice/reminder scan.
// ---------------------------------------------------------------------------

export type ServiceRenewalInput = {
  service: string;
  clientName: string;
  clientEmail?: string | null;
  amountCents?: number | null;
  costCents?: number | null;
  vendor?: string | null;
  currency?: string;
  renewalDate: string | Date;
  notes?: string | null;
  clientId?: string | null;
};

export type ServiceRenewalDTO = {
  id: string;
  service: string;
  clientName: string;
  clientEmail: string | null;
  amountCents: number | null;
  costCents: number | null;
  vendor: string | null;
  currency: string;
  renewalDate: Date;
  status: string;
  notes: string | null;
  daysLeft: number;
  stage: ServiceStage | null;
};

function toDTO(r: { id: string; service: string; clientName: string; clientEmail: string | null; amountCents: number | null; costCents: number | null; vendor: string | null; currency: string; renewalDate: Date; status: string; notes: string | null }, now: Date): ServiceRenewalDTO {
  const daysLeft = daysUntil(r.renewalDate, now);
  return { ...r, daysLeft, stage: r.status === "ACTIVE" ? serviceStage(daysLeft) : null };
}

export async function getServiceRenewals(workspaceId: string, clientId?: string): Promise<ServiceRenewalDTO[]> {
  const now = new Date();
  const rows = await prisma.renewal.findMany({
    where: { workspaceId, deletedAt: null, ...(clientId !== undefined ? { clientId } : {}) },
    orderBy: [{ renewalDate: "asc" }],
  });
  return rows.map((r) => toDTO(r, now));
}

function normalizeDate(d: string | Date): Date {
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function createServiceRenewal(workspaceId: string, createdById: string | null, input: ServiceRenewalInput) {
  return prisma.renewal.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      clientId: input.clientId ?? null,
      service: input.service.trim(),
      clientName: input.clientName.trim(),
      clientEmail: input.clientEmail?.trim() || null,
      amountCents: input.amountCents ?? null,
      costCents: input.costCents ?? null,
      vendor: input.vendor?.trim() || null,
      currency: input.currency ?? "AED",
      renewalDate: normalizeDate(input.renewalDate),
      notes: input.notes?.trim() || null,
    },
  });
}

export async function updateServiceRenewal(workspaceId: string, id: string, patch: Partial<ServiceRenewalInput> & { status?: string }) {
  const data: Record<string, unknown> = {};
  if (patch.service !== undefined) data.service = patch.service.trim();
  if (patch.clientName !== undefined) data.clientName = patch.clientName.trim();
  if (patch.clientEmail !== undefined) data.clientEmail = patch.clientEmail?.trim() || null;
  if (patch.amountCents !== undefined) data.amountCents = patch.amountCents ?? null;
  if (patch.costCents !== undefined) data.costCents = patch.costCents ?? null;
  if (patch.vendor !== undefined) data.vendor = patch.vendor?.trim() || null;
  if (patch.currency !== undefined) data.currency = patch.currency;
  if (patch.renewalDate !== undefined) data.renewalDate = normalizeDate(patch.renewalDate);
  if (patch.notes !== undefined) data.notes = patch.notes?.trim() || null;
  if (patch.status !== undefined) data.status = patch.status;
  const result = await prisma.renewal.updateMany({ where: { id, workspaceId, deletedAt: null }, data });
  return result.count;
}

// Mark a renewal paid/renewed: roll the date forward one year, reset the reminder
// ladder (drop past notifications), and AUTO-POST finance — income for what you
// charged the client and expense for what you paid the vendor. Profit falls out
// of the two entries (the Google case). Amounts only posted when present.
export async function markRenewed(workspaceId: string, id: string, createdById: string | null = null) {
  const row = await prisma.renewal.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!row) return 0;
  const paidOn = new Date(row.renewalDate); // the cycle just closed = the old date
  const next = new Date(row.renewalDate);
  next.setFullYear(next.getFullYear() + 1);
  await prisma.renewal.updateMany({ where: { id, workspaceId }, data: { renewalDate: next, status: "ACTIVE" } });
  await prisma.notification.deleteMany({ where: { workspaceId, action: SERVICE_ACTION, targetId: id } });

  if (row.amountCents && row.amountCents > 0) {
    await createTransaction(workspaceId, createdById, {
      type: "INCOME", amountCents: row.amountCents, currency: row.currency, category: "RENEWAL",
      clientId: row.clientId, renewalId: row.id, vendor: row.clientName,
      description: `${row.service} renewal — ${row.clientName}`, date: paidOn, status: "PAID",
    });
  }
  if (row.costCents && row.costCents > 0) {
    await createTransaction(workspaceId, createdById, {
      type: "EXPENSE", amountCents: row.costCents, currency: row.currency, category: "EMAIL_LICENSE",
      clientId: row.clientId, renewalId: row.id, vendor: row.vendor ?? row.service,
      description: `${row.service} vendor cost — ${row.clientName}`, date: paidOn, status: "PAID",
    });
  }
  return 1;
}

export async function deleteServiceRenewal(workspaceId: string, id: string) {
  const result = await prisma.renewal.updateMany({ where: { id, workspaceId, deletedAt: null }, data: { deletedAt: new Date() } });
  return result.count;
}

// Scan ACTIVE service renewals across all workspaces and notify owners/admins at
// each stage (invoice/15d/7d/1d/overdue). Deduped per (renewal, stage).
export async function runServiceRenewalReminders(now: Date = new Date()): Promise<RenewalScanResult> {
  const workspaces = await prisma.workspace.findMany({ select: { id: true } });
  let reminders = 0;

  for (const { id: workspaceId } of workspaces) {
    try {
      const rows = await prisma.renewal.findMany({ where: { workspaceId, status: "ACTIVE", deletedAt: null } });
      if (rows.length === 0) continue;

      const recipients = await ownerAdminIds(workspaceId);
      if (recipients.length === 0) continue;

      for (const r of rows) {
        const daysLeft = daysUntil(r.renewalDate, now);
        const stage = serviceStage(daysLeft);
        if (!stage) continue;
        if (await alreadyReminded(workspaceId, SERVICE_ACTION, r.id, stage)) continue;
        await createNotifications(systemActor(workspaceId), recipients, {
          action: SERVICE_ACTION,
          message: serviceRenewalMessage(r, daysLeft, stage),
          targetType: "renewal",
          targetId: r.id,
          targetLabel: stage,
        });
        reminders += 1;
      }
    } catch (err) {
      console.error(`runServiceRenewalReminders failed for workspace ${workspaceId}`, err);
    }
  }

  return { workspaces: workspaces.length, reminders };
}
