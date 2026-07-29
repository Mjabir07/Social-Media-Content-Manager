import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

vi.mock("server-only", () => ({}));

import { parseMetaWebhook, verifyMetaSignature } from "@/lib/meta-webhook";

describe("parseMetaWebhook", () => {
  it("parses a WhatsApp text message with contact name", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [{ changes: [{ field: "messages", value: {
        contacts: [{ profile: { name: "Sam" }, wa_id: "9715..." }],
        messages: [{ from: "9715...", id: "wamid.1", type: "text", text: { body: "Hi there" } }],
      } }] }],
    };
    const events = parseMetaWebhook(payload);
    expect(events).toEqual([{ kind: "message", channel: "WHATSAPP", externalId: "9715...", contactHandle: "9715...", contactName: "Sam", text: "Hi there", messageId: "wamid.1" }]);
  });

  it("parses a Messenger message and an Instagram message by object type", () => {
    const messenger = parseMetaWebhook({ object: "page", entry: [{ messaging: [{ sender: { id: "PSID1" }, message: { mid: "m1", text: "hello" } }] }] });
    expect(messenger[0]).toMatchObject({ channel: "MESSENGER", externalId: "PSID1", text: "hello" });
    const insta = parseMetaWebhook({ object: "instagram", entry: [{ messaging: [{ sender: { id: "IG1" }, message: { mid: "m2", text: "yo" } }] }] });
    expect(insta[0]).toMatchObject({ channel: "INSTAGRAM", externalId: "IG1" });
  });

  it("parses a lead-ad (leadgen) event", () => {
    const events = parseMetaWebhook({ object: "page", entry: [{ changes: [{ field: "leadgen", value: { leadgen_id: "L1", form_id: "F1" } }] }] });
    expect(events).toEqual([{ kind: "lead", source: "Facebook Lead Ad", leadgenId: "L1", formId: "F1" }]);
  });

  it("ignores junk payloads safely", () => {
    expect(parseMetaWebhook(null)).toEqual([]);
    expect(parseMetaWebhook({ entry: "nope" })).toEqual([]);
  });
});

describe("verifyMetaSignature", () => {
  it("passes through when no app secret is configured", () => {
    expect(verifyMetaSignature("{}", null, undefined)).toBe(true);
  });

  it("accepts a correct signature and rejects a wrong one", () => {
    const secret = "appsecret";
    const body = '{"a":1}';
    const good = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyMetaSignature(body, good, secret)).toBe(true);
    expect(verifyMetaSignature(body, "sha256=deadbeef", secret)).toBe(false);
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
  });
});
