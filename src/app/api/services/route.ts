import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { PRICING_MODELS, createService, getServices } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().max(1000).nullish(),
  pricingModel: z.enum(PRICING_MODELS).default("PROJECT"),
  priceCents: z.number().int().min(0).max(1_000_000_000).nullish(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  unit: z.string().trim().max(40).nullish(),
  companyId: z.string().trim().max(40).nullish(),
});

export async function GET(req: Request) {
  const g = await guard();
  if (!g.ok) return g.response;
  const companyId = new URL(req.url).searchParams.get("companyId") ?? undefined;
  // If a company is named, confirm it belongs to this workspace before scoping.
  if (companyId) {
    const company = await prisma.company.findFirst({ where: { id: companyId, workspaceId: g.user.workspaceId }, select: { id: true } });
    if (!company) return new Response("Not found", { status: 404 });
  }
  const services = await getServices(g.user.workspaceId, companyId);
  return Response.json({ services });
}

export async function POST(req: Request) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Check the entered information.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  // A company-bound service must reference a company in this workspace.
  if (d.companyId) {
    const company = await prisma.company.findFirst({ where: { id: d.companyId, workspaceId: g.user.workspaceId }, select: { id: true } });
    if (!company) return Response.json({ error: "Unknown company." }, { status: 400 });
  }
  const service = await createService(g.user.workspaceId, g.user.id, d);
  await logActivity(g.user, { action: "service.created", targetType: "service", targetId: service.id, targetLabel: service.name });
  return Response.json(service, { status: 201 });
}
