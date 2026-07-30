import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { getConversation } from "@/lib/inbox";
import { suggestReply } from "@/lib/ai/inbox-reply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AI-draft a reply to a conversation, using the linked company's brain for tone
// and guidance. Falls back to a polite default when no AI provider is set.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const { id } = await params;

  const convo = await getConversation(g.user.workspaceId, id);
  if (!convo) return new Response("Not found", { status: 404 });

  let companyName: string | null = null;
  let salesGuidance: string | null = null;
  let contentGuidance: string | null = null;
  let aiInstructions: string | null = null;
  if (convo.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: convo.companyId, workspaceId: g.user.workspaceId },
      select: { name: true, brain: { select: { salesGuidance: true, contentGuidance: true, aiInstructions: true } } },
    });
    companyName = company?.name ?? null;
    salesGuidance = company?.brain?.salesGuidance ?? null;
    contentGuidance = company?.brain?.contentGuidance ?? null;
    aiInstructions = company?.brain?.aiInstructions ?? null;
  }

  const result = await suggestReply({
    messages: convo.messages.map((m) => ({ direction: m.direction, body: m.body })),
    contactName: convo.contactName,
    companyName,
    salesGuidance,
    contentGuidance,
    aiInstructions,
  });
  return Response.json(result);
}
