import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { publishPost } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Publish a post now — fan out to every connected platform through the adapter.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const result = await publishPost(g.user.workspaceId, id);
  if (!result) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "post.published", targetType: "post", targetId: id });
  return Response.json(result);
}
