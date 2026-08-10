import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { getLead } from "@/lib/leads";
import { onboardSmmClient } from "@/lib/smm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;
  const lead = await getLead(g.user.workspaceId, id);
  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });
  if (lead.stage !== "WON" || !lead.clientId) {
    return Response.json({ error: "Mark the lead as won first so its client record is created." }, { status: 409 });
  }
  const result = await onboardSmmClient(g.user.workspaceId, g.user.id, { clientId: lead.clientId, leadId: lead.id });
  await logActivity(g.user, { action: result.created ? "smm.onboarded_from_lead" : "smm.opened", targetType: "smm", targetId: result.account.id });
  return Response.json(result, { status: result.created ? 201 : 200 });
}
