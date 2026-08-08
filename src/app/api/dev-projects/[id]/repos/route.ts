import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { addRepository } from "@/lib/dev-studio";
import { REPO_PROVIDERS } from "@/lib/dev-studio-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  provider: z.enum(REPO_PROVIDERS).optional(),
  fullName: z.string().trim().min(3).max(160),
  url: z.string().trim().max(300).optional().nullable(),
  defaultBranch: z.string().trim().max(120).optional(),
  branches: z.array(z.string().trim().max(120)).max(50).optional(),
  visibility: z.enum(["private", "public"]).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Add a repository (owner/repo)." }, { status: 400 });
  const repo = await addRepository(g.user.workspaceId, id, parsed.data);
  if (!repo) return Response.json({ error: "Project not found, or the repository details are invalid." }, { status: 400 });
  return Response.json(repo, { status: 201 });
}
