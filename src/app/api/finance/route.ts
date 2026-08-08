import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createTransaction, getTransactions } from "@/lib/finance";
import { TX_TYPES, TX_STATUSES } from "@/lib/finance-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  type: z.enum(TX_TYPES),
  amountCents: z.number().int().positive(),
  currency: z.string().trim().length(3).optional(),
  category: z.string().trim().min(2).max(40),
  clientId: z.string().trim().optional().nullable(),
  renewalId: z.string().trim().optional().nullable(),
  vendor: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  date: z.string().trim().min(4),
  status: z.enum(TX_STATUSES).optional(),
  method: z.string().trim().max(40).optional().nullable(),
});

export async function GET(req: Request) {
  const g = await guard();
  if (!g.ok) return g.response;
  const p = new URL(req.url).searchParams;
  const typeParam = p.get("type");
  const transactions = await getTransactions(g.user.workspaceId, {
    type: typeParam === "INCOME" || typeParam === "EXPENSE" ? typeParam : undefined,
    clientId: p.get("clientId") || undefined,
    from: p.get("from") || undefined,
    to: p.get("to") || undefined,
  });
  return Response.json({ transactions });
}

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the amount, type, category and date." }, { status: 400 });
  const transaction = await createTransaction(g.user.workspaceId, g.user.id, parsed.data);
  return Response.json(transaction, { status: 201 });
}
