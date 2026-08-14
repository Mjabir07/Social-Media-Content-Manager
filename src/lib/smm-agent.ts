import "server-only";
import { prisma } from "@/lib/db";
import { parseJson, serializeJson } from "@/lib/json";
import { researchCompanyWebsite } from "@/lib/ai/company-enrichment";
import { buildSmmOnboardingPlan, deriveRunStatus, runProgress, type SmmStepStatus } from "@/lib/smm-agent-catalog";

const ACTIVE_RUNS = ["PLANNING", "AWAITING_APPROVAL", "IN_PROGRESS", "BLOCKED"];

export async function getSmmDeliveryWorkspace(workspaceId: string, smmWorkspaceId: string) {
  const account = await prisma.smmWorkspace.findFirst({
    where: { id: smmWorkspaceId, workspaceId },
    include: {
      company: { include: { brandProfile: true, brain: true, connections: { select: { id: true, channel: true, displayName: true, status: true } } } },
      client: true,
      lead: { include: { service: { select: { name: true } } } },
      campaigns: { orderBy: { createdAt: "desc" } },
      pillars: { orderBy: { name: "asc" } },
      workflowRuns: { include: { steps: { include: { task: true }, orderBy: { order: "asc" } } }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!account) return null;
  const postCounts = await prisma.socialPost.groupBy({
    by: ["status"], where: { workspaceId, companyId: account.companyId }, _count: { _all: true },
  });
  const countBy = (status: string) => postCounts.find((row) => row.status === status)?._count._all ?? 0;
  return {
    id: account.id,
    status: account.status,
    timezone: account.timezone,
    goals: parseJson<string[]>(account.goals, []),
    platforms: parseJson<string[]>(account.platforms, []),
    approvalMode: account.approvalMode,
    agentMode: account.agentMode,
    agentEnabled: account.agentEnabled,
    nextAgentRunAt: account.nextAgentRunAt?.toISOString() ?? null,
    lastAgentRunAt: account.lastAgentRunAt?.toISOString() ?? null,
    postStats: { draft: countBy("DRAFT"), scheduled: countBy("SCHEDULED"), published: countBy("PUBLISHED") },
    company: {
      id: account.company.id, name: account.company.name, website: account.company.website, industry: account.company.industry,
      primaryColor: account.company.primaryColor,
      brandReady: Boolean(account.company.brandProfile?.brandVoice && account.company.brandProfile?.targetAudiences !== "[]"),
      brainReady: Boolean(account.company.brain?.contentGuidance && account.company.brain?.aiInstructions),
    },
    client: { id: account.client.id, name: account.client.name, email: account.client.email, phone: account.client.phone, domain: account.client.domain },
    lead: account.lead ? { id: account.lead.id, name: account.lead.name, service: account.lead.service?.name ?? null } : null,
    connections: account.company.connections,
    campaigns: account.campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name, status: campaign.status })),
    pillars: account.pillars.map((pillar) => ({ id: pillar.id, name: pillar.name, targetPercent: pillar.targetPercent, active: pillar.active })),
    runs: account.workflowRuns.map((run) => ({
      id: run.id, type: run.type, status: run.status, objective: run.objective,
      context: parseJson<Record<string, unknown>>(run.contextJson, {}), research: parseJson<Record<string, unknown>>(run.researchJson, {}),
      plan: parseJson<Record<string, unknown>>(run.planJson, {}), summary: run.summary, nextAction: run.nextAction, lastError: run.lastError,
      approvedAt: run.approvedAt?.toISOString() ?? null, createdAt: run.createdAt.toISOString(), completedAt: run.completedAt?.toISOString() ?? null,
      progress: runProgress(run.steps.map((step) => step.status as SmmStepStatus)),
      steps: run.steps.map((step) => ({
        id: step.id, key: step.key, title: step.title, description: step.description, category: step.category,
        executionMode: step.executionMode, status: step.status, requiresApproval: step.requiresApproval, blockingReason: step.blockingReason,
        output: parseJson<Record<string, unknown>>(step.outputJson, {}), evidence: parseJson<Record<string, unknown>>(step.evidenceJson, {}),
        task: step.task ? { id: step.task.id, status: step.task.status, dueDate: step.task.dueDate?.toISOString() ?? null } : null,
      })),
    })),
  };
}

