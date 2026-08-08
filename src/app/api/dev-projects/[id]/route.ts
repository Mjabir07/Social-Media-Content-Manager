import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { deleteDevProject, updateDevProject } from "@/lib/dev-studio";
import { DEV_PROJECT_STATUSES } from "@/lib/dev-studio-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(DEV_PROJECT_STATUSES).optional(),
  companyId: z.string().trim().optional().nullable(),
  productionUrl: z.string().trim().max(300).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the fields." }, { status: 400 });
  const count = await updateDevProject(g.user.workspaceId, id, parsed.data);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteDevProject(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
