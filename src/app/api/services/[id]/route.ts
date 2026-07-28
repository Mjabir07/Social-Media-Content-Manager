import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { PRICING_MODELS, archiveService, updateService } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  category: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(1000).nullish(),
  pricingModel: z.enum(PRICING_MODELS).optional(),
  priceCents: z.number().int().min(0).max(1_000_000_000).nullish(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  unit: z.string().trim().max(40).nullish(),
  companyId: z.string().trim().max(40).nullish(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Check the entered information.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  if (parsed.data.companyId) {
    const company = await prisma.company.findFirst({ where: { id: parsed.data.companyId, workspaceId: g.user.workspaceId }, select: { id: true } });
    if (!company) return Response.json({ error: "Unknown company." }, { status: 400 });
  }
  const count = await updateService(g.user.workspaceId, id, parsed.data);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "service.updated", targetType: "service", targetId: id });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await archiveService(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "service.archived", targetType: "service", targetId: id });
  return Response.json({ ok: true });
}
