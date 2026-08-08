import { prisma } from "@/lib/db";
import { createNotifications } from "@/lib/notifications";
import { daysUntil } from "@/lib/renewals-core";
import { formatMoney } from "@/lib/finance-core";

/**
 * Weekly owner digest — one notification summarising the state of the business:
 * renewals due, unpaid invoices, this month's net profit, and overdue tasks.
 * Deduped per ISO week so it fires once even though the daily cron calls it.
 */

const DIGEST_ACTION = "digest.weekly";

// Monday (UTC) of the week containing `now`, as YYYY-MM-DD — the dedup key.
function weekKey(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diff = (d.getUTCDay() + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

function systemActor(workspaceId: string) {
  return { id: "system", name: "AZMIN AI", avatarColor: "#5C3AAE", workspaceId };
}

async function ownerAdminIds(workspaceId: string): Promise<string[]> {
  const rows = await prisma.membership.findMany({ where: { workspaceId, role: { in: ["OWNER", "ADMIN"] } }, select: { userId: true } });
  return rows.map((r) => r.userId);
}

export type DigestResult = { workspaces: number; sent: number };

export async function runWeeklyDigest(now: Date = new Date()): Promise<DigestResult> {
  const key = weekKey(now);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const workspaces = await prisma.workspace.findMany({ select: { id: true } });
  let sent = 0;

  for (const { id: workspaceId } of workspaces) {
    try {
      // Already sent this week? skip.
      const existing = await prisma.notification.findFirst({ where: { workspaceId, action: DIGEST_ACTION, targetLabel: key }, select: { id: true } });
      if (existing) continue;

      const [renewals, pendingIncome, monthTx, overdueTasks] = await Promise.all([
        prisma.renewal.findMany({ where: { workspaceId, status: "ACTIVE", deletedAt: null }, select: { renewalDate: true } }),
        prisma.transaction.aggregate({ _sum: { amountCents: true }, where: { workspaceId, deletedAt: null, type: "INCOME", status: "PENDING" } }),
        prisma.transaction.findMany({ where: { workspaceId, deletedAt: null, status: "PAID", date: { gte: monthStart } }, select: { type: true, amountCents: true, currency: true } }),
        prisma.task.count({ where: { workspaceId, deletedAt: null, status: { not: "DONE" }, dueDate: { lt: now } } }),
      ]);

      let dueSoon = 0, overdue = 0;
      for (const r of renewals) {
        const d = daysUntil(r.renewalDate, now);
        if (d < 0) overdue += 1;
        else if (d <= 30) dueSoon += 1;
      }

      let netCents = 0;
      for (const t of monthTx) netCents += t.type === "INCOME" ? t.amountCents : -t.amountCents;
      const currency = monthTx[0]?.currency ?? "AED";
      const unpaidCents = pendingIncome._sum.amountCents ?? 0;

      // Nothing worth pinging about? skip (keeps the digest signal-only).
      if (dueSoon === 0 && overdue === 0 && unpaidCents === 0 && netCents === 0 && overdueTasks === 0) continue;

      const parts = [
        `${dueSoon} renewal${dueSoon === 1 ? "" : "s"} due in 30d`,
        ...(overdue ? [`${overdue} overdue`] : []),
        `${formatMoney(unpaidCents, currency)} unpaid`,
        `net this month ${formatMoney(netCents, currency)}`,
        ...(overdueTasks ? [`${overdueTasks} task${overdueTasks === 1 ? "" : "s"} overdue`] : []),
      ];
      const message = `Weekly digest — ${parts.join(" · ")}`;

      const recipients = await ownerAdminIds(workspaceId);
      if (recipients.length === 0) continue;
      await createNotifications(systemActor(workspaceId), recipients, { action: DIGEST_ACTION, message, targetType: "digest", targetLabel: key });
      sent += 1;
    } catch (err) {
      console.error(`runWeeklyDigest failed for workspace ${workspaceId}`, err);
    }
  }

  return { workspaces: workspaces.length, sent };
}
