import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { SMM_STEP_STATUSES } from "@/lib/smm-agent-catalog";
import { updateSmmWorkflowStep } from "@/lib/smm-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  status: z.enum(SMM_STEP_STATUSES),
  evidence: z.string().trim().max(3000).nullish(),
  blockingReason: z.string().trim().max(1000).nullish(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; runId: string; stepId: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the step status and evidence." }, { status: 400 });
  if (parsed.data.status === "SKIPPED" && !["OWNER", "ADMIN"].includes(g.user.role)) return Response.json({ error: "Only an owner or admin can waive a required step." }, { status: 403 });
  if (parsed.data.status === "DONE" && !parsed.data.evidence?.trim()) return Response.json({ error: "Add verification evidence before completing the step." }, { status: 400 });
  const { id, runId, stepId } = await params;
  try {
    await updateSmmWorkflowStep(g.user.workspaceId, id, runId, stepId, parsed.data);
    await logActivity(g.user, { action: "smm.step_updated", targetType: "SMM workflow step", targetId: stepId, metadata: { status: parsed.data.status } });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "STEP_NOT_FOUND") return Response.json({ error: "Workflow step not found." }, { status: 404 });
    return Response.json({ error: "Could not update this workflow step." }, { status: 500 });
  }
}
