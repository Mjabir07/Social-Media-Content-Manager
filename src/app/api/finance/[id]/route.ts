import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { deleteTransaction, updateTransaction } from "@/lib/finance";
import { TX_TYPES, TX_STATUSES } from "@/lib/finance-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  type: z.enum(TX_TYPES).optional(),
  amountCents: z.number().int().positive().optional(),
  currency: z.string().trim().length(3).optional(),
  category: z.string().trim().min(2).max(40).optional(),
  clientId: z.string().trim().optional().nullable(),
  vendor: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  date: z.string().trim().min(4).optional(),
  status: z.enum(TX_STATUSES).optional(),
  method: z.string().trim().max(40).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the fields." }, { status: 400 });
  const count = await updateTransaction(g.user.workspaceId, id, parsed.data);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteTransaction(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
