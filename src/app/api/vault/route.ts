import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createVaultCredential, getVaultCredentials, isCredentialVaultReady } from "@/lib/client-vault";
import { VAULT_CATEGORIES } from "@/lib/vault-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  clientName: z.string().trim().min(2).max(120),
  category: z.enum(VAULT_CATEGORIES),
  label: z.string().trim().min(2).max(160),
  username: z.string().trim().max(200).optional().nullable(),
  url: z.string().trim().max(400).optional().nullable(),
  secret: z.string().max(4000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  renewalId: z.string().trim().optional().nullable(),
});

export async function GET() {
  const g = await guard();
  if (!g.ok) return g.response;
  const credentials = await getVaultCredentials(g.user.workspaceId);
  return Response.json({ credentials, vaultReady: isCredentialVaultReady() });
}

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the client, label and category." }, { status: 400 });
  try {
    const credential = await createVaultCredential(g.user, parsed.data);
    return Response.json(credential, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "VAULT_LOCKED") {
      return Response.json({ error: "Encryption key not configured. Set AZMIN_CREDENTIAL_ENCRYPTION_KEY to store secrets." }, { status: 503 });
    }
    throw err;
  }
}
