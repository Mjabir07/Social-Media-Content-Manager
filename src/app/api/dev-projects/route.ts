import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createDevProject, getDevProjects } from "@/lib/dev-studio";
import { DEV_PROJECT_STATUSES } from "@/lib/dev-studio-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(DEV_PROJECT_STATUSES).optional(),
  companyId: z.string().trim().optional().nullable(),
  productionUrl: z.string().trim().max(300).optional().nullable(),
});

export async function GET() {
  const g = await guard();
  if (!g.ok) return g.response;
  const devProjects = await getDevProjects(g.user.workspaceId);
  return Response.json({ devProjects });
}

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Add a name (and check the fields)." }, { status: 400 });
  const project = await createDevProject(g.user.workspaceId, g.user.id, parsed.data);
  return Response.json(project, { status: 201 });
}
