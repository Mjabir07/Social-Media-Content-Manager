import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createServiceRenewal, getServiceRenewals } from "@/lib/renewals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  service: z.string().trim().min(2).max(120),
  clientName: z.string().trim().min(2).max(120),
  clientEmail: z.string().trim().email().max(200).optional().or(z.literal("")).nullable(),
  amountCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().trim().length(3).optional(),
  renewalDate: z.string().trim().min(4),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function GET() {
  const g = await guard();
  if (!g.ok) return g.response;
  const renewals = await getServiceRenewals(g.user.workspaceId);
  return Response.json({ renewals });
}

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the service, client and renewal date." }, { status: 400 });
  const renewal = await createServiceRenewal(g.user.workspaceId, g.user.id, {
    ...parsed.data,
    clientEmail: parsed.data.clientEmail || null,
  });
  return Response.json(renewal, { status: 201 });
}
