import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createClient, getClients } from "@/lib/clients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["DIRECT", "RESELLER"]).optional(),
  domain: z.string().trim().max(200).optional().nullable(),
  contactName: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")).nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function GET() {
  const g = await guard();
  if (!g.ok) return g.response;
  const clients = await getClients(g.user.workspaceId);
  return Response.json({ clients });
}

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Add a client name (and check the fields)." }, { status: 400 });
  const client = await createClient(g.user.workspaceId, g.user.id, { ...parsed.data, email: parsed.data.email || null });
  return Response.json(client, { status: 201 });
}
