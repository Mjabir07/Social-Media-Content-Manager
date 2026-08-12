import "server-only";
import { decryptCredential, isCredentialVaultReady } from "@/lib/integrations/credential-crypto";
import type { Action, Channel } from "@/lib/automations-catalog";

/**
 * The single seam where automations and publishing reach the outside world.
 * Real sends run only when a connection has a decryptable secret; otherwise the
 * result is safely SIMULATED (recorded, never transmitted), so the app is fully
 * usable with no external keys. Only official provider APIs are used.
 */

export type SendStatus = "SUCCESS" | "FAILED" | "SIMULATED" | "SKIPPED";
export type SendResult = { status: SendStatus; detail: string; externalId?: string };

export type ConnectionRow = {
  channel: string;
  displayName: string;
  status: string;
  encryptedConfig: string | null;
  iv: string | null;
  authTag: string | null;
  keyVersion: number;
  workspaceId: string;
  meta?: string | null;
} | null;

export function connectionProviderTag(channel: string) {
  return `channel:${channel}`;
}

function readConfig(conn: NonNullable<ConnectionRow>): string | null {
  if (!conn.encryptedConfig || !conn.iv || !conn.authTag) return null;
  if (!isCredentialVaultReady()) return null;
  try {
    return decryptCredential({
      encryptedValue: conn.encryptedConfig,
      iv: conn.iv,
      authTag: conn.authTag,
      keyVersion: conn.keyVersion,
      workspaceId: conn.workspaceId,
      provider: connectionProviderTag(conn.channel),
    });
  } catch {
    return null;
  }
}

function truncate(value: string, max = 140) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

// Split "a:rest" on the FIRST colon (tokens contain their own dots/colons).
function splitPair(secret: string): [string, string] {
  const i = secret.indexOf(":");
  return i === -1 ? [secret, ""] : [secret.slice(0, i), secret.slice(i + 1)];
}

function metaFrom(conn: NonNullable<ConnectionRow>): string | null {
  if (!conn.meta) return null;
  try {
    const parsed = JSON.parse(conn.meta) as { from?: string };
    return parsed.from ?? null;
  } catch {
    return null;
  }
}

const GRAPH = "https://graph.facebook.com/v21.0";

export type MailAttachment = { filename: string; content: Uint8Array };

export async function sendViaChannel(input: {
  action: Action;
  channel: Channel | null;
  connection: ConnectionRow;
  message: string;
  recipient?: string; // phone (WhatsApp) or email (Email) for messaging channels
  attachments?: MailAttachment[]; // EMAIL only (e.g. quote PDF)
}): Promise<SendResult> {
  const { action, channel, connection, message, recipient, attachments } = input;

  // In-app notification needs no external channel.
  if (action === "NOTIFY") {
    return { status: "SUCCESS", detail: `Team notified: ${truncate(message)}` };
  }
  if (!connection || connection.status !== "CONNECTED") {
    return { status: "SKIPPED", detail: `No connected ${channel ?? "channel"} yet — connect one to send for real.` };
  }

  const secret = readConfig(connection);
  if (!secret) {
    return { status: "SIMULATED", detail: `Simulated ${channel} send (no live credentials configured): ${truncate(message)}` };
  }

  try {
    switch (channel) {
      case "WEBHOOK":
        return await sendWebhook(secret, message, recipient);
      case "META_PAGE":
        return await sendMetaPage(secret, message);
      case "WHATSAPP":
        return await sendWhatsApp(secret, message, recipient);
      case "EMAIL":
        return await sendEmail(secret, metaFrom(connection), message, recipient, attachments);
      default:
        // INSTAGRAM (needs media + 2-step) and any other channel: not wired yet.
        return { status: "SIMULATED", detail: `Would send via ${connection.displayName}: ${truncate(message)}` };
    }
  } catch (error) {
    return { status: "FAILED", detail: error instanceof Error ? error.message : "Send failed." };
  }
}

// --- Real, official-API senders ---------------------------------------------

