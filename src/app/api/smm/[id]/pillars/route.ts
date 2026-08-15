import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createPillar } from "@/lib/smm-pillars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).nullish(),
  targetPercent: z.number().int().min(0).max(100).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the pillar details." }, { status: 400 });
  const { id } = await params;
  const pillar = await createPillar(g.user.workspaceId, id, parsed.data);
  if (!pillar) return Response.json({ error: "SMM account not found or name already used." }, { status: 400 });
  return Response.json({ ok: true, id: pillar.id });
}
