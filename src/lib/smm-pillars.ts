import "server-only";
import { prisma } from "@/lib/db";

/**
 * SMM content pillars — the themes the agent drafts content from. Workspace- and
 * account-scoped: every write verifies the pillar's SMM account belongs to the
 * caller's workspace, so a foreign account id can never be touched.
 */

async function accountInWorkspace(workspaceId: string, smmWorkspaceId: string) {
  return prisma.smmWorkspace.findFirst({ where: { id: smmWorkspaceId, workspaceId }, select: { id: true } });
}

export async function createPillar(workspaceId: string, smmWorkspaceId: string, input: { name: string; description?: string | null; targetPercent?: number }) {
  const account = await accountInWorkspace(workspaceId, smmWorkspaceId);
  if (!account) return null;
  const name = input.name.trim();
  if (!name) return null;
  return prisma.smmContentPillar.create({
    data: {
      workspaceId, smmWorkspaceId, name,
      description: input.description?.trim() || null,
      targetPercent: clampPercent(input.targetPercent),
      active: true,
    },
  });
}

export async function updatePillar(workspaceId: string, smmWorkspaceId: string, pillarId: string, patch: { name?: string; description?: string | null; targetPercent?: number; active?: boolean }) {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) { const n = patch.name.trim(); if (!n) return 0; data.name = n; }
  if (patch.description !== undefined) data.description = patch.description?.trim() || null;
  if (patch.targetPercent !== undefined) data.targetPercent = clampPercent(patch.targetPercent);
  if (patch.active !== undefined) data.active = patch.active;
  const result = await prisma.smmContentPillar.updateMany({ where: { id: pillarId, workspaceId, smmWorkspaceId }, data });
  return result.count;
}

export async function deletePillar(workspaceId: string, smmWorkspaceId: string, pillarId: string) {
  const result = await prisma.smmContentPillar.deleteMany({ where: { id: pillarId, workspaceId, smmWorkspaceId } });
  return result.count;
}

function clampPercent(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 25;
  return Math.max(0, Math.min(100, Math.round(value)));
}