export async function createSmmOnboardingPlan(workspaceId: string, smmWorkspaceId: string, createdById: string | null, input: { goals?: string[]; platforms?: string[]; restart?: boolean }) {
  if (!input.restart) {
    const existing = await prisma.smmWorkflowRun.findFirst({ where: { workspaceId, smmWorkspaceId, type: "ONBOARDING", status: { in: ACTIVE_RUNS } }, orderBy: { createdAt: "desc" } });
    if (existing) return { run: existing, created: false };
  }

  const account = await prisma.smmWorkspace.findFirst({
    where: { id: smmWorkspaceId, workspaceId },
    include: { company: { include: { brandProfile: true, brain: true, connections: true } }, client: true, lead: true },
  });
  if (!account) throw new Error("SMM_ACCOUNT_NOT_FOUND");
  const goals = input.goals ?? parseJson<string[]>(account.goals, []);
  const platforms = input.platforms ?? parseJson<string[]>(account.platforms, []);
  const brandReady = Boolean(account.company.brandProfile?.brandVoice && account.company.brandProfile.targetAudiences !== "[]");
  const brainReady = Boolean(account.company.brain?.contentGuidance && account.company.brain?.aiInstructions);
  const plan = buildSmmOnboardingPlan({
    companyName: account.company.name, clientName: account.client.name, website: account.company.website,
    brandReady, brainReady, goals, platforms,
    connectedChannels: account.company.connections.filter((connection) => connection.status === "CONNECTED").map((connection) => connection.channel),
    fromWonLead: Boolean(account.leadId),
  });

  const research: { method: string; generatedAt: string; sources: Array<{ url: string; title: string; excerpt: string }>; error?: string } = {
    method: account.company.website ? "approved_company_website" : "not_available", generatedAt: new Date().toISOString(), sources: [],
  };
  if (account.company.website) {
    try {
      const sources = await researchCompanyWebsite(account.company.website);
      research.sources = sources.map((source) => ({ url: source.url, title: source.title, excerpt: source.text.slice(0, 500) }));
      const step = plan.steps.find((item) => item.key === "research-business");
      if (step && research.sources.length) step.status = "DONE";
    } catch (error) {
      research.error = error instanceof Error ? error.message : "Website research failed.";
      const step = plan.steps.find((item) => item.key === "research-business");
      if (step) { step.status = "READY"; step.blockingReason = "Automatic website research needs review or retry."; }
    }
  }

  const context = {
    capturedAt: new Date().toISOString(), companyId: account.companyId, clientId: account.clientId, leadId: account.leadId,
    companyName: account.company.name, clientName: account.client.name, website: account.company.website,
    brandReady, brainReady, goals, platforms, connectedChannels: account.company.connections.filter((item) => item.status === "CONNECTED").map((item) => item.channel),
  };

  const run = await prisma.$transaction(async (tx) => {
    await tx.smmWorkspace.update({ where: { id: account.id }, data: { goals: serializeJson(goals), platforms: serializeJson(platforms), onboardingStep: 2 } });
    return tx.smmWorkflowRun.create({
      data: {
        workspaceId, smmWorkspaceId, type: "ONBOARDING", status: "AWAITING_APPROVAL", objective: plan.objective,
        contextJson: serializeJson(context), researchJson: serializeJson(research), planJson: serializeJson({ version: plan.version, gaps: plan.gaps }),
        summary: plan.summary, nextAction: plan.recommendedNextAction, createdById: createdById ?? undefined,
        steps: { create: plan.steps.map((step, order) => ({ workspaceId, order, ...step, outputJson: step.key === "assess-context" ? serializeJson({ gaps: plan.gaps, context }) : "{}" })) },
      },
    });
  });
  return { run, created: true };
}

