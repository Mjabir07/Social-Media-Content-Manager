import { describe, expect, it } from "vitest";
import {
  isProjectStatus,
  projectProgress,
  deadlineHealth,
  formatBudget,
} from "@/lib/projects-catalog";

const NOW = new Date("2026-08-07T12:00:00Z");
const day = (n: number) => new Date(Date.UTC(2026, 7, 7 + n)).toISOString();

describe("isProjectStatus", () => {
  it("accepts known statuses, rejects others", () => {
    expect(isProjectStatus("ACTIVE")).toBe(true);
    expect(isProjectStatus("DONE")).toBe(true);
    expect(isProjectStatus("ARCHIVED")).toBe(false);
  });
});

describe("projectProgress", () => {
  it("is 0 when there are no tasks", () => {
    expect(projectProgress({ total: 0, done: 0, overdue: 0 })).toBe(0);
  });
  it("rounds the done/total ratio to a percent", () => {
    expect(projectProgress({ total: 4, done: 1, overdue: 0 })).toBe(25);
    expect(projectProgress({ total: 3, done: 2, overdue: 0 })).toBe(67);
    expect(projectProgress({ total: 5, done: 5, overdue: 0 })).toBe(100);
  });
});

describe("deadlineHealth", () => {
  it("returns none when no deadline or project done", () => {
    expect(deadlineHealth(null, "ACTIVE", NOW)).toBe("none");
    expect(deadlineHealth(day(-3), "DONE", NOW)).toBe("none");
  });
  it("flags overdue, due-soon (<=7d) and on-track", () => {
    expect(deadlineHealth(day(-1), "ACTIVE", NOW)).toBe("overdue");
    expect(deadlineHealth(day(3), "ACTIVE", NOW)).toBe("due-soon");
    expect(deadlineHealth(day(30), "ACTIVE", NOW)).toBe("on-track");
  });
});

describe("formatBudget", () => {
  it("returns null for no budget", () => {
    expect(formatBudget(null)).toBeNull();
  });
  it("formats cents into a currency string", () => {
    expect(formatBudget(500000, "AED")).toContain("5,000");
  });
});
