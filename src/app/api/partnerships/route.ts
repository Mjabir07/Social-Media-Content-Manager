import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { COMMISSION_TYPES, createPartnership } from "@/lib/partnerships";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  partnerCompanyId: z.string().trim().min(1).max(40),
  name: z.string().trim().max(100).nullish(),
  commissionType: z.enum(COMMISSION_TYPES).default("PERCENT"),
  commissionRateBps: z.number().int().min(0).max(100_000).optional(),
  commissionFlatCents: z.number().int().min(0).max(1_000_000_000).nullish(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  notes: z.string().trim().max(1000).nullish(),
});

export async function POST(req: Request) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Check the entered information.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  const company = await prisma.company.findFirst({ where: { id: d.partnerCompanyId, workspaceId: g.user.workspaceId }, select: { id: true, name: true } });
  if (!company) return Response.json({ error: "Unknown partner company." }, { status: 400 });

  const partnership = await createPartnership(g.user.workspaceId, g.user.id, d);
  await logActivity(g.user, { action: "partnership.created", targetType: "partnership", targetId: partnership.id, targetLabel: d.name || company.name });
  return Response.json(partnership, { status: 201 });
}
