import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { decryptCredential } from "@/lib/integrations/credential-crypto";
import { isProviderId, PROVIDERS } from "@/lib/integrations/providers";
import { testProviderCredential } from "@/lib/integrations/test-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const g = await guard("OWNER");
  if (!g.ok) return g.response;
  const { provider } = await params;
  if (!isProviderId(provider)) return new Response("Not found", { status: 404 });
  const row = await prisma.providerCredential.findUnique({
    where: {
      workspaceId_provider: { workspaceId: g.user.workspaceId, provider },
    },
  });
  if (!row) return Response.json({ error: "Add a credential first." }, { status: 404 });

  let result: { ok: boolean; message: string };
  try {
    const secret = decryptCredential({
      encryptedValue: row.encryptedValue,
      iv: row.iv,
      authTag: row.authTag,
      keyVersion: row.keyVersion,
      workspaceId: g.user.workspaceId,
      provider,
    });
    result = await testProviderCredential(provider, secret);
  } catch (error) {
    result = {
      ok: false,
      message: error instanceof Error ? error.message : "Connection test failed.",
    };
  }
  await prisma.providerCredential.update({
    where: { id: row.id },
    data: {
      lastTestedAt: new Date(),
      lastTestStatus: result.ok ? "PASSED" : "FAILED",
      lastTestMessage: result.message,
    },
  });
  await logActivity(g.user, {
    action: "integration.credential_tested",
    targetType: "provider",
    targetLabel: PROVIDERS[provider].name,
    metadata: { result: result.ok ? "PASSED" : "FAILED" },
  });
  return Response.json(result, { status: result.ok ? 200 : 422 });
}
