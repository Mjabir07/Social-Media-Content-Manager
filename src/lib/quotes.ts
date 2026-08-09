import { prisma } from "@/lib/db";
import { createClient } from "@/lib/clients";
import { createWork } from "@/lib/works";
import { sendViaChannel, type ConnectionRow } from "@/lib/channel-adapters";
import { recordOutbound } from "@/lib/inbox";
import {
  isQuoteStatus,
  quoteSubtotalCents,
  quoteNumberLabel,
  formatQuoteMoney,
  type QuoteStatus,
} from "@/lib/quotes-catalog";

/**
 * Quotations (DB access). Workspace-scoped, soft-deleted. A quote holds line
 * items; accepting it converts to a Client + Work Order + pending invoice and
 * marks any linked lead WON. Pure logic lives in "@/lib/quotes-catalog".
 */
export * from "@/lib/quotes-catalog";

export type QuoteLineInput = { description: string; quantity?: number | null; unitPriceCents?: number | null };
export type QuoteLineDTO = { id: string; description: string; quantity: number; unitPriceCents: number };

export type QuoteDTO = {
  id: string;
  number: number;
  numberLabel: string;
  leadId: string | null;
  clientId: string | null;
  title: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  currency: string;
  status: QuoteStatus;
  validUntil: string | null;
  notes: string | null;
  subtotalCents: number;
  lines: QuoteLineDTO[];
  createdAt: string;
};

type QuoteRow = {
  id: string; number: number; leadId: string | null; clientId: string | null; title: string;
  contactName: string; contactEmail: string | null; contactPhone: string | null; currency: string;
  status: string; validUntil: Date | null; notes: string | null; subtotalCents: number; createdAt: Date;
  lines: { id: string; description: string; quantity: number; unitPriceCents: number }[];
};

function toDTO(q: QuoteRow): QuoteDTO {
  return {
    id: q.id, number: q.number, numberLabel: quoteNumberLabel(q.number),
    leadId: q.leadId, clientId: q.clientId, title: q.title,
    contactName: q.contactName, contactEmail: q.contactEmail, contactPhone: q.contactPhone,
    currency: q.currency, status: isQuoteStatus(q.status) ? q.status : "DRAFT",
    validUntil: q.validUntil ? q.validUntil.toISOString() : null, notes: q.notes,
    subtotalCents: q.subtotalCents,
    lines: q.lines.map((l) => ({ id: l.id, description: l.description, quantity: l.quantity, unitPriceCents: l.unitPriceCents })),
    createdAt: q.createdAt.toISOString(),
  };
}

export async function getQuotes(workspaceId: string): Promise<QuoteDTO[]> {
  const rows = await prisma.quote.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: [{ createdAt: "desc" }],
    include: { lines: { orderBy: { order: "asc" } } },
  });
  return rows.map(toDTO);
}

export async function getQuote(workspaceId: string, id: string): Promise<QuoteDTO | null> {
  const q = await prisma.quote.findFirst({ where: { id, workspaceId, deletedAt: null }, include: { lines: { orderBy: { order: "asc" } } } });
  return q ? toDTO(q) : null;
}

export type QuoteInput = {
  leadId?: string | null;
  clientId?: string | null;
  title: string;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  currency?: string;
  validUntil?: string | Date | null;
  notes?: string | null;
  lines: QuoteLineInput[];
};

function normalizeDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function cleanLines(lines: QuoteLineInput[]) {
  return lines
    .filter((l) => l.description?.trim())
    .map((l, i) => ({
      description: l.description.trim(),
      quantity: Math.max(1, Math.round(l.quantity ?? 1)),
      unitPriceCents: Math.max(0, Math.round(l.unitPriceCents ?? 0)),
      order: i,
    }));
}

export async function createQuote(workspaceId: string, createdById: string | null, input: QuoteInput): Promise<QuoteDTO> {
  const lines = cleanLines(input.lines);
  const subtotalCents = quoteSubtotalCents(lines);
  const count = await prisma.quote.count({ where: { workspaceId } });
  const created = await prisma.quote.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      leadId: input.leadId ?? null,
      clientId: input.clientId ?? null,
      number: count + 1,
      title: input.title.trim(),
      contactName: input.contactName.trim(),
      contactEmail: input.contactEmail?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      currency: input.currency ?? "AED",
      status: "DRAFT",
      validUntil: normalizeDate(input.validUntil),
      notes: input.notes?.trim() || null,
      subtotalCents,
      lines: { create: lines },
    },
    include: { lines: { orderBy: { order: "asc" } } },
  });
  return toDTO(created);
}

export async function updateQuote(workspaceId: string, id: string, patch: Partial<QuoteInput>): Promise<number> {
  const existing = await prisma.quote.findFirst({ where: { id, workspaceId, deletedAt: null }, select: { status: true } });
  if (!existing || existing.status === "ACCEPTED") return 0; // locked once accepted

  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title.trim();
  if (patch.contactName !== undefined) data.contactName = patch.contactName.trim();
  if (patch.contactEmail !== undefined) data.contactEmail = patch.contactEmail?.trim() || null;
  if (patch.contactPhone !== undefined) data.contactPhone = patch.contactPhone?.trim() || null;
  if (patch.currency !== undefined) data.currency = patch.currency;
  if (patch.validUntil !== undefined) data.validUntil = normalizeDate(patch.validUntil);
  if (patch.notes !== undefined) data.notes = patch.notes?.trim() || null;
  if (patch.clientId !== undefined) data.clientId = patch.clientId ?? null;

  if (patch.lines !== undefined) {
    const lines = cleanLines(patch.lines);
    data.subtotalCents = quoteSubtotalCents(lines);
    await prisma.quoteLine.deleteMany({ where: { quoteId: id } });
    data.lines = { create: lines };
  }
  await prisma.quote.update({ where: { id }, data });
  return 1;
}

