import { prisma } from "@/lib/db";
import { companySlug } from "@/lib/companies";
import { parseJson } from "@/lib/json";

const STARTER_PILLARS = [
  { name: "Awareness", description: "Reach new audiences with useful, memorable brand content." },
  { name: "Authority", description: "Demonstrate expertise, proof, and trusted points of view." },
  { name: "Engagement", description: "Start conversations and strengthen the community." },
  { name: "Conversion", description: "Turn attention into qualified enquiries and sales." },
] as const;

export type SmmOnboardInput = { clientId: string; leadId?: string | null };

export function looksLikeSmmService(name: string | null | undefined) {
  return /\b(smm|social media|content management|social management)\b/i.test(name ?? "");
}

export async function getSmmCommandCenter(workspaceId: string) {
  const [accounts, availableClients] = await Promise.all([
    prisma.smmWorkspace.findMany({
      where: { workspaceId },
      include: {
        company: { include: { brandProfile: true, brain: true } },
        client: true,
        lead: { select: { id: true, name: true, stage: true } },
        campaigns: { orderBy: { createdAt: "desc" } },
        pillars: { where: { active: true }, orderBy: { name: "asc" } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.client.findMany({
      where: { workspaceId, deletedAt: null, smmWorkspace: null },
      select: { id: true, name: true, email: true, phone: true, domain: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const companyIds = accounts.map((account) => account.companyId);
  const [postCounts, connectionCounts] = companyIds.length
    ? await Promise.all([
        prisma.socialPost.groupBy({ by: ["companyId", "status"], where: { workspaceId, companyId: { in: companyIds } }, _count: { _all: true } }),
        prisma.channelConnection.groupBy({ by: ["companyId", "status"], where: { workspaceId, companyId: { in: companyIds } }, _count: { _all: true } }),
      ])
    : [[], []];

  return {
    accounts: accounts.map((account) => {
      const posts = postCounts.filter((row) => row.companyId === account.companyId);
      const connections = connectionCounts.filter((row) => row.companyId === account.companyId && row.status === "CONNECTED");
      return {
        id: account.id,
        status: account.status,
        onboardingStep: account.onboardingStep,
        timezone: account.timezone,
        goals: parseJson<string[]>(account.goals, []),
        platforms: parseJson<string[]>(account.platforms, []),
        approvalMode: account.approvalMode,
        agentEnabled: account.agentEnabled,
        agentMode: account.agentMode,
        nextAgentRunAt: account.nextAgentRunAt?.toISOString() ?? null,
        company: {
          id: account.company.id,
          name: account.company.name,
          primaryColor: account.company.primaryColor,
          brandReady: Boolean(account.company.brandProfile?.brandVoice && account.company.brain?.contentGuidance),
        },
        client: { id: account.client.id, name: account.client.name, email: account.client.email },
        lead: account.lead,
        campaignCount: account.campaigns.length,
        activeCampaigns: account.campaigns.filter((campaign) => campaign.status === "ACTIVE").length,
        pillarCount: account.pillars.length,
        connectedChannels: connections.reduce((sum, row) => sum + row._count._all, 0),
        scheduledPosts: posts.filter((row) => row.status === "SCHEDULED").reduce((sum, row) => sum + row._count._all, 0),
        publishedPosts: posts.filter((row) => row.status === "PUBLISHED").reduce((sum, row) => sum + row._count._all, 0),
        failedPosts: posts.filter((row) => row.status === "FAILED" || row.status === "PARTIAL").reduce((sum, row) => sum + row._count._all, 0),
      };
    }),
    availableClients,
  };
}

export async function onboardSmmClient(workspaceId: string, createdById: string | null, input: SmmOnboardInput) {
  const existing = await prisma.smmWorkspace.findFirst({ where: { workspaceId, clientId: input.clientId } });
  if (existing) return { account: existing, created: false };

  const client = await prisma.client.findFirst({ where: { id: input.clientId, workspaceId, deletedAt: null } });
  if (!client) throw new Error("CLIENT_NOT_FOUND");

  const lead = input.leadId
    ? await prisma.lead.findFirst({ where: { id: input.leadId, workspaceId, stage: "WON", clientId: client.id } })
    : null;
  if (input.leadId && !lead) throw new Error("WON_LEAD_REQUIRED");

  const account = await prisma.$transaction(async (tx) => {
    let company = lead?.companyId
      ? await tx.company.findFirst({ where: { id: lead.companyId, workspaceId, smmWorkspace: null } })
      : null;

    if (!company) {
      company = await tx.company.findFirst({
        where: { workspaceId, name: { equals: client.name, mode: "insensitive" }, status: { not: "ARCHIVED" }, smmWorkspace: null },
      });
    }

    if (!company) {
      const base = companySlug(client.name);
      let slug = base;
      let suffix = 2;
      while (await tx.company.findUnique({ where: { workspaceId_slug: { workspaceId, slug } }, select: { id: true } })) slug = `${base}-${suffix++}`;
      company = await tx.company.create({
        data: {
          workspaceId,
          name: client.name,
          slug,
          relationshipType: "CLIENT",
          website: client.domain ? `https://${client.domain.replace(/^https?:\/\//, "")}` : null,
          description: "SMM client onboarded from the CRM.",
          brandProfile: { create: {} },
          brain: { create: {} },
        },
      });
    }

    return tx.smmWorkspace.create({
      data: {
        workspaceId,
        companyId: company.id,
        clientId: client.id,
        leadId: lead?.id ?? null,
        createdById: createdById ?? undefined,
        pillars: { create: STARTER_PILLARS.map((pillar) => ({ workspaceId, ...pillar })) },
      },
    });
  });

  return { account, created: true };
}

export async function autoOnboardWonSmmLead(workspaceId: string, leadId: string, createdById: string | null) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId, stage: "WON" },
    include: { service: { select: { name: true } } },
  });
  if (!lead?.clientId || !looksLikeSmmService(lead.service?.name)) return null;
  return onboardSmmClient(workspaceId, createdById, { clientId: lead.clientId, leadId: lead.id });
}
