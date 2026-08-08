import { prisma } from "@/lib/db";
import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/finance";
import { isWorkStatus, computeAmountCents, type WorkStatus } from "@/lib/works-catalog";

/**
 * Works (DB access). Workspace-scoped, always tied to a client, soft-deleted.
 * Pure logic lives in "@/lib/works-catalog" and is re-exported.
 */
export * from "@/lib/works-catalog";

export type WorkDTO = {
  id: string;
  clientId: string;
  title: string;
  serviceType: string | null;
  endCustomer: string | null;
  quantity: number;
  unitPriceCents: number | null;
  amountCents: number | null;
  currency: string;
  status: WorkStatus;
  invoiced: boolean;
  startDate: Date | null;
  notes: string | null;
  createdAt: Date;
};

function toDTO(w: {
  id: string; clientId: string; title: string; serviceType: string | null; endCustomer: string | null;
  quantity: number; unitPriceCents: number | null; amountCents: number | null; currency: string; status: string;
  invoiceTxnId: string | null; startDate: Date | null; notes: string | null; createdAt: Date;
}): WorkDTO {
  return {
    id: w.id, clientId: w.clientId, title: w.title, serviceType: w.serviceType, endCustomer: w.endCustomer,
    quantity: w.quantity, unitPriceCents: w.unitPriceCents, amountCents: w.amountCents, currency: w.currency,
    status: isWorkStatus(w.status) ? w.status : "ACTIVE", invoiced: w.invoiceTxnId != null,
    startDate: w.startDate, notes: w.notes, createdAt: w.createdAt,
  };
}

export async function getWorks(workspaceId: string, clientId: string): Promise<WorkDTO[]> {
  const rows = await prisma.work.findMany({
    where: { workspaceId, clientId, deletedAt: null },
    orderBy: [{ createdAt: "desc" }],
  });
  return rows.map(toDTO);
}

export async function countWorks(workspaceId: string, clientId: string): Promise<number> {
  return prisma.work.count({ where: { workspaceId, clientId, deletedAt: null } });
}

export type WorkInput = {
  clientId: string;
  title: string;
  serviceType?: string | null;
  endCustomer?: string | null;
  quantity?: number | null;
  unitPriceCents?: number | null;
  currency?: string;
  status?: WorkStatus;
  startDate?: string | Date | null;
  notes?: string | null;
};

function normalizeDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type WorkRow = {
  id: string; clientId: string; title: string; endCustomer: string | null; amountCents: number | null;
  currency: string; invoiceTxnId: string | null;
};

function invoiceDescription(w: { title: string; endCustomer: string | null }): string {
  return w.endCustomer ? `${w.title} (for ${w.endCustomer})` : w.title;
}

// Keep the linked Finance income line in sync with the work's amount. Creates it
// (PENDING) when there's an amount and none exists, updates it when the amount or
// label changes, and removes it when the amount drops to zero. Returns the txn id
// to store back on the work (or null).
async function syncInvoice(workspaceId: string, createdById: string | null, w: WorkRow): Promise<string | null> {
  const amount = w.amountCents ?? 0;
  if (amount > 0) {
    if (w.invoiceTxnId) {
      const updated = await updateTransaction(workspaceId, w.invoiceTxnId, {
        amountCents: amount, currency: w.currency, description: invoiceDescription(w),
      });
      if (updated > 0) return w.invoiceTxnId; // still there
      // txn was deleted out from under us — fall through and re-create
    }
    const txn = await createTransaction(workspaceId, createdById, {
      type: "INCOME", amountCents: amount, currency: w.currency, category: "SERVICE",
      clientId: w.clientId, vendor: null, description: invoiceDescription(w), date: new Date(), status: "PENDING",
    });
    return txn.id;
  }
  // No amount → drop any existing invoice line.
  if (w.invoiceTxnId) await deleteTransaction(workspaceId, w.invoiceTxnId);
  return null;
}

export async function createWork(workspaceId: string, createdById: string | null, input: WorkInput) {
  const quantity = Math.max(1, Math.round(input.quantity ?? 1));
  const unitPriceCents = input.unitPriceCents ?? null;
  const amountCents = computeAmountCents(quantity, unitPriceCents);
  const currency = input.currency ?? "AED";

  const created = await prisma.work.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      clientId: input.clientId,
      title: input.title.trim(),
      serviceType: input.serviceType?.trim() || null,
      endCustomer: input.endCustomer?.trim() || null,
      quantity,
      unitPriceCents,
      amountCents,
      currency,
      status: isWorkStatus(input.status) ? input.status : "ACTIVE",
      startDate: normalizeDate(input.startDate),
      notes: input.notes?.trim() || null,
    },
  });

  // Auto-create the pending invoice line and link it back.
  const txnId = await syncInvoice(workspaceId, createdById, created);
  if (txnId !== created.invoiceTxnId) {
    await prisma.work.update({ where: { id: created.id }, data: { invoiceTxnId: txnId } });
    created.invoiceTxnId = txnId;
  }
  return toDTO(created);
}

export async function updateWork(workspaceId: string, id: string, createdById: string | null, patch: Partial<WorkInput>) {
  const existing = await prisma.work.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!existing) return 0;

  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title.trim();
  if (patch.serviceType !== undefined) data.serviceType = patch.serviceType?.trim() || null;
  if (patch.endCustomer !== undefined) data.endCustomer = patch.endCustomer?.trim() || null;
  if (patch.currency !== undefined) data.currency = patch.currency;
  if (patch.status !== undefined && isWorkStatus(patch.status)) data.status = patch.status;
  if (patch.startDate !== undefined) data.startDate = normalizeDate(patch.startDate);
  if (patch.notes !== undefined) data.notes = patch.notes?.trim() || null;

  // Recompute the amount whenever quantity or unit price changes.
  const quantity = patch.quantity !== undefined ? Math.max(1, Math.round(patch.quantity ?? 1)) : existing.quantity;
  const unitPriceCents = patch.unitPriceCents !== undefined ? (patch.unitPriceCents ?? null) : existing.unitPriceCents;
  if (patch.quantity !== undefined) data.quantity = quantity;
  if (patch.unitPriceCents !== undefined) data.unitPriceCents = unitPriceCents;
  if (patch.quantity !== undefined || patch.unitPriceCents !== undefined) {
    data.amountCents = computeAmountCents(quantity, unitPriceCents);
  }

  await prisma.work.updateMany({ where: { id, workspaceId, deletedAt: null }, data });

  // Re-sync the linked invoice against the fresh row.
  const fresh = await prisma.work.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (fresh) {
    const txnId = await syncInvoice(workspaceId, createdById, fresh);
    if (txnId !== fresh.invoiceTxnId) {
      await prisma.work.update({ where: { id }, data: { invoiceTxnId: txnId } });
    }
  }
  return 1;
}

export async function deleteWork(workspaceId: string, id: string) {
  const work = await prisma.work.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!work) return 0;
  await prisma.work.updateMany({ where: { id, workspaceId, deletedAt: null }, data: { deletedAt: new Date(), invoiceTxnId: null } });
  // Remove the linked pending invoice — a deleted work order shouldn't keep billing.
  if (work.invoiceTxnId) await deleteTransaction(workspaceId, work.invoiceTxnId);
  return 1;
}
