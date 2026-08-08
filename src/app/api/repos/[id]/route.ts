import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { deleteRepository, updateRepository } from "@/lib/dev-studio";
import { REPO_PROVIDERS } from "@/lib/dev-studio-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  provider: z.enum(REPO_PROVIDERS).optional(),
  fullName: z.string().trim().min(3).max(160).optional(),
  url: z.string().trim().max(300).optional().nullable(),
  defaultBranch: z.string().trim().max(120).optional(),
  branches: z.array(z.string().trim().max(120)).max(50).optional(),
  visibility: z.enum(["private", "public"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the fields." }, { status: 400 });
  const count = await updateRepository(g.user.workspaceId, id, parsed.data);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deleteRepository(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
