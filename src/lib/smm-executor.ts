import "server-only";
import { prisma } from "@/lib/db";
import { createPost } from "@/lib/posts";
import { generateCaption } from "@/lib/ai/post-caption";

/**
 * SMM agent executor. Runs on the daily cron for every SMM account whose
 * automation is enabled and due (nextAgentRunAt <= now). It keeps a rolling
 * buffer of upcoming content drafted from the company's active content pillars,
 * using the brand voice for tone. It never publishes directly — posts are
 * created as DRAFT (review) or SCHEDULED (autonomous), and the existing
 * runDuePosts cron publishes SCHEDULED posts when they come due, still gated by
 * whether a channel is actually connected.
 *
 * agentMode:
 *   DRAFT_ONLY / ASSISTED → create DRAFT posts for the owner to review + schedule.
 *   AUTONOMOUS            → create SCHEDULED posts spread over the coming days.
 */

export const SMM_AGENT_MODES = ["DRAFT_ONLY", "ASSISTED", "AUTONOMOUS"] as const;
export const SMM_APPROVAL_MODES = ["REQUIRED", "TRUSTED_AUTO"] as const;

const BUFFER = 6; // desired upcoming (DRAFT + SCHEDULED) posts per account
const MAX_PER_RUN = 3; // cap posts created in a single cycle (avoids flooding)
const DAY_MS = 24 * 60 * 60 * 1000;

type DueAccount = {
  id: string;
  workspaceId: string;
  companyId: string;
  agentMode: string;
  pillars: { name: string; description: string | null }[];
  brandVoice: string | null;
  companyName: string;
  connectionIds: string[];
  offset: number; // pillar rotation cursor derived from posts already made
};

async function loadDueAccount(workspaceId: string, id: string): Promise<DueAccount | null> {
  const account = await prisma.smmWorkspace.findFirst({
    where: { id, workspaceId, agentEnabled: true },
    include: {
      pillars: { where: { active: true }, orderBy: { name: "asc" }, select: { name: true, description: true } },
      company: {
        select: {
          id: true, name: true,
          brandProfile: { select: { brandVoice: true } },
          connections: { where: { status: "CONNECTED" }, select: { id: true } },
        },
      },
    },
  });
  if (!account) return null;
  const totalPosts = await prisma.socialPost.count({ where: { workspaceId, companyId: account.company.id } });
  return {
    id: account.id, workspaceId, companyId: account.company.id, agentMode: account.agentMode,
    pillars: account.pillars, brandVoice: account.company.brandProfile?.brandVoice ?? null,
    companyName: account.company.name, connectionIds: account.company.connections.map((c) => c.id),
    offset: totalPosts,
  };
}

// Generate up to MAX_PER_RUN posts to top the account's buffer back up. Returns
// how many were created. Does not touch scheduling metadata (caller does).
async function generateForAccount(account: DueAccount, now: Date): Promise<number> {
  if (!account.pillars.length) return 0;

  const upcoming = await prisma.socialPost.count({
    where: { workspaceId: account.workspaceId, companyId: account.companyId, status: { in: ["DRAFT", "SCHEDULED"] } },
  });
  const toGenerate = Math.max(0, Math.min(BUFFER - upcoming, MAX_PER_RUN));
  if (toGenerate === 0) return 0;

  const autonomous = account.agentMode === "AUTONOMOUS";
  // Start scheduling after the latest already-scheduled post so cadence never clusters.
  const latest = autonomous
    ? await prisma.socialPost.findFirst({
        where: { workspaceId: account.workspaceId, companyId: account.companyId, status: "SCHEDULED", scheduledAt: { gte: now } },
        orderBy: { scheduledAt: "desc" }, select: { scheduledAt: true },
      })
    : null;
  let cursor = latest?.scheduledAt ? latest.scheduledAt.getTime() : now.getTime();

  let created = 0;
  for (let i = 0; i < toGenerate; i += 1) {
    const pillar = account.pillars[(account.offset + i) % account.pillars.length];
    const topic = pillar.description ? `${pillar.name}: ${pillar.description}` : pillar.name;
    const { caption } = await generateCaption({ topic, brandVoice: account.brandVoice, company: account.companyName });

    let scheduledAt: Date | null = null;
    if (autonomous) {
      cursor += 2 * DAY_MS; // one post every 2 days
      scheduledAt = new Date(cursor);
    }
    await createPost(account.workspaceId, null, {
      content: caption,
      companyId: account.companyId,
      scheduledAt,
      connectionIds: account.connectionIds,
    });
    created += 1;
  }
  return created;
}

// Run one account immediately (owner pressed "Run now"). Reschedules next run.
export async function runSmmAgentForAccount(workspaceId: string, id: string, now: Date = new Date()) {
  const account = await loadDueAccount(workspaceId, id);
  if (!account) return { ran: false, created: 0 };
  const created = await generateForAccount(account, now);
  await prisma.smmWorkspace.update({ where: { id }, data: { lastAgentRunAt: now, nextAgentRunAt: new Date(now.getTime() + DAY_MS) } });
  return { ran: true, created };
}

// The daily cron entry point: process every due account across all workspaces.
export async function runSmmAgentCycle(now: Date = new Date()) {
  const due = await prisma.smmWorkspace.findMany({
    where: { agentEnabled: true, nextAgentRunAt: { lte: now } },
    select: { id: true, workspaceId: true },
    take: 200,
  });
  let accounts = 0;
  let created = 0;
  for (const row of due) {
    try {
      const account = await loadDueAccount(row.workspaceId, row.id);
      if (!account) continue;
      created += await generateForAccount(account, now);
      accounts += 1;
      await prisma.smmWorkspace.update({ where: { id: row.id }, data: { lastAgentRunAt: now, nextAgentRunAt: new Date(now.getTime() + DAY_MS) } });
    } catch (error) {
      console.error("smm agent cycle failed for", row.id, error);
    }
  }
  return { smmAccounts: accounts, smmPostsCreated: created };
}

// Update automation settings. Enabling automation arms the next run for the next
// cron pass. Returns nothing meaningful beyond success (caller re-reads).
export async function updateSmmAgentSettings(
  workspaceId: string,
  id: string,
  patch: { agentMode?: string; approvalMode?: string; agentEnabled?: boolean },
  now: Date = new Date(),
) {
  const data: Record<string, unknown> = {};
  if (patch.agentMode && SMM_AGENT_MODES.includes(patch.agentMode as (typeof SMM_AGENT_MODES)[number])) data.agentMode = patch.agentMode;
  if (patch.approvalMode && SMM_APPROVAL_MODES.includes(patch.approvalMode as (typeof SMM_APPROVAL_MODES)[number])) data.approvalMode = patch.approvalMode;
  if (patch.agentEnabled !== undefined) {
    data.agentEnabled = patch.agentEnabled;
    // Arm the next run when turning automation on; hold it when turning off.
    data.nextAgentRunAt = patch.agentEnabled ? now : null;
  }
  const result = await prisma.smmWorkspace.updateMany({ where: { id, workspaceId }, data });
  return result.count;
}
