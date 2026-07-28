import { prisma } from "@/lib/db";
import { dispatchTrigger } from "@/lib/automations";
import { scoreLead, type LeadStage } from "@/lib/leads-catalog";

/**
 * Leads pipeline (DB access). Workspace-scoped throughout. Creating a lead fires
 * the LEAD_CREATED automation trigger, so any enabled recipe (WhatsApp welcome,
 * team notification, email…) runs automatically. The pure catalogue lives in
 * "@/lib/leads-catalog" and is re-exported.
 */
export * from "@/lib/leads-catalog";

export async function getLeads(workspaceId: string, companyId?: string) {
  return prisma.lead.findMany({
    where: { workspaceId, ...(companyId !== undefined ? { OR: [{ companyId }, { companyId: null }] } : {}) },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getLead(workspaceId: string, id: string) {
  return prisma.lead.findFirst({ where: { id, workspaceId } });
}

export type LeadInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  serviceId?: string | null;
  companyId?: string | null;
  valueCents?: number | null;
  currency?: string;
  notes?: string | null;
  stage?: LeadStage;
  companyName?: string; // only for automation variables, not stored
};

export async function createLead(workspaceId: string, createdById: string | null, input: LeadInput) {
  const score = scoreLead(input);
  const lead = await prisma.lead.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      companyId: input.companyId ?? null,
      serviceId: input.serviceId ?? null,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      source: input.source ?? null,
      valueCents: input.valueCents ?? null,
      currency: input.currency ?? "AED",
      notes: input.notes ?? null,
      stage: input.stage ?? "NEW",
      score,
    },
  });

  // Close the automation loop: fire LEAD_CREATED so recipes run immediately.
  await dispatchTrigger({
    workspaceId,
    companyId: input.companyId ?? undefined,
    trigger: "LEAD_CREATED",
    variables: { name: lead.name, email: lead.email, phone: lead.phone, company: input.companyName ?? "" },
  });

  return lead;
}

export async function updateLead(
  workspaceId: string,
  id: string,
  data: Partial<Omit<LeadInput, "companyName">> & { score?: number | null; aiSummary?: string | null },
) {
  const result = await prisma.lead.updateMany({
    where: { id, workspaceId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.source !== undefined ? { source: data.source } : {}),
      ...(data.serviceId !== undefined ? { serviceId: data.serviceId } : {}),
      ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
      ...(data.valueCents !== undefined ? { valueCents: data.valueCents } : {}),
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.stage !== undefined ? { stage: data.stage } : {}),
      ...(data.score !== undefined ? { score: data.score } : {}),
      ...(data.aiSummary !== undefined ? { aiSummary: data.aiSummary } : {}),
    },
  });
  return result.count;
}

export async function deleteLead(workspaceId: string, id: string) {
  const result = await prisma.lead.deleteMany({ where: { id, workspaceId } });
  return result.count;
}
