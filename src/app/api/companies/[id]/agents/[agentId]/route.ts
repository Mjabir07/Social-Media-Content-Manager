import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { AGENT_AUTONOMY, archiveAgent, updateAgent } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  role: z.string().trim().min(2).max(80).optional(),
  systemPrompt: z.string().trim().min(1).max(6000).optional(),
  autonomy: z.enum(AGENT_AUTONOMY).optional(),
  providerId: z.string().trim().max(40).nullish(),
  isDefault: z.boolean().optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

async function scopedCompany(workspaceId: string, id: string) {
  return prisma.company.findFirst({ where: { id, workspaceId }, select: { id: true, name: true } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; agentId: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id, agentId } = await params;
  const company = await scopedCompany(g.user.workspaceId, id);
  if (!company) return new Response("Not found", { status: 404 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Check the entered information.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const count = await updateAgent(g.user.workspaceId, id, agentId, parsed.data);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "company.agent_updated", targetType: "company", targetId: id, targetLabel: company.name });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; agentId: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id, agentId } = await params;
  const company = await scopedCompany(g.user.workspaceId, id);
  if (!company) return new Response("Not found", { status: 404 });

  const count = await archiveAgent(g.user.workspaceId, id, agentId);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "company.agent_archived", targetType: "company", targetId: id, targetLabel: company.name });
  return Response.json({ ok: true });
}
