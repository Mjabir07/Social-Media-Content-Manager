import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { getConnectionSecret } from "@/lib/connections";
import { sendWhatsAppTemplate } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ to: z.string().trim().min(6).max(20) });

// Send a hello_world template from a connected WhatsApp number, to prove the
// connection works end-to-end. Scoped to the caller's workspace.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Enter a phone number with country code." }, { status: 400 });

  const conn = await getConnectionSecret(g.user.workspaceId, id);
  if (!conn) return Response.json({ error: "Connection not found or has no saved key." }, { status: 404 });
  if (conn.channel !== "WHATSAPP") return Response.json({ error: "This test is for WhatsApp connections." }, { status: 400 });

  const result = await sendWhatsAppTemplate(conn.secret, parsed.data.to);
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
