import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { deleteClient, updateClient } from "@/lib/clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  contactName: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")).nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the fields." }, { status: 400 });
  const count = await updateClient(g.user.workspaceId, id, { ...parsed.data, email: parsed.data.email === "" ? null : parsed.data.email });
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteClient(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
