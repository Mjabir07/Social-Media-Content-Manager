import { prisma } from "@/lib/db";
import { encryptCredential } from "@/lib/integrations/credential-crypto";
import { connectionProviderTag } from "@/lib/channel-adapters";

/**
 * External channel connections (Meta, WhatsApp, Email…). Secrets are encrypted
 * with the app master key and never returned to the browser. All access is
 * scoped by workspaceId. A connection may be shared (companyId null) or bound
 * to one company.
 */

// Public shape returned to clients — no secret material.
const publicSelect = {
  id: true, channel: true, displayName: true, status: true, companyId: true, meta: true,
  createdAt: true, updatedAt: true,
} as const;

export async function getConnections(workspaceId: string, companyId?: string) {
  return prisma.channelConnection.findMany({
    where: { workspaceId, ...(companyId !== undefined ? { OR: [{ companyId }, { companyId: null }] } : {}) },
    select: publicSelect,
    orderBy: [{ channel: "asc" }, { displayName: "asc" }],
  });
}

export type ConnectionInput = {
  channel: string;
  displayName: string;
  secret?: string | null;
  companyId?: string | null;
  meta?: string | null;
};

export async function createConnection(workspaceId: string, createdById: string | null, input: ConnectionInput) {
  const enc = input.secret
    ? encryptCredential({ secret: input.secret, workspaceId, provider: connectionProviderTag(input.channel) })
    : null;
  return prisma.channelConnection.create({
    data: {
      workspaceId,
      companyId: input.companyId ?? null,
      channel: input.channel,
      displayName: input.displayName,
      createdById: createdById ?? undefined,
      meta: input.meta ?? null,
      ...(enc ? { encryptedConfig: enc.encryptedValue, iv: enc.iv, authTag: enc.authTag, keyVersion: enc.keyVersion } : {}),
    },
    select: publicSelect,
  });
}

// Rotate the stored secret (scoped).
export async function updateConnectionSecret(workspaceId: string, id: string, secret: string) {
  const conn = await prisma.channelConnection.findFirst({ where: { id, workspaceId }, select: { id: true, channel: true } });
  if (!conn) return 0;
  const enc = encryptCredential({ secret, workspaceId, provider: connectionProviderTag(conn.channel) });
  const result = await prisma.channelConnection.updateMany({
    where: { id, workspaceId },
    data: { encryptedConfig: enc.encryptedValue, iv: enc.iv, authTag: enc.authTag, keyVersion: enc.keyVersion, status: "CONNECTED" },
  });
  return result.count;
}

export async function setConnectionStatus(workspaceId: string, id: string, status: string) {
  const result = await prisma.channelConnection.updateMany({ where: { id, workspaceId }, data: { status } });
  return result.count;
}

export async function deleteConnection(workspaceId: string, id: string) {
  const result = await prisma.channelConnection.deleteMany({ where: { id, workspaceId } });
  return result.count;
}
