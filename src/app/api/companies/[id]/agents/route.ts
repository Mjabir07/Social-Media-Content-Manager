import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { AGENT_AUTONOMY, agentTemplate, createAgent, getAgents } from "@/lib/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  templateKey: z.string().trim().max(60).optional(),
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(80),
  systemPrompt: z.string().trim().min(1).max(6000),
  autonomy: z.enum(AGENT_AUTONOMY).default("SUGGEST"),
  providerId: z.string().trim().max(40).nullish(),
  isDefault: z.boolean().optional(),
});

// Confirm the company belongs to the caller's workspace before any agent op.
async function scopedCompany(workspaceId: string, id: string) {
  return prisma.company.findFirst({ where: { id, workspaceId }, select: { id: true, name: true } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (!g.ok) return g.response;
  const { id } = await params;
  const company = await scopedCompany(g.user.workspaceId, id);
  if (!company) return new Response("Not found", { status: 404 });
  const agents = await getAgents(g.user.workspaceId, id);
  return Response.json({ agents });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const company = await scopedCompany(g.user.workspaceId, id);
  if (!company) return new Response("Not found", { status: 404 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Check the entered information.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  // A template only pre-fills defaults; explicit fields always win.
  const template = d.templateKey ? agentTemplate(d.templateKey) : undefined;
  const agent = await createAgent(g.user.workspaceId, id, g.user.id, {
    name: d.name,
    role: d.role,
    systemPrompt: d.systemPrompt || template?.systemPrompt || "",
    autonomy: d.autonomy ?? template?.autonomy ?? "SUGGEST",
    providerId: d.providerId ?? null,
    isDefault: d.isDefault ?? false,
  });
  await logActivity(g.user, { action: "company.agent_created", targetType: "company", targetId: id, targetLabel: `${company.name} · ${agent.name}` });
  return Response.json(agent, { status: 201 });
}
