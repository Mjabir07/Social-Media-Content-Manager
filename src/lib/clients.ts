import { prisma } from "@/lib/db";
import { daysUntil } from "@/lib/renewals-core";

/**
 * Clients — the hub record. Each client rolls up its vault credentials and
 * service renewals so the list can show counts + the next renewal at a glance.
 * Workspace-scoped, soft-deleted. Deleting a client unlinks (never deletes) its
 * credentials and renewals.
 */

export type ClientDTO = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  credentialCount: number;
  renewalCount: number;
  nextRenewalDate: string | null;
  nextRenewalDaysLeft: number | null;
};

async function rollUp(workspaceId: string, clientId: string, now: Date) {
  const [credentialCount, renewalCount, nextRenewal] = await Promise.all([
    prisma.vaultCredential.count({ where: { workspaceId, clientId, deletedAt: null } }),
    prisma.renewal.count({ where: { workspaceId, clientId, deletedAt: null } }),
    prisma.renewal.findFirst({
      where: { workspaceId, clientId, deletedAt: null, status: "ACTIVE" },
      orderBy: { renewalDate: "asc" },
      select: { renewalDate: true },
    }),
  ]);
  return {
    credentialCount,
    renewalCount,
    nextRenewalDate: nextRenewal ? nextRenewal.renewalDate.toISOString() : null,
    nextRenewalDaysLeft: nextRenewal ? daysUntil(nextRenewal.renewalDate, now) : null,
  };
}

export async function getClients(workspaceId: string): Promise<ClientDTO[]> {
  const now = new Date();
  const rows = await prisma.client.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return Promise.all(
    rows.map(async (c) => ({
      id: c.id, name: c.name, contactName: c.contactName, email: c.email, phone: c.phone,
      status: c.status, notes: c.notes, ...(await rollUp(workspaceId, c.id, now)),
    })),
  );
}

export async function getClient(workspaceId: string, id: string): Promise<ClientDTO | null> {
  const c = await prisma.client.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!c) return null;
  return {
    id: c.id, name: c.name, contactName: c.contactName, email: c.email, phone: c.phone,
    status: c.status, notes: c.notes, ...(await rollUp(workspaceId, c.id, new Date())),
  };
}

export type ClientInput = {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  status?: string;
};

export async function createClient(workspaceId: string, createdById: string | null, input: ClientInput) {
  return prisma.client.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      name: input.name.trim(),
      contactName: input.contactName?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    },
  });
}

export async function updateClient(workspaceId: string, id: string, patch: Partial<ClientInput>) {
  const data: Record<string, unknown> = {};
  if (patch.name !== undefined) data.name = patch.name.trim();
  if (patch.contactName !== undefined) data.contactName = patch.contactName?.trim() || null;
  if (patch.email !== undefined) data.email = patch.email?.trim() || null;
  if (patch.phone !== undefined) data.phone = patch.phone?.trim() || null;
  if (patch.notes !== undefined) data.notes = patch.notes?.trim() || null;
  if (patch.status !== undefined) data.status = patch.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
  const result = await prisma.client.updateMany({ where: { id, workspaceId, deletedAt: null }, data });
  return result.count;
}

// Soft delete the client and unlink (keep) its credentials + renewals.
export async function deleteClient(workspaceId: string, id: string) {
  const result = await prisma.client.updateMany({ where: { id, workspaceId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (result.count > 0) {
    await Promise.all([
      prisma.vaultCredential.updateMany({ where: { workspaceId, clientId: id }, data: { clientId: null } }),
      prisma.renewal.updateMany({ where: { workspaceId, clientId: id }, data: { clientId: null } }),
    ]);
  }
  return result.count;
}
