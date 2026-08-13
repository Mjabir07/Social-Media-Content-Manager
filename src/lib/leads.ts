import { prisma } from "@/lib/db";
import { dispatchTrigger } from "@/lib/automations";
import { scoreLead, type LeadStage } from "@/lib/leads-catalog";
import { createClient } from "@/lib/clients";
import { createWork } from "@/lib/works";
import { createQuote } from "@/lib/quotes";
import { createNotifications } from "@/lib/notifications";
import { sendViaChannel, type ConnectionRow } from "@/lib/channel-adapters";
import { recordOutbound } from "@/lib/inbox";
import type { CurrentUser } from "@/lib/session";
import { autoOnboardWonSmmLead } from "@/lib/smm";

type Actor = Pick<CurrentUser, "id" | "name" | "avatarColor" | "workspaceId">;

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
  partnershipId?: string | null;
  valueCents?: number | null;
  currency?: string;
  notes?: string | null;
  stage?: LeadStage;
  companyName?: string; // only for automation variables, not stored
  serviceName?: string; // automation routing context, not stored
  serviceCategory?: string;
  serviceWorkflow?: string;
};

export async function createLead(workspaceId: string, createdById: string | null, input: LeadInput) {
  const score = scoreLead(input);
  const lead = await prisma.lead.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      companyId: input.companyId ?? null,
      serviceId: input.serviceId ?? null,
      partnershipId: input.partnershipId ?? null,
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
    variables: {
      name: lead.name, email: lead.email, phone: lead.phone, company: input.companyName ?? "",
      service: input.serviceName ?? "", serviceCategory: input.serviceCategory ?? "", serviceWorkflow: input.serviceWorkflow ?? "",
    },
  });

  return lead;
}

export async function updateLead(
  workspaceId: string,
  id: string,
  data: Partial<Omit<LeadInput, "companyName" | "serviceName" | "serviceCategory" | "serviceWorkflow">> & { score?: number | null; aiSummary?: string | null },
  actor: Actor | null = null,
) {
  const before = await prisma.lead.findFirst({ where: { id, workspaceId }, select: { stage: true, wonAt: true } });
  if (!before) return 0;

  const result = await prisma.lead.updateMany({
    where: { id, workspaceId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.source !== undefined ? { source: data.source } : {}),
      ...(data.serviceId !== undefined ? { serviceId: data.serviceId } : {}),
      ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
      ...(data.partnershipId !== undefined ? { partnershipId: data.partnershipId } : {}),
      ...(data.valueCents !== undefined ? { valueCents: data.valueCents } : {}),
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.stage !== undefined ? { stage: data.stage } : {}),
      ...(data.score !== undefined ? { score: data.score } : {}),
      ...(data.aiSummary !== undefined ? { aiSummary: data.aiSummary } : {}),
    },
  });

  // Qualify → auto-draft a quote from the lead (once), ready to add lines + send.
  if (data.stage === "QUALIFIED" && before.stage !== "QUALIFIED") {
    try {
      await draftQuoteForLead(workspaceId, id, actor);
    } catch {
      /* best-effort */
    }
  }

  // Win → bill: first time a lead reaches WON, run the conversion once.
  if (data.stage === "WON" && before.stage !== "WON" && !before.wonAt) {
    try {
      await convertWonLead(workspaceId, id, actor);
      await autoOnboardWonSmmLead(workspaceId, id, actor?.id ?? null);
    } catch {
      /* conversion is best-effort; the stage change itself still succeeds */
    }
  }
  return result.count;
}

// On QUALIFIED, create a DRAFT quote prefilled from the lead so the owner just
// adds line items and sends. Skips if the lead already has a quote (no dupes).
export async function draftQuoteForLead(workspaceId: string, leadId: string, actor: Actor | null) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
  if (!lead) return;
  const existing = await prisma.quote.findFirst({ where: { workspaceId, leadId, deletedAt: null }, select: { id: true } });
  if (existing) return;

  const value = lead.valueCents ?? 0;
  await createQuote(workspaceId, actor?.id ?? null, {
    leadId,
    title: `${lead.name} — proposal`,
    contactName: lead.name,
    contactEmail: lead.email,
    contactPhone: lead.phone,
    currency: lead.currency || "AED",
    notes: lead.notes ?? null,
    lines: [{ description: `${lead.name} — service`, quantity: 1, unitPriceCents: value > 0 ? value : 0 }],
  });

  if (actor) {
    await createNotifications(actor, await ownerIds(workspaceId), {
      action: "quote.drafted",
      targetType: "lead",
      targetId: leadId,
      targetLabel: lead.name,
      message: `qualified — draft quote created, add lines & send`,
    });
  }
}

