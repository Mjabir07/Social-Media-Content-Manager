import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { updateLead } from "@/lib/leads";
import { qualifyLead } from "@/lib/ai/lead-qualify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AI-qualify a lead: score + summary + next step, using the lead's own company
// sales guidance for context. Falls back to a transparent heuristic if no AI
// provider is configured. Scoped to the caller's workspace.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: { id, workspaceId: g.user.workspaceId },
    include: {
      company: { select: { name: true, brain: { select: { salesGuidance: true } } } },
      service: { select: { name: true } },
    },
  });
  if (!lead) return new Response("Not found", { status: 404 });

  const result = await qualifyLead({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    notes: lead.notes,
    valueCents: lead.valueCents,
    serviceName: lead.service?.name ?? null,
    companyName: lead.company?.name ?? null,
    salesGuidance: lead.company?.brain?.salesGuidance ?? null,
  });

  await updateLead(g.user.workspaceId, id, { score: result.score, aiSummary: result.summary });
  await logActivity(g.user, { action: "lead.qualified", targetType: "lead", targetId: id, targetLabel: lead.name });
  return Response.json(result);
}