// Webhook: POST the message JSON to the stored URL (Zapier / Make / your own).
async function sendWebhook(url: string, message: string, recipient?: string): Promise<SendResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message, recipient: recipient ?? null }),
    signal: AbortSignal.timeout(15_000),
  });
  return res.ok ? { status: "SUCCESS", detail: "Webhook delivered." } : { status: "FAILED", detail: `Webhook returned HTTP ${res.status}.` };
}

// Facebook Page feed post. secret = "pageId:pageAccessToken".
async function sendMetaPage(secret: string, message: string): Promise<SendResult> {
  const [pageId, token] = splitPair(secret);
  if (!pageId || !token) return { status: "FAILED", detail: "Meta config must be pageId:token." };
  const res = await fetch(`${GRAPH}/${encodeURIComponent(pageId)}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: token }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (res.ok && data.id) return { status: "SUCCESS", detail: "Posted to Facebook Page.", externalId: data.id };
  return { status: "FAILED", detail: data.error?.message ?? `Meta returned HTTP ${res.status}.` };
}

// WhatsApp Cloud API text message. secret = "phoneNumberId:token". Needs recipient.
async function sendWhatsApp(secret: string, message: string, recipient?: string): Promise<SendResult> {
  if (!recipient) return { status: "SKIPPED", detail: "No recipient phone for this WhatsApp send." };
  const [phoneNumberId, token] = splitPair(secret);
  if (!phoneNumberId || !token) return { status: "FAILED", detail: "WhatsApp config must be phoneNumberId:token." };
  const res = await fetch(`${GRAPH}/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to: recipient.replace(/[^\d]/g, ""), type: "text", text: { body: message } }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => ({}))) as { messages?: { id?: string }[]; error?: { message?: string } };
  if (res.ok && data.messages?.[0]?.id) return { status: "SUCCESS", detail: "WhatsApp message sent.", externalId: data.messages[0].id };
  return { status: "FAILED", detail: data.error?.message ?? `WhatsApp returned HTTP ${res.status}.` };
}

// Email via Resend. secret = Resend API key ("re_..."). Needs recipient.
type SmtpConfig = { host: string; port: number; user: string; pass: string; from?: string };

// The EMAIL secret is either a Resend API key (default) or an SMTP config —
// JSON {host,port,user,pass,from?} or an smtp://user:pass@host:port URL. SMTP
// (e.g. Gmail app password) is the free path; Resend is the API path.
function parseSmtp(secret: string): SmtpConfig | null {
  const s = secret.trim();
  if (s.startsWith("{")) {
    try {
      const j = JSON.parse(s) as Partial<SmtpConfig>;
      if (j.host && j.user && j.pass) return { host: j.host, port: Number(j.port) || 587, user: j.user, pass: j.pass, from: j.from };
    } catch { return null; }
    return null;
  }
  if (/^smtps?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (u.hostname && u.username && u.password) {
        return { host: u.hostname, port: Number(u.port) || (s.startsWith("smtps") ? 465 : 587), user: decodeURIComponent(u.username), pass: decodeURIComponent(u.password) };
      }
    } catch { return null; }
  }
  return null;
}

async function sendEmail(secret: string, from: string | null, message: string, recipient?: string, attachments?: MailAttachment[]): Promise<SendResult> {
  if (!recipient) return { status: "SKIPPED", detail: "No recipient email for this send." };
  const subject = message.split("\n")[0].slice(0, 80) || "Message";
  const body = message.split("\n").slice(1).join("\n").trim() || message;

  const smtp = parseSmtp(secret);
  if (smtp) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transport = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.port === 465, auth: { user: smtp.user, pass: smtp.pass } });
      const info = await transport.sendMail({
        from: from || smtp.from || smtp.user, to: recipient, subject, text: body,
        attachments: attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content) })),
      });
      return { status: "SUCCESS", detail: "Email sent (SMTP).", externalId: info.messageId };
    } catch (error) {
      return { status: "FAILED", detail: error instanceof Error ? error.message : "SMTP send failed." };
    }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify({
      from: from || "onboarding@resend.dev", to: recipient, subject, text: message,
      attachments: attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64") })),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (res.ok && data.id) return { status: "SUCCESS", detail: "Email sent.", externalId: data.id };
  return { status: "FAILED", detail: data.message ?? `Email provider returned HTTP ${res.status}.` };
}
