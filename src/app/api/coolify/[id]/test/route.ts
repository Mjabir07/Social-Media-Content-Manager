import { guard } from "@/lib/api-guard";
import { getCoolifyCredentials, setCoolifyStatus } from "@/lib/coolify-connections";
import { testCoolify } from "@/lib/coolify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Test a Coolify connection and store the result on the record.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;

  const creds = await getCoolifyCredentials(g.user.workspaceId, id);
  if (!creds) return Response.json({ error: "Connection not found or has no saved token." }, { status: 404 });

  const result = await testCoolify(creds.baseUrl, creds.token);
  await setCoolifyStatus(g.user.workspaceId, id, result.ok ? "CONNECTED" : "ERROR", result.ok ? null : result.detail);
  return Response.json(result);
}
