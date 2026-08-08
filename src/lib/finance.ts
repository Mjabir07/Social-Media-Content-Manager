import { prisma } from "@/lib/db";
import { computeSummary, byCategory, byClient, isTxType, isTxStatus, type TxType, type TxStatus } from "@/lib/finance-core";

/**
 * Finance ledger (DB access). Workspace-scoped, soft-deleted. The pure roll-ups
 * live in "@/lib/finance-core" and are re-exported.
 */
export * from "@/lib/finance-core";

export type TxFilters = { type?: TxType; clientId?: string; from?: string; to?: string };

function dateRange(from?: string, to?: string) {
  const range: { gte?: Date; lte?: Date } = {};
  if (from) { const d = new Date(from); if (!Number.isNaN(d.getTime())) range.gte = d; }
  if (to) { const d = new Date(to); if (!Number.isNaN(d.getTime())) { d.setHours(23, 59, 59, 999); range.lte = d; } }
  return Object.keys(range).length ? range : undefined;
}

export async function getTransactions(workspaceId: string, filters: TxFilters = {}) {
  const range = dateRange(filters.from, filters.to);
  return prisma.transaction.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(range ? { date: range } : {}),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export type TransactionInput = {
  type: TxType;
  amountCents: number;
  currency?: string;
  category: string;
  clientId?: string | null;
  renewalId?: string | null;
  vendor?: string | null;
  description?: string | null;
  date: string | Date;
  status?: TxStatus;
  method?: string | null;
};

function normalizeDate(d: string | Date): Date {
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function createTransaction(workspaceId: string, createdById: string | null, input: TransactionInput) {
  return prisma.transaction.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      clientId: input.clientId ?? null,
      renewalId: input.renewalId ?? null,
      type: isTxType(input.type) ? input.type : "EXPENSE",
      amountCents: Math.max(0, Math.round(input.amountCents)),
      currency: input.currency ?? "AED",
      category: input.category,
      vendor: input.vendor?.trim() || null,
      description: input.description?.trim() || null,
      date: normalizeDate(input.date),
      status: isTxStatus(input.status) ? input.status : "PAID",
      method: input.method?.trim() || null,
    },
  });
}

export async function updateTransaction(workspaceId: string, id: string, patch: Partial<TransactionInput>) {
  const data: Record<string, unknown> = {};
  if (patch.type !== undefined && isTxType(patch.type)) data.type = patch.type;
  if (patch.amountCents !== undefined) data.amountCents = Math.max(0, Math.round(patch.amountCents));
  if (patch.currency !== undefined) data.currency = patch.currency;
  if (patch.category !== undefined) data.category = patch.category;
  if (patch.clientId !== undefined) data.clientId = patch.clientId ?? null;
  if (patch.vendor !== undefined) data.vendor = patch.vendor?.trim() || null;
  if (patch.description !== undefined) data.description = patch.description?.trim() || null;
  if (patch.date !== undefined) data.date = normalizeDate(patch.date);
  if (patch.status !== undefined && isTxStatus(patch.status)) data.status = patch.status;
  if (patch.method !== undefined) data.method = patch.method?.trim() || null;
  const result = await prisma.transaction.updateMany({ where: { id, workspaceId, deletedAt: null }, data });
  return result.count;
}

export async function deleteTransaction(workspaceId: string, id: string) {
  const result = await prisma.transaction.updateMany({ where: { id, workspaceId, deletedAt: null }, data: { deletedAt: new Date() } });
  return result.count;
}

export type FinanceReport = {
  summary: ReturnType<typeof computeSummary>;
  categories: ReturnType<typeof byCategory>;
  clientPnL: Array<{ clientId: string; name: string; incomeCents: number; expenseCents: number; netCents: number }>;
};

// A full report for a range: headline summary + per-category + per-client P&L
// (with client names resolved).
export async function getFinanceReport(workspaceId: string, filters: TxFilters = {}): Promise<FinanceReport> {
  const rows = await getTransactions(workspaceId, filters);
  const like = rows.map((r) => ({ type: r.type as TxType, amountCents: r.amountCents, status: r.status as TxStatus, category: r.category, clientId: r.clientId }));
  const summary = computeSummary(like);
  const categories = byCategory(like);
  const pnl = byClient(like);

  const clientIds = pnl.map((p) => p.clientId);
  const clients = clientIds.length
    ? await prisma.client.findMany({ where: { workspaceId, id: { in: clientIds } }, select: { id: true, name: true } })
    : [];
  const nameOf = new Map(clients.map((c) => [c.id, c.name]));
  const clientPnL = pnl.map((p) => ({ ...p, name: nameOf.get(p.clientId) ?? "Unknown" }));

  return { summary, categories, clientPnL };
}
