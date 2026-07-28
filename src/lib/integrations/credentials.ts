import "server-only";
import { prisma } from "@/lib/db";
import { decryptCredential } from "@/lib/integrations/credential-crypto";
import type { ProviderId } from "@/lib/integrations/providers";

export async function getProviderSecret(
  workspaceId: string,
  provider: ProviderId,
) {
  const row = await prisma.providerCredential.findUnique({
    where: { workspaceId_provider: { workspaceId, provider } },
  });
  if (!row || row.status !== "ACTIVE") return null;
  return decryptCredential({
    encryptedValue: row.encryptedValue,
    iv: row.iv,
    authTag: row.authTag,
    keyVersion: row.keyVersion,
    workspaceId,
    provider,
  });
}
