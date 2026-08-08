import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createWork, getWorks } from "@/lib/works";
import { WORK_STATUSES } from "@/lib/works-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  clientId: z.string().trim().min(1),
  title: z.string().trim().min(2).max(160),
  serviceType: z.string().trim().max(120).optional().nullable(),
  endCustomer: z.string().trim().max(160).optional().nullable(),
  quantity: z.number().int().positive().max(1000000).optional().nullable(),
  unitPriceCents: z.number().int().nonnegative().optional().nullable(),
  currency: z.string().trim().length(3).optional(),
  status: z.enum(WORK_STATUSES).optional(),
  startDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function GET(req: Request) {
  const g = await guard();
  if (!g.ok) return g.response;
  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 });
  const works = await getWorks(g.user.workspaceId, clientId);
  return Response.json({ works });
}

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Add a title (and check the fields)." }, { status: 400 });
  const work = await createWork(g.user.workspaceId, g.user.id, parsed.data);
  return Response.json(work, { status: 201 });
}
