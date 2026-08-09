import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createQuote, getQuotes } from "@/lib/quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const lineSchema = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.number().int().positive().max(100000).optional().nullable(),
  unitPriceCents: z.number().int().nonnegative().optional().nullable(),
});

const createSchema = z.object({
  leadId: z.string().trim().optional().nullable(),
  clientId: z.string().trim().optional().nullable(),
  title: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(160),
  contactEmail: z.string().trim().email().max(200).optional().or(z.literal("")).nullable(),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  currency: z.string().trim().length(3).optional(),
  validUntil: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  lines: z.array(lineSchema).min(1).max(50),
});

export async function GET() {
  const g = await guard();
  if (!g.ok) return g.response;
  return Response.json({ quotes: await getQuotes(g.user.workspaceId) });
}

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Add a title, contact and at least one line." }, { status: 400 });
  const data = { ...parsed.data, contactEmail: parsed.data.contactEmail || null };
  const quote = await createQuote(g.user.workspaceId, g.user.id, data);
  return Response.json(quote, { status: 201 });
}
