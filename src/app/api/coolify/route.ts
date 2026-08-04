import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { createCoolifyConnection, getCoolifyConnections } from "@/lib/coolify-connections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  baseUrl: z.string().trim().url().max(300),
  token: z.string().trim().min(8).max(4000),
});

export async function GET() {
  const g = await guard();
  if (!g.ok) return g.response;
  const connections = await getCoolifyConnections(g.user.workspaceId);
  return Response.json({ connections });
}

export async function POST(req: Request) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the name, URL and token." }, { status: 400 });
  const connection = await createCoolifyConnection(g.user.workspaceId, g.user.id, parsed.data);
  return Response.json(connection, { status: 201 });
}
