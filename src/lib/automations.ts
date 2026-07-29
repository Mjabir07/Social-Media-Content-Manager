import { prisma } from "@/lib/db";
import { actionMeta, renderTemplate, type Action, type Trigger } from "@/lib/automations-catalog";
import { sendViaChannel } from "@/lib/channel-adapters";

/**
 * Automation recipes (DB access + the dispatch engine). All access is scoped by
 * workspaceId; a recipe may be shared (companyId null) or bound to one company.
 * The pure catalogue lives in "@/lib/automations-catalog" and is re-exported.
 */
export * from "@/lib/automations-catalog";

export async function getAutomations(workspaceId: string, companyId?: string) {
  return prisma.automation.findMany({
    where: { workspaceId, ...(companyId !== undefined ? { OR: [{ companyId }, { companyId: null }] } : {}) },
    orderBy: [{ enabled: "desc" }, { createdAt: "desc" }],
    include: { connection: { select: { id: true, channel: true, displayName: true, status: true } } },
  });
}

export async function getAutomation(workspaceId: string, id: string) {
  return prisma.automation.findFirst({ where: { id, workspaceId } });
}

export type AutomationInput = {
  name: string;
  trigger: Trigger;
  action: Action;
  connectionId?: string | null;
  template?: string | null;
  config?: string | null;
  companyId?: string | null;
  enabled?: boolean;
};

export async function createAutomation(workspaceId: string, createdById: string | null, input: AutomationInput) {
  return prisma.automation.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      companyId: input.companyId ?? null,
      name: input.name,
      trigger: input.trigger,
      action: input.action,
      connectionId: input.connectionId ?? null,
      template: input.template ?? null,
      config: input.config ?? null,
      enabled: input.enabled ?? true,
    },
  });
}

export async function updateAutomation(
  workspaceId: string,
  id: string,
  data: Partial<AutomationInput> & { enabled?: boolean },
) {
  const result = await prisma.automation.updateMany({
    where: { id, workspaceId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.trigger !== undefined ? { trigger: data.trigger } : {}),
      ...(data.action !== undefined ? { action: data.action } : {}),
      ...(data.connectionId !== undefined ? { connectionId: data.connectionId } : {}),
      ...(data.template !== undefined ? { template: data.template } : {}),
      ...(data.config !== undefined ? { config: data.config } : {}),
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
    },
  });
  return result.count;
}

export async function deleteAutomation(workspaceId: string, id: string) {
  const result = await prisma.automation.deleteMany({ where: { id, workspaceId } });
  return result.count;
}

/**
 * The engine. When something happens in the app, call dispatchTrigger — it finds
 * every enabled recipe for that trigger (this company's plus shared ones), fills
 * the message template, runs the channel adapter, and logs each run. Scoped by
 * workspace so no tenant's automations ever fire on another tenant's events.
 */
export async function dispatchTrigger(input: {
  workspaceId: string;
  companyId?: string;
  trigger: Trigger;
  variables?: Record<string, string | number | null | undefined>;
}) {
  const automations = await prisma.automation.findMany({
    where: {
      workspaceId: input.workspaceId,
      trigger: input.trigger,
      enabled: true,
      ...(input.companyId !== undefined ? { OR: [{ companyId: input.companyId }, { companyId: null }] } : {}),
    },
    include: { connection: true },
  });

  const vars = input.variables ?? {};
  const runs: { automationId: string; status: string; detail: string }[] = [];
  for (const a of automations) {
    const action = a.action as Action;
    const message = renderTemplate(a.template ?? "", vars);
    // Messaging channels need a recipient — pull it from the event variables.
    const recipient =
      action === "SEND_WHATSAPP" ? (vars.phone != null ? String(vars.phone) : undefined)
      : action === "SEND_EMAIL" ? (vars.email != null ? String(vars.email) : undefined)
      : undefined;
    const result = await sendViaChannel({
      action,
      channel: actionMeta[action]?.channel ?? null,
      connection: a.connection,
      message,
      recipient,
    });
    await prisma.automationRun.create({
      data: { automationId: a.id, workspaceId: input.workspaceId, status: result.status, detail: result.detail },
    });
    runs.push({ automationId: a.id, status: result.status, detail: result.detail });
  }
  return { matched: automations.length, runs };
}
