import { prisma } from "@/lib/db";
import { createTransaction } from "@/lib/finance";
import { isWorkStatus, type WorkStatus } from "@/lib/works-catalog";

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
  amountCents: number | null;
  currency: string;
  status: WorkStatus;
  startDate: Date | null;
  notes: string | null;
  createdAt: Date;
};

function toDTO(w: {
  id: string; clientId: string; title: string; serviceType: string | null; endCustomer: string | null;
  amountCents: number | null; currency: string; status: string; startDate: Date | null; notes: string | null; createdAt: Date;
}): WorkDTO {
  return { ...w, status: isWorkStatus(w.status) ? w.status : "ACTIVE" };
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
  amountCents?: number | null;
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

export async function createWork(workspaceId: string, createdById: string | null, input: WorkInput) {
  const created = await prisma.work.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      clientId: input.clientId,
      title: input.title.trim(),
      serviceType: input.serviceType?.trim() || null,
      endCustomer: input.endCustomer?.trim() || null,
      amountCents: input.amountCents ?? null,
      currency: input.currency ?? "AED",
      status: isWorkStatus(input.status) ? input.status : "ACTIVE",
      startDate: normalizeDate(input.startDate),
      notes: input.notes?.trim() || null,
    },
  });
  return toDTO(created);
}

export async function updateWork(workspaceId: string, id: string, patch: Partial<WorkInput>) {
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title.trim();
  if (patch.serviceType !== undefined) data.serviceType = patch.serviceType?.trim() || null;
  if (patch.endCustomer !== undefined) data.endCustomer = patch.endCustomer?.trim() || null;
  if (patch.amountCents !== undefined) data.amountCents = patch.amountCents ?? null;
  if (patch.currency !== undefined) data.currency = patch.currency;
  if (patch.status !== undefined && isWorkStatus(patch.status)) data.status = patch.status;
  if (patch.startDate !== undefined) data.startDate = normalizeDate(patch.startDate);
  if (patch.notes !== undefined) data.notes = patch.notes?.trim() || null;
  const result = await prisma.work.updateMany({ where: { id, workspaceId, deletedAt: null }, data });
  return result.count;
}

export async function deleteWork(workspaceId: string, id: string) {
  const result = await prisma.work.updateMany({ where: { id, workspaceId, deletedAt: null }, data: { deletedAt: new Date() } });
  return result.count;
}

// Bill a work: post its amount as PENDING income against the parent client, so
// the money shows in the client's Finance tab. The reseller client is always the
// bill-to; the end-customer is noted in the description for reference.
export async function billWork(workspaceId: string, id: string, createdById: string | null = null): Promise<{ ok: boolean; error?: string }> {
  const work = await prisma.work.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!work) return { ok: false, error: "Not found" };
  if (!work.amountCents || work.amountCents <= 0) return { ok: false, error: "Set an amount before billing this work." };
  const forWhom = work.endCustomer ? ` (for ${work.endCustomer})` : "";
  await createTransaction(workspaceId, createdById, {
    type: "INCOME", amountCents: work.amountCents, currency: work.currency, category: "SERVICE",
    clientId: work.clientId, vendor: null,
    description: `${work.title}${forWhom}`, date: new Date(), status: "PENDING",
  });
  return { ok: true };
}
