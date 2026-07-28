import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { recordPayment } from "@/lib/partnerships";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  amountCents: z.number().int().min(1).max(1_000_000_000),
  leadId: z.string().trim().max(40).nullish(),
  note: z.string().trim().max(500).nullish(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Enter a valid payment amount." }, { status: 400 });

  const payment = await recordPayment(g.user.workspaceId, g.user.id, { partnershipId: id, ...parsed.data });
  if (!payment) return new Response("Not found", { status: 404 });
  await logActivity(g.user, { action: "commission.paid", targetType: "partnership", targetId: id });
  return Response.json(payment, { status: 201 });
}
