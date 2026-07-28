import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { deletePost, updatePost } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  content: z.string().trim().min(1).max(5000).optional(),
  imageUrl: z.string().trim().url().max(600).nullish().or(z.literal("")),
  scheduledAt: z.string().datetime().nullish(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the entered information." }, { status: 400 });
  const d = parsed.data;
  const count = await updatePost(g.user.workspaceId, id, {
    ...(d.content !== undefined ? { content: d.content } : {}),
    ...(d.imageUrl !== undefined ? { imageUrl: d.imageUrl || null } : {}),
    ...(d.scheduledAt !== undefined ? { scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null, status: d.scheduledAt ? "SCHEDULED" : "DRAFT" } : {}),
  });
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const count = await deletePost(g.user.workspaceId, id);
  if (count === 0) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "post.deleted", targetType: "post", targetId: id });
  return Response.json({ ok: true });
}
