import { prisma } from "@/lib/db";
import { sendViaChannel } from "@/lib/channel-adapters";
import { channelPostAction, rollupStatus, type TargetStatus } from "@/lib/posts-catalog";
import type { Channel } from "@/lib/automations-catalog";

/**
 * Multi-platform publishing (DB access + publish engine). Workspace-scoped. A
 * post fans out to one PostTarget per connected channel; publishing runs each
 * target through the channel adapter (safely SIMULATED until live credentials
 * exist) and rolls the results up into the post status. Pure helpers live in
 * "@/lib/posts-catalog" and are re-exported.
 */
export * from "@/lib/posts-catalog";

export async function getPosts(workspaceId: string, companyId?: string) {
  return prisma.socialPost.findMany({
    where: { workspaceId, ...(companyId !== undefined ? { OR: [{ companyId }, { companyId: null }] } : {}) },
    orderBy: [{ createdAt: "desc" }],
    include: { targets: { select: { id: true, channel: true, status: true, detail: true } } },
  });
}

export async function getPost(workspaceId: string, id: string) {
  return prisma.socialPost.findFirst({ where: { id, workspaceId }, include: { targets: { include: { connection: true } } } });
}

export type PostInput = {
  content: string;
  imageUrl?: string | null;
  mediaPublicId?: string | null;
  mediaType?: string | null;
  companyId?: string | null;
  scheduledAt?: Date | null;
  connectionIds: string[];
};

// Create a post fanned out to the chosen connections. Connections are validated
// against the workspace, so a foreign connection id can never be targeted.
export async function createPost(workspaceId: string, createdById: string | null, input: PostInput) {
  const connections = await prisma.channelConnection.findMany({
    where: { id: { in: input.connectionIds }, workspaceId },
    select: { id: true, channel: true },
  });
  const status = input.scheduledAt ? "SCHEDULED" : "DRAFT";
  return prisma.socialPost.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      companyId: input.companyId ?? null,
      content: input.content,
      imageUrl: input.imageUrl ?? null,
      mediaPublicId: input.mediaPublicId ?? null,
      mediaType: input.mediaType ?? null,
      scheduledAt: input.scheduledAt ?? null,
      status,
      targets: { create: connections.map((c) => ({ connectionId: c.id, channel: c.channel, status: "PENDING" })) },
    },
    include: { targets: true },
  });
}

export async function updatePost(workspaceId: string, id: string, data: { content?: string; imageUrl?: string | null; scheduledAt?: Date | null; status?: string }) {
  const result = await prisma.socialPost.updateMany({
    where: { id, workspaceId },
    data: {
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.scheduledAt !== undefined ? { scheduledAt: data.scheduledAt } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });
  return result.count;
}

export async function deletePost(workspaceId: string, id: string) {
  const result = await prisma.socialPost.deleteMany({ where: { id, workspaceId } });
  return result.count;
}

/**
 * Publish a post now: run every target through its channel adapter, record each
 * result, and set the post's rolled-up status. Returns the per-target outcomes.
 */
export async function publishPost(workspaceId: string, id: string) {
  const post = await prisma.socialPost.findFirst({ where: { id, workspaceId }, include: { targets: { include: { connection: true } } } });
  if (!post) return null;

  const statuses: TargetStatus[] = [];
  for (const target of post.targets) {
    const result = await sendViaChannel({
      action: channelPostAction(target.channel),
      channel: target.channel as Channel,
      connection: target.connection,
      message: post.content,
    });
    const status: TargetStatus =
      result.status === "SUCCESS" ? "PUBLISHED" : result.status === "SIMULATED" ? "SIMULATED" : result.status === "SKIPPED" ? "SKIPPED" : "FAILED";
    statuses.push(status);
    await prisma.postTarget.update({
      where: { id: target.id },
      data: { status, detail: result.detail, publishedAt: status === "PUBLISHED" || status === "SIMULATED" ? new Date() : null },
    });
  }

  const rolled = rollupStatus(statuses);
  await prisma.socialPost.update({ where: { id: post.id }, data: { status: rolled } });
  return { status: rolled, targets: statuses };
}

// Scheduled posts whose time has arrived (across all workspaces — for the cron).
export async function getDuePosts(now: Date = new Date()) {
  return prisma.socialPost.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    select: { id: true, workspaceId: true },
    take: 100,
  });
}

// Publish every due scheduled post. Called by the cron endpoint.
export async function runDuePosts(now: Date = new Date()) {
  const due = await getDuePosts(now);
  const results: { id: string; status: string | null }[] = [];
  for (const p of due) {
    const r = await publishPost(p.workspaceId, p.id);
    results.push({ id: p.id, status: r?.status ?? null });
  }
  return { ran: due.length, results };
}
