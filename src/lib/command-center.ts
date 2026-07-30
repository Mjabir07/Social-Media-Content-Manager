import { prisma } from "@/lib/db";

/**
 * Live Command Center stats — a single workspace-scoped snapshot across the new
 * modules (leads, inbox, automations, connections, publishing) for the /azmin
 * dashboard.
 */
export type CommandStats = {
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

export async function getCommandStats(workspaceId: string): Promise<CommandStats> {
  const [openLeads, won, inbox, activeAutomations, connections, publishedPosts, scheduledPosts, services] = await Promise.all([
    prisma.lead.count({ where: { workspaceId, stage: { in: ["NEW", "QUALIFIED", "PROPOSAL"] } } }),
    prisma.lead.aggregate({ where: { workspaceId, stage: "WON" }, _sum: { valueCents: true }, _count: { _all: true } }),
    prisma.conversation.aggregate({ where: { workspaceId, status: "OPEN" }, _sum: { unread: true }, _count: { _all: true } }),
    prisma.automation.count({ where: { workspaceId, enabled: true } }),
    prisma.channelConnection.count({ where: { workspaceId, status: "CONNECTED" } }),
    prisma.socialPost.count({ where: { workspaceId, status: "PUBLISHED" } }),
    prisma.socialPost.count({ where: { workspaceId, status: "SCHEDULED" } }),
    prisma.service.count({ where: { workspaceId, status: { not: "ARCHIVED" } } }),
  ]);

  return {
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
