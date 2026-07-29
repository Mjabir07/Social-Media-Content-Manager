import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { setConversationStatus } from "@/lib/inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ status: z.enum(["OPEN", "CLOSED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid status." }, { status: 400 });
  const count = await setConversationStatus(g.user.workspaceId, id, parsed.data.status);
  if (count === 0) return new Response("Not found", { status: 404 });
  return Response.json({ ok: true });
}
