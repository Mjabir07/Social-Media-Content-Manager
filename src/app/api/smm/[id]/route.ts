import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { SMM_AGENT_MODES, SMM_APPROVAL_MODES, updateSmmAgentSettings, runSmmAgentForAccount } from "@/lib/smm-executor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  agentMode: z.enum(SMM_AGENT_MODES).optional(),
  approvalMode: z.enum(SMM_APPROVAL_MODES).optional(),
  agentEnabled: z.boolean().optional(),
  runNow: z.boolean().optional(),
});

// Update the SMM account's automation settings, and optionally trigger one
// generation cycle immediately. Autonomous posting and trusted auto-approval are
// higher-risk, so they require an owner or admin; drafting is EDITOR+.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the automation settings." }, { status: 400 });
  const d = parsed.data;

  const wantsHighRisk = d.agentMode === "AUTONOMOUS" || d.approvalMode === "TRUSTED_AUTO";
  if (wantsHighRisk && !["OWNER", "ADMIN"].includes(g.user.role)) {
    return Response.json({ error: "Only an owner or admin can enable autonomous posting or trusted auto-approval." }, { status: 403 });
  }

  const { id } = await params;
  const count = await updateSmmAgentSettings(g.user.workspaceId, id, { agentMode: d.agentMode, approvalMode: d.approvalMode, agentEnabled: d.agentEnabled });
  if (count === 0) return Response.json({ error: "SMM account not found." }, { status: 404 });

  let created = 0;
  if (d.runNow) {
    const result = await runSmmAgentForAccount(g.user.workspaceId, id);
    created = result.created;
  }
  await logActivity(g.user, { action: "smm.automation_updated", targetType: "SMM account", targetId: id, metadata: { agentMode: d.agentMode, approvalMode: d.approvalMode, agentEnabled: d.agentEnabled, runNow: d.runNow ?? false } });
  return Response.json({ ok: true, created });
}
