/**
 * Pure task logic — no prisma, client-safe & unit-testable. Statuses, priorities,
 * sorting, overdue detection, and roll-up stats for the To-Do board.
 */

export const TASK_STATUSES = ["TODO", "PENDING", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const statusMeta: Record<TaskStatus, { label: string; hint: string; color: string; bg: string }> = {
  TODO: { label: "To do", hint: "Not started yet", color: "#0758C9", bg: "#E7F0FD" },
  PENDING: { label: "Pending", hint: "Waiting on someone / something", color: "#9A6711", bg: "#FFF1D5" },
  DONE: { label: "Done", hint: "Finished", color: "#087B54", bg: "#E7F8EF" },
};

export const priorityMeta: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  HIGH: { label: "High", color: "#B4231C", bg: "#FDECEC" },
  MEDIUM: { label: "Medium", color: "#8A5A0B", bg: "#FFF4E0" },
  LOW: { label: "Low", color: "#456784", bg: "#EEF3F8" },
};

export function isTaskStatus(v: unknown): v is TaskStatus {
  return typeof v === "string" && (TASK_STATUSES as readonly string[]).includes(v);
}
export function isTaskPriority(v: unknown): v is TaskPriority {
  return typeof v === "string" && (TASK_PRIORITIES as readonly string[]).includes(v);
}

const PRIORITY_RANK: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export type TaskLike = {
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | string | null;
  order: number;
  createdAt: Date | string;
};

function ms(d: Date | string | null): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? null : t;
}

// A task is overdue when it has a due date in the past and isn't done.
export function isOverdue(task: Pick<TaskLike, "status" | "dueDate">, now: Date = new Date()): boolean {
  if (task.status === "DONE") return false;
  const due = ms(task.dueDate);
  return due !== null && due < now.getTime();
}

// Board order within a column: soonest due first (undated last), then higher
// priority, then manual order, then oldest first. Done tasks sink to the bottom.
export function sortTasks<T extends TaskLike>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const da = ms(a.dueDate);
    const db = ms(b.dueDate);
    if (da !== db) {
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    }
    if (a.priority !== b.priority) return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (a.order !== b.order) return a.order - b.order;
    return (ms(a.createdAt) ?? 0) - (ms(b.createdAt) ?? 0);
  });
}

export function groupByStatus<T extends TaskLike>(tasks: T[]): Record<TaskStatus, T[]> {
  const out: Record<TaskStatus, T[]> = { TODO: [], PENDING: [], DONE: [] };
  for (const t of tasks) out[t.status].push(t);
  for (const s of TASK_STATUSES) out[s] = sortTasks(out[s]);
  return out;
}

export type TaskStats = { total: number; todo: number; pending: number; done: number; overdue: number };

export function taskStats(tasks: TaskLike[], now: Date = new Date()): TaskStats {
  const stats: TaskStats = { total: 0, todo: 0, pending: 0, done: 0, overdue: 0 };
  for (const t of tasks) {
    stats.total += 1;
    if (t.status === "TODO") stats.todo += 1;
    else if (t.status === "PENDING") stats.pending += 1;
    else if (t.status === "DONE") stats.done += 1;
    if (isOverdue(t, now)) stats.overdue += 1;
  }
  return stats;
}
