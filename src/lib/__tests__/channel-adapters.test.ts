import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { connectionProviderTag, sendViaChannel, type ConnectionRow } from "@/lib/channel-adapters";
import { encryptCredential } from "@/lib/integrations/credential-crypto";

beforeAll(() => {
  // 32-byte base64 master key so encrypt/decrypt round-trips in the test.
  process.env.AZMIN_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
});
afterEach(() => vi.restoreAllMocks());

function connect(channel: string, secret: string, meta: string | null = null): NonNullable<ConnectionRow> {
  const enc = encryptCredential({ secret, workspaceId: "w1", provider: connectionProviderTag(channel) });
  return { channel, displayName: `${channel} conn`, status: "CONNECTED", workspaceId: "w1", meta, encryptedConfig: enc.encryptedValue, iv: enc.iv, authTag: enc.authTag, keyVersion: enc.keyVersion };
}

describe("safe-by-default behaviour", () => {
  it("in-app notify always succeeds without a channel", async () => {
    const r = await sendViaChannel({ action: "NOTIFY", channel: null, connection: null, message: "hi" });
    expect(r.status).toBe("SUCCESS");
  });

  it("skips when no channel is connected", async () => {
    const r = await sendViaChannel({ action: "SEND_WHATSAPP", channel: "WHATSAPP", connection: null, message: "hi" });
    expect(r.status).toBe("SKIPPED");
  });

  it("simulates when the connection has no stored secret", async () => {
    const conn: ConnectionRow = { channel: "META_PAGE", displayName: "Page", status: "CONNECTED", workspaceId: "w1", meta: null, encryptedConfig: null, iv: null, authTag: null, keyVersion: 1 };
    const r = await sendViaChannel({ action: "POST_META", channel: "META_PAGE", connection: conn, message: "launch" });
    expect(r.status).toBe("SIMULATED");
  });
});

describe("real sends (official APIs)", () => {
  it("posts to a webhook and reports success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendViaChannel({ action: "WEBHOOK", channel: "WEBHOOK", connection: connect("WEBHOOK", "https://hook.example/abc"), message: "New lead!" });
    expect(r.status).toBe("SUCCESS");
    expect(fetchMock).toHaveBeenCalledWith("https://hook.example/abc", expect.objectContaining({ method: "POST" }));
  });

  it("skips a WhatsApp send that has a secret but no recipient", async () => {
    const r = await sendViaChannel({ action: "SEND_WHATSAPP", channel: "WHATSAPP", connection: connect("WHATSAPP", "123456:TOKEN"), message: "hi" });
    expect(r.status).toBe("SKIPPED");
  });

  it("reports a failed webhook HTTP status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    const r = await sendViaChannel({ action: "WEBHOOK", channel: "WEBHOOK", connection: connect("WEBHOOK", "https://hook.example/x"), message: "hi" });
    expect(r.status).toBe("FAILED");
  });
});
