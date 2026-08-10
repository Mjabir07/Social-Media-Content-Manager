import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { createSmmOnboardingPlan } from "@/lib/smm-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  goals: z.array(z.string().trim().min(2).max(120)).max(12).optional(),
  platforms: z.array(z.enum(["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE", "TIKTOK", "X", "PINTEREST", "GOOGLE_BUSINESS"])).max(8).optional(),
  restart: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the goals and selected platforms." }, { status: 400 });
  const { id } = await params;
  try {
    const result = await createSmmOnboardingPlan(g.user.workspaceId, id, g.user.id, parsed.data);
    await logActivity(g.user, { action: result.created ? "smm.plan_created" : "smm.plan_opened", targetType: "SMM onboarding plan", targetId: result.run.id });
    return Response.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "SMM_ACCOUNT_NOT_FOUND") return Response.json({ error: "SMM account not found." }, { status: 404 });
    return Response.json({ error: "The Delivery Agent could not create the onboarding plan." }, { status: 500 });
  }
}
