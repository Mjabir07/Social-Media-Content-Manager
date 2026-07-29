import { parseMetaWebhook, verifyMetaSignature } from "@/lib/meta-webhook";
import { recordInbound, resolveInboxWorkspace } from "@/lib/inbox";
import { createLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Meta webhook verification handshake (GET) — echo hub.challenge when the token
// matches META_VERIFY_TOKEN.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge") ?? "";
  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Incoming events (POST) — verify signature, normalize, then thread messages and
// turn ad leads into pipeline leads (which fires LEAD_CREATED automations).
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Bad signature", { status: 403 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const events = parseMetaWebhook(payload);
  for (const event of events) {
    try {
      if (event.kind === "message" && event.text) {
        const workspaceId = await resolveInboxWorkspace(event.channel);
        if (workspaceId) await recordInbound(workspaceId, event);
      } else if (event.kind === "lead") {
        const workspaceId = await resolveInboxWorkspace("MESSENGER");
        if (workspaceId) {
          await createLead(workspaceId, null, {
            name: "Facebook Lead",
            source: event.source,
            notes: event.leadgenId ? `Lead Ad submission (leadgen id ${event.leadgenId})` : "Lead Ad submission",
          });
        }
      }
    } catch (error) {
      console.error("meta webhook event failed", error);
    }
  }
  // Always 200 quickly so Meta does not retry a handled delivery.
  return Response.json({ ok: true });
}
