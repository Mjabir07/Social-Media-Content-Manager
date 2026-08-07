import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { deleteVaultCredential, updateVaultCredential } from "@/lib/client-vault";
import { VAULT_CATEGORIES } from "@/lib/vault-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  clientName: z.string().trim().min(2).max(120).optional(),
  category: z.enum(VAULT_CATEGORIES).optional(),
  label: z.string().trim().min(2).max(160).optional(),
  username: z.string().trim().max(200).optional().nullable(),
  url: z.string().trim().max(400).optional().nullable(),
  secret: z.string().max(4000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the fields." }, { status: 400 });
  try {
    const count = await updateVaultCredential(g.user, id, parsed.data);
    if (count === 0) return new Response("Not found", { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "VAULT_LOCKED") {
      return Response.json({ error: "Encryption key not configured." }, { status: 503 });
    }
    throw err;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteVaultCredential(g.user, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
