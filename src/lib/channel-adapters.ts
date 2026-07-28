import "server-only";
import { decryptCredential, isCredentialVaultReady } from "@/lib/integrations/credential-crypto";
import type { Action, Channel } from "@/lib/automations-catalog";

/**
 * The single seam where automations reach the outside world. Until live API
 * credentials and platform review exist for Meta / WhatsApp / Email, real sends
 * are SIMULATED (recorded, never transmitted). Wire real calls per branch in
 * `sendViaChannel` — the rest of the system already treats this as the boundary.
 */

export type SendStatus = "SUCCESS" | "FAILED" | "SIMULATED" | "SKIPPED";
export type SendResult = { status: SendStatus; detail: string };

export type ConnectionRow = {
  channel: string;
  displayName: string;
  status: string;
  encryptedConfig: string | null;
  iv: string | null;
  authTag: string | null;
  keyVersion: number;
  workspaceId: string;
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

export async function sendViaChannel(input: {
  action: Action;
  channel: Channel | null;
  connection: ConnectionRow;
  message: string;
}): Promise<SendResult> {
  const { action, channel, connection, message } = input;

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

  // TODO(live): real API calls per channel — Meta Graph, WhatsApp Cloud API,
  // SMTP/Resend, Telegram Bot API, or an HTTP POST for WEBHOOK. Until each is
  // wired and reviewed, record a simulated send using the connected account.
  return { status: "SIMULATED", detail: `Would send via ${connection.displayName}: ${truncate(message)}` };
}
