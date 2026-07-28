import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { createConnection, getConnections } from "@/lib/connections";
import { CHANNELS } from "@/lib/automations-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  channel: z.enum(CHANNELS),
  displayName: z.string().trim().min(2).max(80),
  secret: z.string().trim().min(3).max(4000).nullish(),
  companyId: z.string().trim().max(40).nullish(),
  meta: z.string().trim().max(1000).nullish(),
});

export async function GET(req: Request) {
  const g = await guard();
  if (!g.ok) return g.response;
  const companyId = new URL(req.url).searchParams.get("companyId") ?? undefined;
  const connections = await getConnections(g.user.workspaceId, companyId);
  return Response.json({ connections });
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
  const connection = await createConnection(g.user.workspaceId, g.user.id, d);
  await logActivity(g.user, { action: "connection.created", targetType: "connection", targetId: connection.id, targetLabel: connection.displayName });
  return Response.json(connection, { status: 201 });
}
