import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { onboardSmmClient } from "@/lib/smm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  clientId: z.string().trim().min(1).max(60),
  leadId: z.string().trim().min(1).max(60).nullish(),
});

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Select a valid client." }, { status: 400 });
  try {
    const result = await onboardSmmClient(g.user.workspaceId, g.user.id, parsed.data);
    await logActivity(g.user, { action: result.created ? "smm.onboarded" : "smm.opened", targetType: "smm", targetId: result.account.id });
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "CLIENT_NOT_FOUND") return Response.json({ error: "Client not found." }, { status: 404 });
    if (code === "WON_LEAD_REQUIRED") return Response.json({ error: "The lead must be won and linked to this client." }, { status: 409 });
    return Response.json({ error: "Could not onboard this SMM client." }, { status: 500 });
  }
}
