import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { updateQuote, deleteQuote, sendQuote, acceptQuote, declineQuote } from "@/lib/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lineSchema = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.number().int().positive().max(100000).optional().nullable(),
  unitPriceCents: z.number().int().nonnegative().optional().nullable(),
});

const patchSchema = z.object({
  action: z.enum(["send", "accept", "decline"]).optional(),
  title: z.string().trim().min(2).max(160).optional(),
  contactName: z.string().trim().min(2).max(160).optional(),
  contactEmail: z.string().trim().email().max(200).optional().or(z.literal("")).nullable(),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  currency: z.string().trim().length(3).optional(),
  validUntil: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  lines: z.array(lineSchema).min(1).max(50).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the fields." }, { status: 400 });
  const { action, ...patch } = parsed.data;

  if (action === "send") {
    const res = await sendQuote(g.user.workspaceId, id, g.user.id);
    if (!res.ok) return Response.json({ error: res.error }, { status: res.error === "Not found" ? 404 : 400 });
    return Response.json({ ok: true });
  }
  if (action === "accept") {
    const res = await acceptQuote(g.user.workspaceId, id, g.user.id);
    if (!res.ok) return Response.json({ error: res.error }, { status: res.error === "Not found" ? 404 : 400 });
    return Response.json({ ok: true });
  }
  if (action === "decline") {
    const count = await declineQuote(g.user.workspaceId, id);
    if (count === 0) return new Response("Not found", { status: 404 });
    return Response.json({ ok: true });
  }

  const data = { ...patch, contactEmail: patch.contactEmail === "" ? null : patch.contactEmail };
  const count = await updateQuote(g.user.workspaceId, id, data);
  if (count === 0) return Response.json({ error: "Not found, or the quote is already accepted." }, { status: 400 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteQuote(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