// Money formatting for the invoice message (kept local + simple).
function fmt(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

// The whole win→bill flow, fired once when a lead becomes WON:
//   1. create a Client from the lead
//   2. create a Work Order (amount = lead value) — this auto-posts a pending
//      invoice to Finance (see lib/works)
//   3. send the invoice on connected Email + WhatsApp
//   4. log each send into the Inbox so the owner can verify it went out
//   5. notify the owner
export async function convertWonLead(workspaceId: string, leadId: string, actor: Actor | null) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
  if (!lead || lead.wonAt) return;

  const createdById = actor?.id ?? null;
  const currency = lead.currency || "AED";
  const value = lead.valueCents ?? 0;

  const client = await createClient(workspaceId, createdById, {
    companyId: lead.companyId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    notes: lead.source ? `Won from lead · source: ${lead.source}` : "Won from lead",
  });

  const work = await createWork(workspaceId, createdById, {
    clientId: client.id,
    title: `${lead.name} — won deal`,
    quantity: 1,
    unitPriceCents: value > 0 ? value : null,
    status: "ACTIVE",
    notes: lead.notes ?? null,
  });

  await prisma.lead.updateMany({ where: { id: leadId, workspaceId }, data: { clientId: client.id, workId: work.id, wonAt: new Date() } });

  // Build the invoice message and send it on any connected messaging channel.
  const amount = value > 0 ? `\nAmount: ${fmt(value, currency)}` : "";
  const message = `Hi ${lead.name},\n\nThank you for confirming. Please find your invoice for the agreed work.${amount}\n\nOnce payment is done we'll start right away.\n\nAZMIN Digital`;

  await sendInvoiceOnChannel(workspaceId, "EMAIL", lead.email, lead.name, `Invoice — ${lead.name}\n\n${message}`, lead.companyId);
  await sendInvoiceOnChannel(workspaceId, "WHATSAPP", lead.phone, lead.name, message, lead.companyId);

  if (actor) {
    await createNotifications(actor, await ownerIds(workspaceId), {
      action: "lead.won",
      targetType: "lead",
      targetId: leadId,
      targetLabel: lead.name,
      message: `won — client + work order created${value > 0 ? ` (${fmt(value, currency)})` : ""}, invoice sent`,
    });
  }
}

async function ownerIds(workspaceId: string): Promise<string[]> {
  const members = await prisma.membership.findMany({ where: { workspaceId, role: { in: ["OWNER", "ADMIN"] } }, select: { userId: true } });
  return members.map((m) => m.userId);
}

// Send on one channel if it's connected and we have a recipient; log the result
// (sent/failed/simulated) into the Inbox for verification.
async function sendInvoiceOnChannel(workspaceId: string, channel: "EMAIL" | "WHATSAPP", recipient: string | null, contactName: string, text: string, companyId: string | null) {
  if (!recipient) return;
  const conn = (await prisma.channelConnection.findFirst({
    where: { workspaceId, channel, status: "CONNECTED" },
  })) as unknown as NonNullable<ConnectionRow> | null;

  const result = await sendViaChannel({
    action: channel === "EMAIL" ? "SEND_EMAIL" : "SEND_WHATSAPP",
    channel,
    connection: conn,
    message: text,
    recipient,
  });

  await recordOutbound(workspaceId, {
    channel: channel === "EMAIL" ? "EMAIL" : "WHATSAPP",
    contact: recipient,
    contactName,
    companyId,
    text,
    status: result.status,
  });
}

export async function deleteLead(workspaceId: string, id: string) {
  const result = await prisma.lead.deleteMany({ where: { id, workspaceId } });
  return result.count;
}
