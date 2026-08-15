import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { updatePillar, deletePillar } from "@/lib/smm-pillars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(400).nullish(),
  targetPercent: z.number().int().min(0).max(100).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; pillarId: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the pillar details." }, { status: 400 });
  const { id, pillarId } = await params;
  const count = await updatePillar(g.user.workspaceId, id, pillarId, parsed.data);
  if (count === 0) return Response.json({ error: "Pillar not found." }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; pillarId: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id, pillarId } = await params;
  const count = await deletePillar(g.user.workspaceId, id, pillarId);
  if (count === 0) return Response.json({ error: "Pillar not found." }, { status: 404 });
  return Response.json({ ok: true });
}