export async function approveSmmOnboardingPlan(workspaceId: string, smmWorkspaceId: string, runId: string, approvedById: string) {
  const run = await prisma.smmWorkflowRun.findFirst({ where: { id: runId, workspaceId, smmWorkspaceId, type: "ONBOARDING" }, include: { steps: { orderBy: { order: "asc" } }, smmWorkspace: true } });
  if (!run) throw new Error("RUN_NOT_FOUND");
  if (run.approvedAt) return { run, changed: false };
  if (run.status !== "AWAITING_APPROVAL" && run.status !== "BLOCKED") return { run, changed: false };

  const approvedStatus = run.steps.some((step) => Boolean(step.blockingReason)) ? "BLOCKED" : "IN_PROGRESS";

  const updated = await prisma.$transaction(async (tx) => {
    for (const step of run.steps) {
      if (step.status === "DONE" || step.status === "SKIPPED" || step.taskId) continue;
      const due = new Date(Date.now() + Math.max(2, step.order + 2) * 86_400_000);
      const task = await tx.task.create({
        data: {
          workspaceId, companyId: run.smmWorkspace.companyId, createdById: approvedById,
          title: `[SMM] ${step.title}`, notes: `${step.description ?? ""}\n\nExecution mode: ${step.executionMode}. Complete with verification evidence in the SMM account workspace.`,
          priority: step.blockingReason ? "HIGH" : step.requiresApproval ? "HIGH" : "MEDIUM", status: step.blockingReason ? "PENDING" : "TODO", dueDate: due,
        },
      });
      await tx.smmWorkflowStep.update({ where: { id: step.id }, data: { taskId: task.id, status: step.blockingReason ? "BLOCKED" : "READY" } });
    }
    await tx.smmWorkspace.update({ where: { id: smmWorkspaceId }, data: { onboardingStep: 3 } });
    return tx.smmWorkflowRun.update({ where: { id: runId }, data: { status: approvedStatus, approvedById, approvedAt: new Date(), startedAt: run.startedAt ?? new Date(), nextAction: approvedStatus === "BLOCKED" ? "Resolve the blocked setup inputs, then continue ready tasks." : "Complete the next ready setup step and attach evidence." } });
  });
  return { run: updated, changed: true };
}

export async function updateSmmWorkflowStep(workspaceId: string, smmWorkspaceId: string, runId: string, stepId: string, input: { status: SmmStepStatus; evidence?: string | null; blockingReason?: string | null }) {
  const step = await prisma.smmWorkflowStep.findFirst({ where: { id: stepId, workspaceId, runId, run: { smmWorkspaceId } } });
  if (!step) throw new Error("STEP_NOT_FOUND");
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.smmWorkflowStep.update({
      where: { id: step.id },
      data: {
        status: input.status, blockingReason: input.status === "BLOCKED" ? input.blockingReason?.trim() || "Waiting for required input or access." : null,
        evidenceJson: input.evidence?.trim() ? serializeJson({ note: input.evidence.trim(), recordedAt: now.toISOString() }) : step.evidenceJson,
        startedAt: input.status === "IN_PROGRESS" ? step.startedAt ?? now : step.startedAt,
        completedAt: input.status === "DONE" || input.status === "SKIPPED" ? now : null,
      },
    });
    if (step.taskId) await tx.task.update({ where: { id: step.taskId }, data: { status: input.status === "DONE" || input.status === "SKIPPED" ? "DONE" : input.status === "BLOCKED" ? "PENDING" : "TODO", completedAt: input.status === "DONE" || input.status === "SKIPPED" ? now : null } });
    const steps = await tx.smmWorkflowStep.findMany({ where: { runId }, select: { status: true } });
    const status = deriveRunStatus(steps.map((item) => item.status as SmmStepStatus));
    await tx.smmWorkflowRun.update({ where: { id: runId }, data: { status, completedAt: status === "COMPLETED" ? now : null, nextAction: status === "COMPLETED" ? "Onboarding verified. Begin recurring SMM delivery." : status === "BLOCKED" ? "Resolve the blocked setup steps." : "Continue the next ready setup step." } });
    if (status === "COMPLETED") await tx.smmWorkspace.update({ where: { id: smmWorkspaceId }, data: { status: "ACTIVE", onboardingStep: 4 } });
  });
}
