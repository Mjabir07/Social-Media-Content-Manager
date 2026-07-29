import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Parse and verify Meta (Facebook/Instagram/WhatsApp) webhook payloads into a
 * normalized list of inbound events. External payloads are untrusted data.
 */

export type InboundMessage = {
  kind: "message";
  channel: "WHATSAPP" | "MESSENGER" | "INSTAGRAM";
  externalId: string; // the contact/thread id we thread on
  contactName?: string;
  contactHandle?: string;
  text: string;
  messageId?: string;
};
export type InboundLead = {
  kind: "lead";
  source: string;
  leadgenId?: string;
  formId?: string;
};
export type InboundEvent = InboundMessage | InboundLead;

// Verify X-Hub-Signature-256 against the raw body using the app secret. When no
// secret is configured, verification is skipped (returns true) so local/dev
// works; in production set META_APP_SECRET to enforce it.
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret = process.env.META_APP_SECRET): boolean {
  if (!appSecret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

type AnyObj = Record<string, unknown>;
function asArray(v: unknown): AnyObj[] {
  return Array.isArray(v) ? (v as AnyObj[]) : [];
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}

export function parseMetaWebhook(payload: unknown): InboundEvent[] {
  const body = (payload ?? {}) as AnyObj;
  const object = str(body.object);
  const events: InboundEvent[] = [];

  for (const entry of asArray(body.entry)) {
    // WhatsApp Cloud API
    for (const change of asArray(entry.changes)) {
      const value = (change.value ?? {}) as AnyObj;
      if (change.field === "leadgen") {
        events.push({ kind: "lead", source: "Facebook Lead Ad", leadgenId: str(value.leadgen_id), formId: str(value.form_id) });
        continue;
      }
      const contacts = asArray(value.contacts);
      const name = contacts[0]?.profile && typeof contacts[0].profile === "object" ? str((contacts[0].profile as AnyObj).name) : undefined;
      for (const m of asArray(value.messages)) {
        const text = m.text && typeof m.text === "object" ? str((m.text as AnyObj).body) : undefined;
        const from = str(m.from);
        if (from) {
          events.push({ kind: "message", channel: "WHATSAPP", externalId: from, contactHandle: from, contactName: name, text: text ?? "", messageId: str(m.id) });
        }
      }
    }

    // Messenger (page) / Instagram messaging
    for (const msg of asArray(entry.messaging)) {
      const sender = (msg.sender ?? {}) as AnyObj;
      const senderId = str(sender.id);
      const message = (msg.message ?? {}) as AnyObj;
      const text = str(message.text);
      if (senderId && text !== undefined) {
        const channel = object === "instagram" ? "INSTAGRAM" : "MESSENGER";
        events.push({ kind: "message", channel, externalId: senderId, contactHandle: senderId, text, messageId: str(message.mid) });
      }
    }
  }
  return events;
}
