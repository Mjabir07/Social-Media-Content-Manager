import { guard } from "@/lib/api-guard";
import { revealVaultSecret } from "@/lib/client-vault";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Decrypt and return one secret. OWNER/ADMIN only. The reveal is audit-logged
// inside revealVaultSecret so there's a trail of who saw what.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const result = await revealVaultSecret(g.user, id);
  if (!result) return Response.json({ error: "No secret stored for this entry." }, { status: 404 });
  return Response.json(result);
}
