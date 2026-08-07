import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createTask, getTasks } from "@/lib/tasks";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/tasks-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().trim().optional().nullable(),
  companyId: z.string().trim().optional().nullable(),
});

export async function GET() {
  const g = await guard();
  if (!g.ok) return g.response;
  const tasks = await getTasks(g.user.workspaceId);
  return Response.json({ tasks });
}

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Add a title (and check the fields)." }, { status: 400 });
  const task = await createTask(g.user.workspaceId, g.user.id, parsed.data);
  return Response.json(task, { status: 201 });
}
