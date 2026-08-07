import { prisma } from "@/lib/db";
import { isTaskPriority, isTaskStatus, type TaskPriority, type TaskStatus } from "@/lib/tasks-catalog";

/**
 * Tasks / to-do (DB access). Workspace-scoped throughout. Soft-deleted via
 * deletedAt. The pure catalogue lives in "@/lib/tasks-catalog" and is re-exported.
 */
export * from "@/lib/tasks-catalog";

export async function getTasks(workspaceId: string, opts?: { companyId?: string; projectId?: string }) {
  const { companyId, projectId } = opts ?? {};
  return prisma.task.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(projectId !== undefined ? { projectId } : {}),
      ...(companyId !== undefined ? { OR: [{ companyId }, { companyId: null }] } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export type TaskInput = {
  title: string;
  notes?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
  companyId?: string | null;
  projectId?: string | null;
};

function normalizeDue(due: string | Date | null | undefined): Date | null {
  if (!due) return null;
  const d = new Date(due);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createTask(workspaceId: string, createdById: string | null, input: TaskInput) {
  const status = isTaskStatus(input.status) ? input.status : "TODO";
  return prisma.task.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      companyId: input.companyId ?? null,
      projectId: input.projectId ?? null,
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      status,
      priority: isTaskPriority(input.priority) ? input.priority : "MEDIUM",
      dueDate: normalizeDue(input.dueDate),
      completedAt: status === "DONE" ? new Date() : null,
    },
  });
}

export type TaskPatch = Partial<TaskInput>;

// Scoped update. Setting status to DONE stamps completedAt; moving off DONE clears it.
export async function updateTask(workspaceId: string, id: string, patch: TaskPatch) {
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title.trim();
  if (patch.notes !== undefined) data.notes = patch.notes?.trim() || null;
  if (patch.priority !== undefined && isTaskPriority(patch.priority)) data.priority = patch.priority;
  if (patch.dueDate !== undefined) data.dueDate = normalizeDue(patch.dueDate);
  if (patch.companyId !== undefined) data.companyId = patch.companyId ?? null;
  if (patch.projectId !== undefined) data.projectId = patch.projectId ?? null;
  if (patch.status !== undefined && isTaskStatus(patch.status)) {
    data.status = patch.status;
    data.completedAt = patch.status === "DONE" ? new Date() : null;
  }
  const result = await prisma.task.updateMany({ where: { id, workspaceId, deletedAt: null }, data });
  return result.count;
}

// Soft delete (data-safety rule).
export async function deleteTask(workspaceId: string, id: string) {
  const result = await prisma.task.updateMany({ where: { id, workspaceId, deletedAt: null }, data: { deletedAt: new Date() } });
  return result.count;
}
