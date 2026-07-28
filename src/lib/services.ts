import { prisma } from "@/lib/db";
import type { ServiceInput } from "@/lib/services-catalog";

/**
 * Universal service catalogue (Phase 2, database access). Services are
 * workspace-scoped; a service may be shared (companyId null) or tied to one
 * company. All reads and writes are scoped by workspaceId so no tenant can see
 * another's catalogue. The pure helpers (labels, price formatting, types) live
 * in "@/lib/services-catalog" and are re-exported here.
 */
export * from "@/lib/services-catalog";

// List active services. When companyId is given, returns that company's own
// services plus shared (company-less) catalogue items.
export async function getServices(workspaceId: string, companyId?: string) {
  return prisma.service.findMany({
    where: {
      workspaceId,
      status: { not: "ARCHIVED" },
      ...(companyId !== undefined ? { OR: [{ companyId }, { companyId: null }] } : {}),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getService(workspaceId: string, id: string) {
  return prisma.service.findFirst({ where: { id, workspaceId } });
}

export async function createService(workspaceId: string, createdById: string | null, input: ServiceInput) {
  return prisma.service.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      name: input.name,
      category: input.category,
      description: input.description ?? null,
      pricingModel: input.pricingModel,
      priceCents: input.priceCents ?? null,
      currency: input.currency ?? "AED",
      unit: input.unit ?? null,
      companyId: input.companyId ?? null,
    },
  });
}

// Scoped update — the where clause pins workspaceId so a foreign id can never
// be written. Returns the affected count.
export async function updateService(
  workspaceId: string,
  id: string,
  data: Partial<ServiceInput> & { status?: string },
) {
  const result = await prisma.service.updateMany({
    where: { id, workspaceId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.pricingModel !== undefined ? { pricingModel: data.pricingModel } : {}),
      ...(data.priceCents !== undefined ? { priceCents: data.priceCents } : {}),
      ...(data.currency !== undefined ? { currency: data.currency } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.companyId !== undefined ? { companyId: data.companyId } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });
  return result.count;
}

export async function archiveService(workspaceId: string, id: string) {
  const result = await prisma.service.updateMany({ where: { id, workspaceId }, data: { status: "ARCHIVED" } });
  return result.count;
}
