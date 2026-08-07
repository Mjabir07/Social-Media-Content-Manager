import { prisma } from "@/lib/db";
import { isProjectStatus, projectProgress, type ProjectStatus, type TaskCounts } from "@/lib/projects-catalog";

/**
 * Projects (DB access). Workspace-scoped, soft-deleted (deletedAt). Each project
 * rolls up its (non-deleted) tasks into total/done/overdue counts + progress %.
 * Pure catalogue lives in "@/lib/projects-catalog" and is re-exported.
 */
export * from "@/lib/projects-catalog";

export type ProjectWithCounts = {
  id: string;
  companyId: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  deadline: Date | null;
  budgetCents: number | null;
  currency: string;
  createdAt: Date;
  counts: TaskCounts;
  progress: number;
};

// Count a project's live tasks: total, done, and overdue (past due, not done).
async function taskCountsFor(workspaceId: string, projectId: string, now: Date): Promise<TaskCounts> {
  const [total, done, overdue] = await Promise.all([
    prisma.task.count({ where: { workspaceId, projectId, deletedAt: null } }),
    prisma.task.count({ where: { workspaceId, projectId, deletedAt: null, status: "DONE" } }),
    prisma.task.count({ where: { workspaceId, projectId, deletedAt: null, status: { not: "DONE" }, dueDate: { lt: now } } }),
  ]);
  return { total, done, overdue };
}

export async function getProjects(workspaceId: string, companyId?: string): Promise<ProjectWithCounts[]> {
  const now = new Date();
  const rows = await prisma.project.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(companyId !== undefined ? { OR: [{ companyId }, { companyId: null }] } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
  });
  return Promise.all(
    rows.map(async (p) => {
      const counts = await taskCountsFor(workspaceId, p.id, now);
      return {
        id: p.id, companyId: p.companyId, name: p.name, description: p.description,
        status: p.status as ProjectStatus, deadline: p.deadline, budgetCents: p.budgetCents,
        currency: p.currency, createdAt: p.createdAt, counts, progress: projectProgress(counts),
      };
    }),
  );
}

export async function getProject(workspaceId: string, id: string): Promise<ProjectWithCounts | null> {
  const p = await prisma.project.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!p) return null;
  const counts = await taskCountsFor(workspaceId, p.id, new Date());
  return {
    id: p.id, companyId: p.companyId, name: p.name, description: p.description,
    status: p.status as ProjectStatus, deadline: p.deadline, budgetCents: p.budgetCents,
    currency: p.currency, createdAt: p.createdAt, counts, progress: projectProgress(counts),
  };
}

export type ProjectInput = {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  companyId?: string | null;
  deadline?: string | Date | null;
  budgetCents?: number | null;
  currency?: string;
};

function normalizeDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function createProject(workspaceId: string, createdById: string | null, input: ProjectInput) {
  return prisma.project.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      companyId: input.companyId ?? null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      status: isProjectStatus(input.status) ? input.status : "ACTIVE",
      deadline: normalizeDate(input.deadline),
      budgetCents: input.budgetCents ?? null,
      currency: input.currency ?? "AED",
    },
  });
}

export async function updateProject(workspaceId: string, id: string, patch: Partial<ProjectInput>) {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.description !== undefined) data.description = patch.description?.trim() || null;
  if (patch.status !== undefined && isProjectStatus(patch.status)) data.status = patch.status;
  if (patch.companyId !== undefined) data.companyId = patch.companyId ?? null;
  if (patch.deadline !== undefined) data.deadline = normalizeDate(patch.deadline);
  if (patch.budgetCents !== undefined) data.budgetCents = patch.budgetCents ?? null;
  if (patch.currency !== undefined) data.currency = patch.currency;
  const result = await prisma.project.updateMany({ where: { id, workspaceId, deletedAt: null }, data });
  return result.count;
}

// Soft delete the project. Its tasks keep existing but are unlinked (projectId
// set null) so nothing is silently lost.
export async function deleteProject(workspaceId: string, id: string) {
  const result = await prisma.project.updateMany({ where: { id, workspaceId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (result.count > 0) {
    await prisma.task.updateMany({ where: { workspaceId, projectId: id }, data: { projectId: null } });
  }
  return result.count;
}
