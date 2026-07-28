import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { LEAD_STAGES, createLead, getLeads } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).nullish().or(z.literal("")),
  phone: z.string().trim().max(40).nullish(),
  source: z.string().trim().max(60).nullish(),
  serviceId: z.string().trim().max(40).nullish(),
  companyId: z.string().trim().max(40).nullish(),
  valueCents: z.number().int().min(0).max(1_000_000_000).nullish(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  notes: z.string().trim().max(2000).nullish(),
  stage: z.enum(LEAD_STAGES).optional(),
});

export async function GET(req: Request) {
  const g = await guard();
  if (!g.ok) return g.response;
  const companyId = new URL(req.url).searchParams.get("companyId") ?? undefined;
  const leads = await getLeads(g.user.workspaceId, companyId);
  return Response.json({ leads });
}

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Check the entered information.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  let companyName: string | undefined;
  if (d.companyId) {
    const company = await prisma.company.findFirst({ where: { id: d.companyId, workspaceId: g.user.workspaceId }, select: { id: true, name: true } });
    if (!company) return Response.json({ error: "Unknown company." }, { status: 400 });
    companyName = company.name;
  }
  const lead = await createLead(g.user.workspaceId, g.user.id, { ...d, email: d.email || null, companyName });
  await logActivity(g.user, { action: "lead.created", targetType: "lead", targetId: lead.id, targetLabel: lead.name });
  return Response.json(lead, { status: 201 });
}
