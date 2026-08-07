/**
 * Pure project logic — no prisma, client-safe & unit-testable. Statuses,
 * progress roll-up from a project's tasks, and deadline health.
 */

export const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "DONE"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const projectStatusMeta: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  PLANNING: { label: "Planning", color: "#5C3AAE", bg: "#EFEBFB" },
  ACTIVE: { label: "Active", color: "#0758C9", bg: "#E7F0FD" },
  ON_HOLD: { label: "On hold", color: "#9A6711", bg: "#FFF1D5" },
  DONE: { label: "Done", color: "#087B54", bg: "#E7F8EF" },
};

export function isProjectStatus(v: unknown): v is ProjectStatus {
  return typeof v === "string" && (PROJECT_STATUSES as readonly string[]).includes(v);
}

export type TaskCounts = { total: number; done: number; overdue: number };

// Progress percent (0-100) from task counts. No tasks → 0.
export function projectProgress(counts: TaskCounts): number {
  if (counts.total === 0) return 0;
  return Math.round((counts.done / counts.total) * 100);
}

export type DeadlineHealth = "none" | "overdue" | "due-soon" | "on-track";

// Deadline health for a not-done project. due-soon = within 7 days.
export function deadlineHealth(
  deadline: Date | string | null,
  status: ProjectStatus,
  now: Date = new Date(),
): DeadlineHealth {
  if (!deadline || status === "DONE") return "none";
  const t = new Date(deadline).getTime();
  if (Number.isNaN(t)) return "none";
  const days = Math.round((t - now.getTime()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days <= 7) return "due-soon";
  return "on-track";
}

export function formatBudget(budgetCents: number | null, currency = "AED"): string | null {
  if (budgetCents == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(budgetCents / 100);
}
