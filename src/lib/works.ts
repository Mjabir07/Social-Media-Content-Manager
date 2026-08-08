import { prisma } from "@/lib/db";
import { createTransaction, updateTransaction, deleteTransaction } from "@/lib/finance";
import { isWorkStatus, computeAmountCents, computeProfitCents, type WorkStatus } from "@/lib/works-catalog";

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
  unitCostCents: number | null;
  costCents: number | null;
  profitCents: number | null;
  currency: string;
  status: WorkStatus;
  invoiced: boolean;
  startDate: Date | null;
  notes: string | null;
  createdAt: Date;
};

function toDTO(w: {
  id: string; clientId: string; title: string; serviceType: string | null; endCustomer: string | null;
  quantity: number; unitPriceCents: number | null; amountCents: number | null; unitCostCents: number | null; costCents: number | null;
  currency: string; status: string; invoiceTxnId: string | null; startDate: Date | null; notes: string | null; createdAt: Date;
}): WorkDTO {
  return {
    id: w.id, clientId: w.clientId, title: w.title, serviceType: w.serviceType, endCustomer: w.endCustomer,
    quantity: w.quantity, unitPriceCents: w.unitPriceCents, amountCents: w.amountCents,
    unitCostCents: w.unitCostCents, costCents: w.costCents, profitCents: computeProfitCents(w.amountCents, w.costCents),
    currency: w.currency, status: isWorkStatus(w.status) ? w.status : "ACTIVE", invoiced: w.invoiceTxnId != null,
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
  unitCostCents?: number | null;
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
  id: string; clientId: string; title: string; endCustomer: string | null;
  amountCents: number | null; costCents: number | null; currency: string;
  invoiceTxnId: string | null; costTxnId: string | null;
};

function lineDescription(w: { title: string; endCustomer: string | null }, suffix = ""): string {
  const base = w.endCustomer ? `${w.title} (for ${w.endCustomer})` : w.title;
  return suffix ? `${base}${suffix}` : base;
}

// Keep one linked Finance line (income or expense) in sync with a work amount.
// Creates it PENDING when there's a positive amount and none exists, updates it
// when the amount/label changes, removes it when the amount is zero. Returns the
// txn id to store back on the work (or null).
async function syncFinanceLine(
  workspaceId: string,
  createdById: string | null,
  w: WorkRow,
  kind: "INCOME" | "EXPENSE",
): Promise<string | null> {
  const isIncome = kind === "INCOME";
  const amount = (isIncome ? w.amountCents : w.costCents) ?? 0;
  const existingId = isIncome ? w.invoiceTxnId : w.costTxnId;
  const category = isIncome ? "SERVICE" : "VENDOR_COST";
  const description = lineDescription(w, isIncome ? "" : " — vendor cost");

  if (amount > 0) {
    if (existingId) {
      const updated = await updateTransaction(workspaceId, existingId, { amountCents: amount, currency: w.currency, description });
      if (updated > 0) return existingId;
      // txn deleted out from under us — re-create below
    }
    const txn = await createTransaction(workspaceId, createdById, {
      type: kind, amountCents: amount, currency: w.currency, category,
      clientId: w.clientId, vendor: null, description, date: new Date(), status: "PENDING",
    });
    return txn.id;
  }
  if (existingId) await deleteTransaction(workspaceId, existingId);
  return null;
}

async function syncFinance(workspaceId: string, createdById: string | null, workId: string) {
  const fresh = await prisma.work.findFirst({ where: { id: workId, workspaceId, deletedAt: null } });
  if (!fresh) return;
  const invoiceTxnId = await syncFinanceLine(workspaceId, createdById, fresh, "INCOME");
  const costTxnId = await syncFinanceLine(workspaceId, createdById, fresh, "EXPENSE");
  if (invoiceTxnId !== fresh.invoiceTxnId || costTxnId !== fresh.costTxnId) {
    await prisma.work.update({ where: { id: workId }, data: { invoiceTxnId, costTxnId } });
  }
}

export async function createWork(workspaceId: string, createdById: string | null, input: WorkInput) {
  const quantity = Math.max(1, Math.round(input.quantity ?? 1));
  const unitPriceCents = input.unitPriceCents ?? null;
  const unitCostCents = input.unitCostCents ?? null;

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
      amountCents: computeAmountCents(quantity, unitPriceCents),
      unitCostCents,
      costCents: computeAmountCents(quantity, unitCostCents),
      currency: input.currency ?? "AED",
      status: isWorkStatus(input.status) ? input.status : "ACTIVE",
      startDate: normalizeDate(input.startDate),
      notes: input.notes?.trim() || null,
    },
  });

  await syncFinance(workspaceId, createdById, created.id);
  return getWorkById(workspaceId, created.id);
}

async function getWorkById(workspaceId: string, id: string): Promise<WorkDTO> {
  const w = await prisma.work.findFirstOrThrow({ where: { id, workspaceId } });
  return toDTO(w);
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

  // Recompute revenue/cost totals whenever quantity or either unit figure changes.
  const quantity = patch.quantity !== undefined ? Math.max(1, Math.round(patch.quantity ?? 1)) : existing.quantity;
  const unitPriceCents = patch.unitPriceCents !== undefined ? (patch.unitPriceCents ?? null) : existing.unitPriceCents;
  const unitCostCents = patch.unitCostCents !== undefined ? (patch.unitCostCents ?? null) : existing.unitCostCents;
  if (patch.quantity !== undefined) data.quantity = quantity;
  if (patch.unitPriceCents !== undefined) data.unitPriceCents = unitPriceCents;
  if (patch.unitCostCents !== undefined) data.unitCostCents = unitCostCents;
  const qtyOrPriceChanged = patch.quantity !== undefined || patch.unitPriceCents !== undefined;
  const qtyOrCostChanged = patch.quantity !== undefined || patch.unitCostCents !== undefined;
  if (qtyOrPriceChanged) data.amountCents = computeAmountCents(quantity, unitPriceCents);
  if (qtyOrCostChanged) data.costCents = computeAmountCents(quantity, unitCostCents);

  await prisma.work.updateMany({ where: { id, workspaceId, deletedAt: null }, data });
  await syncFinance(workspaceId, createdById, id);
  return 1;
}

export async function deleteWork(workspaceId: string, id: string) {
  const work = await prisma.work.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!work) return 0;
  await prisma.work.updateMany({ where: { id, workspaceId, deletedAt: null }, data: { deletedAt: new Date(), invoiceTxnId: null, costTxnId: null } });
  // Remove the linked pending income + cost — a deleted work order shouldn't keep billing.
  if (work.invoiceTxnId) await deleteTransaction(workspaceId, work.invoiceTxnId);
  if (work.costTxnId) await deleteTransaction(workspaceId, work.costTxnId);
  return 1;
}
