import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { LEAD_STAGES, deleteLead, updateLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the entered information." }, { status: 400 });
  const data = { ...parsed.data, email: parsed.data.email === "" ? null : parsed.data.email };
  const count = await updateLead(g.user.workspaceId, id, data);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "lead.updated", targetType: "lead", targetId: id });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteLead(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "lead.deleted", targetType: "lead", targetId: id });
  return Response.json({ ok: true });
}
