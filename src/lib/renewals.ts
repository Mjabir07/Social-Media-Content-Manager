import { prisma } from "@/lib/db";
import { createNotifications } from "@/lib/notifications";
import {
  computeRenewalReminders,
  renewalMessage,
  type RenewalItem,
  type RenewalReminder,
} from "@/lib/renewals-core";

export * from "@/lib/renewals-core";

const RENEWAL_ACTION = "infra.renewal";

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
async function alreadyReminded(workspaceId: string, targetId: string, bucket: string): Promise<boolean> {
  const existing = await prisma.notification.findFirst({
    where: { workspaceId, action: RENEWAL_ACTION, targetId, targetLabel: bucket },
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
        if (await alreadyReminded(workspaceId, r.id, r.bucket)) continue;
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
