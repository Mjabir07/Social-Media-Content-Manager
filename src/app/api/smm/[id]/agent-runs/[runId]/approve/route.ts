import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { approveSmmOnboardingPlan } from "@/lib/smm-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; runId: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id, runId } = await params;
  try {
    const result = await approveSmmOnboardingPlan(g.user.workspaceId, id, runId, g.user.id);
    await logActivity(g.user, { action: "smm.plan_approved", targetType: "SMM onboarding plan", targetId: runId });
    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "RUN_NOT_FOUND") return Response.json({ error: "Onboarding plan not found." }, { status: 404 });
    return Response.json({ error: "Could not approve this onboarding plan." }, { status: 500 });
  }
}
