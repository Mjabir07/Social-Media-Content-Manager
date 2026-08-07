import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { deleteServiceRenewal, markRenewed, updateServiceRenewal } from "@/lib/renewals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  service: z.string().trim().min(2).max(120).optional(),
  clientName: z.string().trim().min(2).max(120).optional(),
  clientEmail: z.string().trim().email().max(200).optional().or(z.literal("")).nullable(),
  amountCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().trim().length(3).optional(),
  renewalDate: z.string().trim().min(4).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["ACTIVE", "RENEWED", "CANCELLED"]).optional(),
  action: z.literal("markRenewed").optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the fields." }, { status: 400 });

  if (parsed.data.action === "markRenewed") {
    const count = await markRenewed(g.user.workspaceId, id);
    if (count === 0) return new Response("Not found", { status: 404 });
    return Response.json({ ok: true });
  }

  const { action: _action, ...patch } = parsed.data;
  void _action;
  const count = await updateServiceRenewal(g.user.workspaceId, id, patch);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteServiceRenewal(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
