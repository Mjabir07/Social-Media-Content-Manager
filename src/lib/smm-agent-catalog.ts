export const SMM_RUN_STATUSES = ["PLANNING", "AWAITING_APPROVAL", "IN_PROGRESS", "BLOCKED", "COMPLETED", "FAILED"] as const;
export type SmmRunStatus = (typeof SMM_RUN_STATUSES)[number];
export const SMM_STEP_STATUSES = ["PLANNED", "READY", "WAITING_APPROVAL", "IN_PROGRESS", "BLOCKED", "DONE", "SKIPPED"] as const;
export type SmmStepStatus = (typeof SMM_STEP_STATUSES)[number];
export const SMM_EXECUTION_MODES = ["AUTOMATIC", "APPROVAL", "MANUAL", "API"] as const;
export type SmmExecutionMode = (typeof SMM_EXECUTION_MODES)[number];

export type OnboardingSignals = {
  companyName: string;
  clientName: string;
  website: string | null;
  brandReady: boolean;
  brainReady: boolean;
  goals: string[];
  platforms: string[];
  connectedChannels: string[];
  fromWonLead: boolean;
};

export type PlannedStep = {
  key: string;
  title: string;
  description: string;
  category: string;
  executionMode: SmmExecutionMode;
  status: SmmStepStatus;
  requiresApproval: boolean;
  blockingReason?: string;
};

export function buildSmmOnboardingPlan(signals: OnboardingSignals) {
  const gaps: string[] = [];
  if (!signals.website) gaps.push("Public company website is missing.");
  if (!signals.brandReady) gaps.push("Brand voice and target audiences need review.");
  if (!signals.brainReady) gaps.push("Company Brain content guidance is incomplete.");
  if (!signals.goals.length) gaps.push("SMM goals have not been confirmed.");
  if (!signals.platforms.length) gaps.push("Target social platforms have not been selected.");
  if (!signals.connectedChannels.length) gaps.push("No official social channel is connected yet.");

  const steps: PlannedStep[] = [
    { key: "assess-context", title: "Assess CRM and company context", description: `Validate ${signals.clientName}, its company context, lead origin, and current SMM readiness.`, category: "ASSESS", executionMode: "AUTOMATIC", status: "DONE", requiresApproval: false },
    { key: "research-business", title: "Research business and market context", description: signals.website ? `Review approved public evidence beginning with ${signals.website}; retain sources and distinguish facts from recommendations.` : "Add an approved public website, then research the business and retain sources.", category: "RESEARCH", executionMode: "AUTOMATIC", status: signals.website ? "READY" : "BLOCKED", requiresApproval: false, blockingReason: signals.website ? undefined : "Add the public company website." },
    { key: "complete-brand", title: "Complete Brand Profile and Company Brain", description: "Confirm brand voice, audiences, offers, differentiators, content rules, facts, and agent instructions.", category: "SETUP", executionMode: "MANUAL", status: signals.brandReady && signals.brainReady ? "DONE" : "READY", requiresApproval: false },
    { key: "confirm-scope", title: "Confirm service package and deliverables", description: "Record monthly deliverables, responsibilities, turnaround times, exclusions, and reporting schedule.", category: "PLAN", executionMode: "APPROVAL", status: "WAITING_APPROVAL", requiresApproval: true },
    { key: "confirm-goals-platforms", title: "Confirm goals, platforms, and KPIs", description: "Approve target platforms, business outcomes, audience actions, and measurable key performance indicators.", category: "PLAN", executionMode: "APPROVAL", status: signals.goals.length && signals.platforms.length ? "WAITING_APPROVAL" : "READY", requiresApproval: true },
    { key: "collect-access", title: "Collect and verify social account access", description: "Use encrypted connection/vault workflows. Never place passwords or tokens in tasks or evidence.", category: "ACCESS", executionMode: "MANUAL", status: signals.connectedChannels.length ? "DONE" : "READY", requiresApproval: false },
    { key: "audit-pages", title: "Audit or create selected social pages", description: "Check ownership, completeness, branding, security, profile copy, calls to action, and platform eligibility.", category: "IMPLEMENT", executionMode: "MANUAL", status: "READY", requiresApproval: false },
    { key: "optimize-pages", title: "Prepare and apply page optimization", description: "Draft bios, descriptions, calls to action, profile assets, links, and platform-specific settings. External changes require approval.", category: "IMPLEMENT", executionMode: "APPROVAL", status: "WAITING_APPROVAL", requiresApproval: true },
    { key: "build-strategy", title: "Build SMM strategy and first campaign", description: "Create content pillars, audience strategy, monthly themes, content mix, cadence, and the first measurable campaign.", category: "STRATEGY", executionMode: "APPROVAL", status: "WAITING_APPROVAL", requiresApproval: true },
    { key: "verify-readiness", title: "Verify service readiness and document handoff", description: "Verify every required output, retain evidence, record remaining risks, and activate recurring delivery.", category: "VERIFY", executionMode: "MANUAL", status: "READY", requiresApproval: false },
  ];

  return {
    version: 1,
    objective: `Prepare ${signals.companyName} for complete, agent-assisted social media delivery.`,
    summary: `${steps.length} controlled steps across assessment, research, setup, implementation, strategy, and verification.`,
    gaps,
    recommendedNextAction: "Review and approve the onboarding plan.",
    steps,
  };
}

export function runProgress(statuses: SmmStepStatus[]) {
  const finished = statuses.filter((status) => status === "DONE" || status === "SKIPPED").length;
  return { finished, total: statuses.length, percent: statuses.length ? Math.round((finished / statuses.length) * 100) : 0 };
}

export function deriveRunStatus(statuses: SmmStepStatus[]): SmmRunStatus {
  if (statuses.length > 0 && statuses.every((status) => status === "DONE" || status === "SKIPPED")) return "COMPLETED";
  if (statuses.some((status) => status === "BLOCKED")) return "BLOCKED";
  return "IN_PROGRESS";
}
