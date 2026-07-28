import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { deleteConnection, setConnectionStatus, updateConnectionSecret } from "@/lib/connections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  secret: z.string().trim().min(3).max(4000).optional(),
  status: z.enum(["CONNECTED", "DISABLED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the entered information." }, { status: 400 });

  let count = 0;
  if (parsed.data.secret !== undefined) count = await updateConnectionSecret(g.user.workspaceId, id, parsed.data.secret);
  if (parsed.data.status !== undefined) count = await setConnectionStatus(g.user.workspaceId, id, parsed.data.status);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "connection.updated", targetType: "connection", targetId: id });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteConnection(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "connection.deleted", targetType: "connection", targetId: id });
  return Response.json({ ok: true });
}
