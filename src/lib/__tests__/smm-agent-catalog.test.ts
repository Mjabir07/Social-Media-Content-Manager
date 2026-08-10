import { describe, expect, it } from "vitest";
import { buildSmmOnboardingPlan, deriveRunStatus, runProgress } from "@/lib/smm-agent-catalog";

const ready = {
  companyName: "Example Co", clientName: "Example Client", website: "https://example.com",
  brandReady: true, brainReady: true, goals: ["Generate leads"], platforms: ["INSTAGRAM"],
  connectedChannels: ["INSTAGRAM"], fromWonLead: true,
};

describe("SMM Delivery Agent plan", () => {
  it("builds the full controlled onboarding lifecycle", () => {
    const plan = buildSmmOnboardingPlan(ready);
    expect(plan.steps).toHaveLength(10);
    expect(plan.steps[0]).toMatchObject({ key: "assess-context", executionMode: "AUTOMATIC", status: "DONE" });
    expect(plan.steps.some((step) => step.executionMode === "APPROVAL")).toBe(true);
    expect(plan.steps.some((step) => step.executionMode === "MANUAL")).toBe(true);
    expect(plan.gaps).toEqual([]);
  });

  it("exposes missing inputs instead of silently skipping them", () => {
    const plan = buildSmmOnboardingPlan({ ...ready, website: null, brandReady: false, brainReady: false, goals: [], platforms: [], connectedChannels: [] });
    expect(plan.gaps.length).toBeGreaterThanOrEqual(6);
    expect(plan.steps.find((step) => step.key === "research-business")).toMatchObject({ status: "BLOCKED" });
    expect(plan.steps.find((step) => step.key === "collect-access")).toMatchObject({ status: "READY" });
  });
});

describe("SMM run progress", () => {
  it("calculates verified completion", () => expect(runProgress(["DONE", "SKIPPED", "READY"])).toEqual({ finished: 2, total: 3, percent: 67 }));
  it("completes only when every step is done or waived", () => expect(deriveRunStatus(["DONE", "SKIPPED"])).toBe("COMPLETED"));
  it("surfaces blockers", () => expect(deriveRunStatus(["DONE", "BLOCKED", "READY"])).toBe("BLOCKED"));
});
