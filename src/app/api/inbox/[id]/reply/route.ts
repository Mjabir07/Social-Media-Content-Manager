import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { sendReply } from "@/lib/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ text: z.string().trim().min(1).max(4000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Type a message." }, { status: 400 });
  const result = await sendReply(g.user.workspaceId, id, parsed.data.text);
  if (!result) return new Response("Not found", { status: 404 });
  return Response.json(result);
}
