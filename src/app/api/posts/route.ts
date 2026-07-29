import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { createPost, getPosts } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  imageUrl: z.string().trim().url().max(600).nullish().or(z.literal("")),
  mediaPublicId: z.string().trim().max(200).nullish(),
  mediaType: z.enum(["image", "video"]).nullish(),
  companyId: z.string().trim().max(40).nullish(),
  connectionIds: z.array(z.string().trim().max(40)).min(1).max(20),
  scheduledAt: z.string().datetime().nullish(),
});

export async function GET(req: Request) {
  const g = await guard();
  if (!g.ok) return g.response;
  const companyId = new URL(req.url).searchParams.get("companyId") ?? undefined;
  const posts = await getPosts(g.user.workspaceId, companyId);
  return Response.json({ posts });
}

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Check the post — pick at least one platform and add content.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  if (d.companyId) {
    const company = await prisma.company.findFirst({ where: { id: d.companyId, workspaceId: g.user.workspaceId }, select: { id: true } });
    if (!company) return Response.json({ error: "Unknown company." }, { status: 400 });
  }
  const post = await createPost(g.user.workspaceId, g.user.id, {
    content: d.content,
    imageUrl: d.imageUrl || null,
    mediaPublicId: d.mediaPublicId ?? null,
    mediaType: d.mediaType ?? null,
    companyId: d.companyId ?? null,
    connectionIds: d.connectionIds,
    scheduledAt: d.scheduledAt ? new Date(d.scheduledAt) : null,
  });
  if (post.targets.length === 0) return Response.json({ error: "None of the chosen platforms are connected." }, { status: 400 });
  await logActivity(g.user, { action: "post.created", targetType: "post", targetId: post.id });
  return Response.json(post, { status: 201 });
}