export async function deleteQuote(workspaceId: string, id: string): Promise<number> {
  const result = await prisma.quote.updateMany({ where: { id, workspaceId, deletedAt: null }, data: { deletedAt: new Date() } });
  return result.count;
}

// Send the quote on connected Email + WhatsApp and log the sends to the Inbox.
export async function sendQuote(workspaceId: string, id: string, createdById: string | null): Promise<{ ok: boolean; error?: string }> {
  const q = await prisma.quote.findFirst({ where: { id, workspaceId, deletedAt: null }, include: { lines: { orderBy: { order: "asc" } } } });
  if (!q) return { ok: false, error: "Not found" };

  const total = formatQuoteMoney(q.subtotalCents, q.currency);
  const lineText = q.lines.map((l) => `• ${l.description} — ${l.quantity} × ${formatQuoteMoney(l.unitPriceCents, q.currency)} = ${formatQuoteMoney(l.quantity * l.unitPriceCents, q.currency)}`).join("\n");
  const validity = q.validUntil ? `\nValid until: ${new Date(q.validUntil).toLocaleDateString("en-GB")}` : "";
  const message = `Hi ${q.contactName},\n\nHere is your quotation ${quoteNumberLabel(q.number)} — ${q.title}:\n\n${lineText}\n\nTotal: ${total}${validity}\n\nReply to approve and we'll get started.\n\nAZMIN Digital`;

  await sendOnChannel(workspaceId, "EMAIL", q.contactEmail, q.contactName, `Quotation ${quoteNumberLabel(q.number)}\n\n${message}`);
  await sendOnChannel(workspaceId, "WHATSAPP", q.contactPhone, q.contactName, message);

  if (q.status === "DRAFT" || q.status === "DECLINED") {
    await prisma.quote.updateMany({ where: { id, workspaceId }, data: { status: "SENT" } });
  }
  // Advance a linked lead into PROPOSAL when its quote goes out.
  if (q.leadId) {
    await prisma.lead.updateMany({ where: { id: q.leadId, workspaceId, stage: { in: ["NEW", "QUALIFIED"] } }, data: { stage: "PROPOSAL" } });
  }
  void createdById;
  return { ok: true };
}

// Accept the quote → convert to a Client + Work Order (auto-invoiced) and mark
// any linked lead WON. Idempotent: an already-accepted quote does nothing.
export async function acceptQuote(workspaceId: string, id: string, createdById: string | null): Promise<{ ok: boolean; error?: string }> {
  const q = await prisma.quote.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!q) return { ok: false, error: "Not found" };
  if (q.status === "ACCEPTED") return { ok: true };

  // Resolve a client: use the linked one, else create from the quote contact.
  let clientId = q.clientId;
  if (!clientId) {
    const client = await createClient(workspaceId, createdById, {
      name: q.contactName, email: q.contactEmail, phone: q.contactPhone,
      notes: q.leadId ? "Won from quote (lead)" : "Won from quote",
    });
    clientId = client.id;
  }

  // One Work Order carrying the quote total (auto-posts a pending invoice).
  const work = await createWork(workspaceId, createdById, {
    clientId,
    title: q.title,
    quantity: 1,
    unitPriceCents: q.subtotalCents > 0 ? q.subtotalCents : null,
    status: "ACTIVE",
    notes: `From quote ${quoteNumberLabel(q.number)}`,
  });

  await prisma.quote.updateMany({ where: { id, workspaceId }, data: { status: "ACCEPTED", acceptedAt: new Date(), clientId, convertedWorkId: work.id } });

  // Move a linked lead to WON directly (skip the lead's own convert to avoid a
  // duplicate client/work — this quote already did it).
  if (q.leadId) {
    await prisma.lead.updateMany({ where: { id: q.leadId, workspaceId }, data: { stage: "WON", wonAt: new Date(), clientId, workId: work.id } });
  }
  return { ok: true };
}

export async function declineQuote(workspaceId: string, id: string): Promise<number> {
  const result = await prisma.quote.updateMany({ where: { id, workspaceId, deletedAt: null, status: { not: "ACCEPTED" } }, data: { status: "DECLINED" } });
  return result.count;
}

async function sendOnChannel(workspaceId: string, channel: "EMAIL" | "WHATSAPP", recipient: string | null, contactName: string, text: string) {
  if (!recipient) return;
  const conn = (await prisma.channelConnection.findFirst({ where: { workspaceId, channel, status: "CONNECTED" } })) as unknown as NonNullable<ConnectionRow> | null;
  const result = await sendViaChannel({
    action: channel === "EMAIL" ? "SEND_EMAIL" : "SEND_WHATSAPP",
    channel, connection: conn, message: text, recipient,
  });
  await recordOutbound(workspaceId, { channel, contact: recipient, contactName, text, status: result.status });
}
