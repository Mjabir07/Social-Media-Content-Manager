import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { deleteTask, updateTask } from "@/lib/tasks";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/tasks-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().trim().optional().nullable(),
  companyId: z.string().trim().optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the fields." }, { status: 400 });
  const count = await updateTask(g.user.workspaceId, id, parsed.data);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteTask(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
