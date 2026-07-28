import { prisma } from "@/lib/db";
import { commissionOwed, settlement, type CommissionTerms } from "@/lib/commissions-catalog";

/**
 * Partnerships and commission settlement (DB access). Workspace-scoped
 * throughout. Commission earned is derived from the partner's WON leads and the
 * agreement terms; payments record (often partial) settlements. The pure math
 * lives in "@/lib/commissions-catalog" and is re-exported.
 */
export * from "@/lib/commissions-catalog";

export async function getPartnerships(workspaceId: string) {
  return prisma.partnership.findMany({
    where: { workspaceId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { partnerCompany: { select: { id: true, name: true } } },
  });
}

export async function getPartnership(workspaceId: string, id: string) {
  return prisma.partnership.findFirst({ where: { id, workspaceId }, include: { partnerCompany: { select: { id: true, name: true } } } });
}

export type PartnershipInput = {
  partnerCompanyId: string;
  name?: string | null;
  commissionType: string;
  commissionRateBps?: number;
  commissionFlatCents?: number | null;
  currency?: string;
  notes?: string | null;
  status?: string;
};

export async function createPartnership(workspaceId: string, createdById: string | null, input: PartnershipInput) {
  return prisma.partnership.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      partnerCompanyId: input.partnerCompanyId,
      name: input.name ?? null,
      commissionType: input.commissionType,
      commissionRateBps: input.commissionRateBps ?? 1000,
      commissionFlatCents: input.commissionFlatCents ?? null,
      currency: input.currency ?? "AED",
      notes: input.notes ?? null,
      status: input.status ?? "ACTIVE",
    },
  });
}

export async function updatePartnership(workspaceId: string, id: string, data: Partial<PartnershipInput>) {
  const result = await prisma.partnership.updateMany({
    where: { id, workspaceId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.commissionType !== undefined ? { commissionType: data.commissionType } : {}),
      ...(data.commissionRateBps !== undefined ? { commissionRateBps: data.commissionRateBps } : {}),
      ...(data.commissionFlatCents !== undefined ? { commissionFlatCents: data.commissionFlatCents } : {}),
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });
  return result.count;
}

// Record a (possibly partial) commission payment. Verifies the partnership
// belongs to the workspace first so a foreign id can never be paid against.
export async function recordPayment(workspaceId: string, createdById: string | null, input: { partnershipId: string; amountCents: number; leadId?: string | null; note?: string | null; currency?: string }) {
  const partnership = await prisma.partnership.findFirst({ where: { id: input.partnershipId, workspaceId }, select: { id: true, currency: true } });
  if (!partnership) return null;
  return prisma.commissionPayment.create({
    data: {
      workspaceId,
      partnershipId: input.partnershipId,
      leadId: input.leadId ?? null,
      amountCents: input.amountCents,
      currency: input.currency ?? partnership.currency,
      note: input.note ?? null,
      createdById: createdById ?? undefined,
    },
  });
}

/**
 * Settlement for one partnership: commission earned from its WON leads vs total
 * paid, giving the outstanding balance. This is the Phase 2 exit-gate number.
 */
export async function getPartnershipSettlement(workspaceId: string, partnershipId: string) {
  const partnership = await prisma.partnership.findFirst({ where: { id: partnershipId, workspaceId } });
  if (!partnership) return null;

  const terms: CommissionTerms = {
    commissionType: partnership.commissionType,
    commissionRateBps: partnership.commissionRateBps,
    commissionFlatCents: partnership.commissionFlatCents,
  };

  const wonLeads = await prisma.lead.findMany({ where: { workspaceId, partnershipId, stage: "WON" }, select: { valueCents: true } });
  const earnedCents = wonLeads.reduce((sum, lead) => sum + commissionOwed(terms, lead.valueCents), 0);

  const payments = await prisma.commissionPayment.findMany({ where: { workspaceId, partnershipId }, select: { amountCents: true } });
  const paidCents = payments.reduce((sum, p) => sum + p.amountCents, 0);

  return { ...settlement(earnedCents, paidCents), wonCount: wonLeads.length, currency: partnership.currency };
}
