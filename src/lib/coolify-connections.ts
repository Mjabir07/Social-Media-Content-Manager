import { prisma } from "@/lib/db";
import { encryptCredential, decryptCredential } from "@/lib/integrations/credential-crypto";

/**
 * Coolify connection storage. The API token is encrypted with the app master key
 * (same vault crypto) and never returned to the browser. Scoped by workspaceId.
 */

const COOLIFY_PROVIDER = "coolify";

const publicSelect = {
  id: true, name: true, baseUrl: true, status: true, lastError: true, lastCheckedAt: true, createdAt: true, updatedAt: true,
} as const;

export async function getCoolifyConnections(workspaceId: string) {
  return prisma.coolifyConnection.findMany({ where: { workspaceId }, select: publicSelect, orderBy: { createdAt: "desc" } });
}

export async function createCoolifyConnection(workspaceId: string, createdById: string | null, input: { name: string; baseUrl: string; token: string }) {
  const enc = encryptCredential({ secret: input.token, workspaceId, provider: COOLIFY_PROVIDER });
  return prisma.coolifyConnection.create({
    data: {
      workspaceId,
      createdById: createdById ?? undefined,
      name: input.name,
      baseUrl: input.baseUrl.trim().replace(/\/+$/, ""),
      encryptedToken: enc.encryptedValue,
      iv: enc.iv,
      authTag: enc.authTag,
      keyVersion: enc.keyVersion,
    },
    select: publicSelect,
  });
}

// Decrypt a connection's token (server-only callers). Returns base URL + token.
export async function getCoolifyCredentials(workspaceId: string, id: string): Promise<{ baseUrl: string; token: string } | null> {
  const row = await prisma.coolifyConnection.findFirst({ where: { id, workspaceId } });
  if (!row?.encryptedToken || !row.iv || !row.authTag) return null;
  try {
    const token = decryptCredential({ encryptedValue: row.encryptedToken, iv: row.iv, authTag: row.authTag, keyVersion: row.keyVersion, workspaceId, provider: COOLIFY_PROVIDER });
    return { baseUrl: row.baseUrl, token };
  } catch {
    return null;
  }
}

export async function setCoolifyStatus(workspaceId: string, id: string, status: string, lastError: string | null) {
  const result = await prisma.coolifyConnection.updateMany({ where: { id, workspaceId }, data: { status, lastError, lastCheckedAt: new Date() } });
  return result.count;
}

export async function deleteCoolifyConnection(workspaceId: string, id: string) {
  const result = await prisma.coolifyConnection.deleteMany({ where: { id, workspaceId } });
  return result.count;
}
