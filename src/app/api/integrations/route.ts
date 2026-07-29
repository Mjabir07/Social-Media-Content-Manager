import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import {
  encryptCredential,
  isCredentialVaultReady,
} from "@/lib/integrations/credential-crypto";
import {
  isProviderId,
  PROVIDERS,
  type ProviderId,
} from "@/lib/integrations/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const saveSchema = z.object({
  provider: z.string(),
  secret: z.string().trim().min(8).max(500),
});
const statusSchema = z.object({
  provider: z.string(),
  status: z.enum(["ACTIVE", "DISABLED"]),
});

function metadata(
  row: {
    provider: string;
    maskedValue: string;
    status: string;
    lastTestedAt: Date | null;
    lastTestStatus: string | null;
    lastTestMessage: string | null;
    updatedAt: Date;
  } | undefined,
  provider: ProviderId,
) {
  return {
    provider,
    ...PROVIDERS[provider],
    configured: Boolean(row),
    maskedValue: row?.maskedValue ?? null,
    status: row?.status ?? "UNCONFIGURED",
    lastTestedAt: row?.lastTestedAt?.toISOString() ?? null,
    lastTestStatus: row?.lastTestStatus ?? null,
    lastTestMessage: row?.lastTestMessage ?? null,
    updatedAt: row?.updatedAt.toISOString() ?? null,
  };
}

export async function GET() {
  const g = await guard("OWNER");
  if (!g.ok) return g.response;
  const rows = await prisma.providerCredential.findMany({
    where: { workspaceId: g.user.workspaceId },
    select: {
      provider: true,
      maskedValue: true,
      status: true,
      lastTestedAt: true,
      lastTestStatus: true,
      lastTestMessage: true,
      updatedAt: true,
    },
  });
  const byProvider = new Map(rows.map((row) => [row.provider, row]));
  // Non-secret environment status — booleans only, never any value. Lets the
  // owner see at a glance which infrastructure keys are set on the host (Vercel).
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? "";
  const env = {
    encryptionKey: isCredentialVaultReady(),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    database: Boolean(process.env.DATABASE_URL),
    authSecret: Boolean(process.env.NEXTAUTH_SECRET),
    authUrlSet: Boolean(nextAuthUrl),
    authUrlIsLocalhost: nextAuthUrl.includes("localhost") || nextAuthUrl.includes("127.0.0.1"),
  };
  return Response.json({
    vaultReady: isCredentialVaultReady(),
    env,
    providers: (Object.keys(PROVIDERS) as ProviderId[]).map((provider) =>
      metadata(byProvider.get(provider), provider),
    ),
  });
}

export async function PUT(request: Request) {
  const g = await guard("OWNER");
  if (!g.ok) return g.response;
  const parsed = saveSchema.safeParse(await request.json());
  if (!parsed.success || !isProviderId(parsed.data?.provider)) {
    return Response.json({ error: "Invalid provider or credential." }, { status: 400 });
  }
  try {
    const provider = parsed.data.provider;
    const encrypted = encryptCredential({
      secret: parsed.data.secret,
      workspaceId: g.user.workspaceId,
      provider,
    });
    const row = await prisma.providerCredential.upsert({
      where: {
        workspaceId_provider: { workspaceId: g.user.workspaceId, provider },
      },
      create: {
        workspaceId: g.user.workspaceId,
        provider,
        ...encrypted,
        createdById: g.user.id,
      },
      update: {
        ...encrypted,
        status: "ACTIVE",
        lastTestedAt: null,
        lastTestStatus: null,
        lastTestMessage: null,
        createdById: g.user.id,
      },
      select: {
        provider: true,
        maskedValue: true,
        status: true,
        lastTestedAt: true,
        lastTestStatus: true,
        lastTestMessage: true,
        updatedAt: true,
      },
    });
    await logActivity(g.user, {
      action: "integration.credential_saved",
      targetType: "provider",
      targetLabel: PROVIDERS[provider].name,
    });
    return Response.json(metadata(row, provider));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save credential.";
    return Response.json({ error: message }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const g = await guard("OWNER");
  if (!g.ok) return g.response;
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success || !isProviderId(parsed.data?.provider)) {
    return Response.json({ error: "Invalid provider status." }, { status: 400 });
  }
  const provider = parsed.data.provider;
  const result = await prisma.providerCredential.updateMany({
    where: { workspaceId: g.user.workspaceId, provider },
    data: { status: parsed.data.status },
  });
  if (!result.count) return new Response("Not found", { status: 404 });
  await logActivity(g.user, {
    action: "integration.credential_status_changed",
    targetType: "provider",
    targetLabel: PROVIDERS[provider].name,
    metadata: { status: parsed.data.status },
  });
  return Response.json({ ok: true, status: parsed.data.status });
}
