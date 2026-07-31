import { prisma } from "@/lib/db";

/**
 * Live Command Center stats — a workspace-scoped snapshot across the new modules
 * (leads, inbox, automations, connections, publishing) for the /azmin dashboard.
 * When a specific company is active, the company-tagged modules narrow to it
 * (shared, company-less items still count). Inbox is workspace-wide (incoming
 * conversations are not company-tagged yet).
 */
export type CommandStats = {
  scope: "workspace" | "company";
  openLeads: number;
  wonCount: number;
  wonValueCents: number;
  unreadMessages: number;
  openConversations: number;
  activeAutomations: number;
  connections: number;
  publishedPosts: number;
  scheduledPosts: number;
  services: number;
};

export async function getCommandStats(workspaceId: string, companyId?: string): Promise<CommandStats> {
  // Own-only filter (leads, posts) and shared-or-own filter (services, automations, connections).
  const own = companyId ? { companyId } : {};
  const ownOrShared = companyId ? { OR: [{ companyId }, { companyId: null }] } : {};

  const [openLeads, won, inbox, activeAutomations, connections, publishedPosts, scheduledPosts, services] = await Promise.all([
    prisma.lead.count({ where: { workspaceId, stage: { in: ["NEW", "QUALIFIED", "PROPOSAL"] }, ...own } }),
    prisma.lead.aggregate({ where: { workspaceId, stage: "WON", ...own }, _sum: { valueCents: true }, _count: { _all: true } }),
    prisma.conversation.aggregate({ where: { workspaceId, status: "OPEN" }, _sum: { unread: true }, _count: { _all: true } }),
    prisma.automation.count({ where: { workspaceId, enabled: true, ...ownOrShared } }),
    prisma.channelConnection.count({ where: { workspaceId, status: "CONNECTED", ...ownOrShared } }),
    prisma.socialPost.count({ where: { workspaceId, status: "PUBLISHED", ...own } }),
    prisma.socialPost.count({ where: { workspaceId, status: "SCHEDULED", ...own } }),
    prisma.service.count({ where: { workspaceId, status: { not: "ARCHIVED" }, ...ownOrShared } }),
  ]);

  return {
    scope: companyId ? "company" : "workspace",
    openLeads,
    wonCount: won._count._all,
    wonValueCents: won._sum.valueCents ?? 0,
    unreadMessages: inbox._sum.unread ?? 0,
    openConversations: inbox._count._all,
    activeAutomations,
    connections,
    publishedPosts,
    scheduledPosts,
    services,
  };
}
