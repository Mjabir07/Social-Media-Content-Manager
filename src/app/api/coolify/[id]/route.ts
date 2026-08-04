import { guard } from "@/lib/api-guard";
import { deleteCoolifyConnection } from "@/lib/coolify-connections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteCoolifyConnection(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
