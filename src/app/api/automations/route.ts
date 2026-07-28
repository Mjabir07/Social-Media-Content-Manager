import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { ACTIONS, TRIGGERS, createAutomation, getAutomations } from "@/lib/automations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  trigger: z.enum(TRIGGERS),
  action: z.enum(ACTIONS),
  connectionId: z.string().trim().max(40).nullish(),
  template: z.string().trim().max(4000).nullish(),
  config: z.string().trim().max(2000).nullish(),
  companyId: z.string().trim().max(40).nullish(),
  enabled: z.boolean().optional(),
});

export async function GET(req: Request) {
  const g = await guard();
  if (!g.ok) return g.response;
  const companyId = new URL(req.url).searchParams.get("companyId") ?? undefined;
  const automations = await getAutomations(g.user.workspaceId, companyId);
  return Response.json({ automations });
}

export async function POST(req: Request) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Check the entered information.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  if (d.companyId) {
    const company = await prisma.company.findFirst({ where: { id: d.companyId, workspaceId: g.user.workspaceId }, select: { id: true } });
    if (!company) return Response.json({ error: "Unknown company." }, { status: 400 });
  }
  if (d.connectionId) {
    const conn = await prisma.channelConnection.findFirst({ where: { id: d.connectionId, workspaceId: g.user.workspaceId }, select: { id: true } });
    if (!conn) return Response.json({ error: "Unknown connection." }, { status: 400 });
  }
  const automation = await createAutomation(g.user.workspaceId, g.user.id, d);
  await logActivity(g.user, { action: "automation.created", targetType: "automation", targetId: automation.id, targetLabel: automation.name });
  return Response.json(automation, { status: 201 });
}
