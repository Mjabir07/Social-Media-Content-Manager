import "server-only";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import type { CurrentUser } from "@/lib/session";
import { encryptCredential, decryptCredential, isCredentialVaultReady } from "@/lib/integrations/credential-crypto";
import { isVaultCategory, type VaultCategory } from "@/lib/vault-catalog";

/**
 * Client credential vault (DB access). Secrets are AES-256-GCM encrypted at rest
 * with the app master key; the browser only ever receives a masked hint until an
 * OWNER/ADMIN explicitly reveals one (every reveal is audit-logged). Everything
 * is workspace-scoped and soft-deleted.
 */
export * from "@/lib/vault-catalog";
export { isCredentialVaultReady };

const VAULT_PROVIDER = "client-vault";

type Actor = Pick<CurrentUser, "id" | "name" | "avatarColor" | "workspaceId">;

// Public shape — NEVER includes the decrypted secret or the raw ciphertext.
export type VaultCredentialDTO = {
  id: string;
  clientName: string;
  category: VaultCategory;
  label: string;
  username: string | null;
  url: string | null;
  maskedHint: string | null;
  hasSecret: boolean;
  notes: string | null;
  renewalId: string | null;
  createdAt: string;
};

const publicSelect = {
  id: true, clientName: true, category: true, label: true, username: true, url: true,
  maskedHint: true, encryptedValue: true, notes: true, renewalId: true, createdAt: true,
} as const;

type Row = {
  id: string; clientName: string; category: string; label: string; username: string | null;
  url: string | null; maskedHint: string | null; encryptedValue: string | null;
  notes: string | null; renewalId: string | null; createdAt: Date;
};

function toDTO(r: Row): VaultCredentialDTO {
  return {
    id: r.id, clientName: r.clientName,
    category: isVaultCategory(r.category) ? r.category : "OTHER",
    label: r.label, username: r.username, url: r.url, maskedHint: r.maskedHint,
    hasSecret: !!r.encryptedValue, notes: r.notes, renewalId: r.renewalId,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getVaultCredentials(workspaceId: string): Promise<VaultCredentialDTO[]> {
  const rows = await prisma.vaultCredential.findMany({
    where: { workspaceId, deletedAt: null },
    select: publicSelect,
    orderBy: [{ clientName: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toDTO);
}

export type VaultInput = {
  clientName: string;
  category: VaultCategory;
  label: string;
  username?: string | null;
  url?: string | null;
  secret?: string | null;
  notes?: string | null;
  renewalId?: string | null;
};

export async function createVaultCredential(actor: Actor, input: VaultInput): Promise<VaultCredentialDTO> {
  const secret = input.secret?.trim();
  let enc: ReturnType<typeof encryptCredential> | null = null;
  if (secret) {
    if (!isCredentialVaultReady()) throw new Error("VAULT_LOCKED");
    enc = encryptCredential({ secret, workspaceId: actor.workspaceId, provider: VAULT_PROVIDER });
  }
  const row = await prisma.vaultCredential.create({
    data: {
      workspaceId: actor.workspaceId,
      createdById: actor.id,
      clientName: input.clientName.trim(),
      category: isVaultCategory(input.category) ? input.category : "OTHER",
      label: input.label.trim(),
      username: input.username?.trim() || null,
      url: input.url?.trim() || null,
      notes: input.notes?.trim() || null,
      renewalId: input.renewalId ?? null,
      encryptedValue: enc?.encryptedValue ?? null,
      iv: enc?.iv ?? null,
      authTag: enc?.authTag ?? null,
      keyVersion: enc?.keyVersion ?? 1,
      maskedHint: enc?.maskedValue ?? null,
    },
    select: publicSelect,
  });
  await logActivity(actor, { action: "vault.credential_saved", targetType: "credential", targetId: row.id, targetLabel: `${input.clientName} · ${input.label}` });
  return toDTO(row);
}

export async function updateVaultCredential(actor: Actor, id: string, patch: Partial<VaultInput>): Promise<number> {
  const data: Record<string, unknown> = {};
  if (patch.clientName !== undefined) data.clientName = patch.clientName.trim();
  if (patch.category !== undefined) data.category = isVaultCategory(patch.category) ? patch.category : "OTHER";
  if (patch.label !== undefined) data.label = patch.label.trim();
  if (patch.username !== undefined) data.username = patch.username?.trim() || null;
  if (patch.url !== undefined) data.url = patch.url?.trim() || null;
  if (patch.notes !== undefined) data.notes = patch.notes?.trim() || null;
  if (patch.secret !== undefined) {
    const secret = patch.secret?.trim();
    if (secret) {
      if (!isCredentialVaultReady()) throw new Error("VAULT_LOCKED");
      const enc = encryptCredential({ secret, workspaceId: actor.workspaceId, provider: VAULT_PROVIDER });
      data.encryptedValue = enc.encryptedValue; data.iv = enc.iv; data.authTag = enc.authTag; data.keyVersion = enc.keyVersion; data.maskedHint = enc.maskedValue;
    } else {
      data.encryptedValue = null; data.iv = null; data.authTag = null; data.maskedHint = null;
    }
  }
  const result = await prisma.vaultCredential.updateMany({ where: { id, workspaceId: actor.workspaceId, deletedAt: null }, data });
  if (result.count > 0) await logActivity(actor, { action: "vault.credential_saved", targetType: "credential", targetId: id });
  return result.count;
}

// Decrypt and return a secret. OWNER/ADMIN only (enforced at the route). Logs the
// reveal so there is an audit trail of who saw what and when.
export async function revealVaultSecret(actor: Actor, id: string): Promise<{ secret: string } | null> {
  const row = await prisma.vaultCredential.findFirst({ where: { id, workspaceId: actor.workspaceId, deletedAt: null } });
  if (!row?.encryptedValue || !row.iv || !row.authTag) return null;
  const secret = decryptCredential({
    encryptedValue: row.encryptedValue, iv: row.iv, authTag: row.authTag,
    keyVersion: row.keyVersion, workspaceId: actor.workspaceId, provider: VAULT_PROVIDER,
  });
  await logActivity(actor, { action: "vault.credential_revealed", targetType: "credential", targetId: row.id, targetLabel: `${row.clientName} · ${row.label}` });
  return { secret };
}

export async function deleteVaultCredential(actor: Actor, id: string): Promise<number> {
  const row = await prisma.vaultCredential.findFirst({ where: { id, workspaceId: actor.workspaceId, deletedAt: null }, select: { clientName: true, label: true } });
  const result = await prisma.vaultCredential.updateMany({ where: { id, workspaceId: actor.workspaceId, deletedAt: null }, data: { deletedAt: new Date() } });
  if (result.count > 0) await logActivity(actor, { action: "vault.credential_deleted", targetType: "credential", targetId: id, targetLabel: row ? `${row.clientName} · ${row.label}` : undefined });
  return result.count;
}
