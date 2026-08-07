import { describe, expect, it } from "vitest";
import {
  isTaskStatus,
  isTaskPriority,
  isOverdue,
  sortTasks,
  groupByStatus,
  taskStats,
  type TaskLike,
} from "@/lib/tasks-catalog";

const NOW = new Date("2026-08-07T12:00:00Z");
const day = (n: number) => new Date(Date.UTC(2026, 7, 7 + n)).toISOString();

const mk = (over: Partial<TaskLike>): TaskLike => ({
  status: "TODO", priority: "MEDIUM", dueDate: null, order: 0, createdAt: day(-10), ...over,
});

describe("guards", () => {
  it("validates status and priority", () => {
    expect(isTaskStatus("TODO")).toBe(true);
    expect(isTaskStatus("NOPE")).toBe(false);
    expect(isTaskPriority("HIGH")).toBe(true);
    expect(isTaskPriority("URGENT")).toBe(false);
  });
});

describe("isOverdue", () => {
  it("flags past-due tasks that are not done", () => {
    expect(isOverdue({ status: "TODO", dueDate: day(-1) }, NOW)).toBe(true);
  });
  it("never flags done tasks or undated tasks", () => {
    expect(isOverdue({ status: "DONE", dueDate: day(-5) }, NOW)).toBe(false);
    expect(isOverdue({ status: "TODO", dueDate: null }, NOW)).toBe(false);
  });
  it("does not flag future due dates", () => {
    expect(isOverdue({ status: "PENDING", dueDate: day(3) }, NOW)).toBe(false);
  });
});

describe("sortTasks", () => {
  it("orders by soonest due date, undated last", () => {
    const sorted = sortTasks([
      mk({ dueDate: null }),
      mk({ dueDate: day(5) }),
      mk({ dueDate: day(1) }),
    ]);
    expect(sorted.map((t) => t.dueDate)).toEqual([day(1), day(5), null]);
  });
  it("breaks due-date ties by priority (HIGH first)", () => {
    const sorted = sortTasks([
      mk({ dueDate: day(2), priority: "LOW" }),
      mk({ dueDate: day(2), priority: "HIGH" }),
    ]);
    expect(sorted[0].priority).toBe("HIGH");
  });
});

describe("groupByStatus", () => {
  it("splits into the three columns and sorts each", () => {
    const g = groupByStatus([
      mk({ status: "DONE" }),
      mk({ status: "TODO", dueDate: day(2) }),
      mk({ status: "TODO", dueDate: day(1) }),
      mk({ status: "PENDING" }),
    ]);
    expect(g.TODO).toHaveLength(2);
    expect(g.TODO[0].dueDate).toBe(day(1));
    expect(g.PENDING).toHaveLength(1);
    expect(g.DONE).toHaveLength(1);
  });
});

describe("taskStats", () => {
  it("counts by status plus overdue", () => {
    const s = taskStats([
      mk({ status: "TODO", dueDate: day(-1) }),
      mk({ status: "TODO" }),
      mk({ status: "PENDING", dueDate: day(-2) }),
      mk({ status: "DONE", dueDate: day(-9) }),
    ], NOW);
    expect(s).toEqual({ total: 4, todo: 2, pending: 1, done: 1, overdue: 2 });
  });
});
