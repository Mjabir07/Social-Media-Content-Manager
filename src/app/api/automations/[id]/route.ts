import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { ACTIONS, TRIGGERS, deleteAutomation, updateAutomation } from "@/lib/automations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  trigger: z.enum(TRIGGERS).optional(),
  action: z.enum(ACTIONS).optional(),
  connectionId: z.string().trim().max(40).nullish(),
  template: z.string().trim().max(4000).nullish(),
  config: z.string().trim().max(2000).nullish(),
  enabled: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the entered information." }, { status: 400 });
  if (parsed.data.connectionId) {
    const conn = await prisma.channelConnection.findFirst({ where: { id: parsed.data.connectionId, workspaceId: g.user.workspaceId }, select: { id: true } });
    if (!conn) return Response.json({ error: "Unknown connection." }, { status: 400 });
  }
  const count = await updateAutomation(g.user.workspaceId, id, parsed.data);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "automation.updated", targetType: "automation", targetId: id });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteAutomation(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "automation.deleted", targetType: "automation", targetId: id });
  return Response.json({ ok: true });
}
