import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { updateWork, deleteWork } from "@/lib/works";
import { WORK_STATUSES } from "@/lib/works-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  serviceType: z.string().trim().max(120).optional().nullable(),
  endCustomer: z.string().trim().max(160).optional().nullable(),
  quantity: z.number().int().positive().max(1000000).optional().nullable(),
  unitPriceCents: z.number().int().nonnegative().optional().nullable(),
  unitCostCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().trim().length(3).optional(),
  status: z.enum(WORK_STATUSES).optional(),
  startDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the fields." }, { status: 400 });
  const count = await updateWork(g.user.workspaceId, id, g.user.id, parsed.data);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteWork(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
