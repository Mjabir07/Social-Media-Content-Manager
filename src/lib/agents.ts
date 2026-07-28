import { prisma } from "@/lib/db";
import type { AgentAutonomy } from "@/lib/agents-catalog";

/**
 * Company-scoped AI agent profiles (database access). Every read and write is
 * scoped by BOTH workspaceId and companyId, so an agent can never be listed,
 * read, or written across companies or tenants. The pure catalogue and the
 * system-prompt composer live in "@/lib/agents-catalog" and are re-exported
 * here for existing server-side imports.
 */
export * from "@/lib/agents-catalog";

export async function getAgents(workspaceId: string, companyId: string) {
  return prisma.agentProfile.findMany({
    where: { workspaceId, companyId, status: { not: "ARCHIVED" } },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getAgent(workspaceId: string, companyId: string, id: string) {
  return prisma.agentProfile.findFirst({ where: { id, workspaceId, companyId } });
}

export type AgentInput = {
  name: string;
  role: string;
  systemPrompt: string;
  autonomy: AgentAutonomy;
  providerId?: string | null;
  isDefault?: boolean;
};

export async function createAgent(
  workspaceId: string,
  companyId: string,
  createdById: string | null,
  input: AgentInput,
) {
  return prisma.agentProfile.create({
    data: {
      workspaceId,
      companyId,
      createdById: createdById ?? undefined,
      name: input.name,
      role: input.role,
      systemPrompt: input.systemPrompt,
      autonomy: input.autonomy,
      providerId: input.providerId ?? null,
      isDefault: input.isDefault ?? false,
    },
  });
}

// Scoped update: the where clause pins workspace + company so a foreign id can
// never be updated even if the caller passes one. Returns the affected count.
export async function updateAgent(
  workspaceId: string,
  companyId: string,
  id: string,
  data: Partial<AgentInput> & { status?: string },
) {
  const result = await prisma.agentProfile.updateMany({
    where: { id, workspaceId, companyId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.systemPrompt !== undefined ? { systemPrompt: data.systemPrompt } : {}),
      ...(data.autonomy !== undefined ? { autonomy: data.autonomy } : {}),
      ...(data.providerId !== undefined ? { providerId: data.providerId } : {}),
      ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });
  return result.count;
}

// Soft archive, scoped.
export async function archiveAgent(workspaceId: string, companyId: string, id: string) {
  const result = await prisma.agentProfile.updateMany({
    where: { id, workspaceId, companyId },
    data: { status: "ARCHIVED" },
  });
  return result.count;
}
