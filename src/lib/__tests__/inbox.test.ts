import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  conversation: { findMany: vi.fn(), findFirst: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
  message: { create: vi.fn() },
  channelConnection: { findFirst: vi.fn() },
  workspace: { findFirst: vi.fn() },
  automation: { findFirst: vi.fn() },
  company: { findFirst: vi.fn() },
  membership: { findMany: vi.fn() },
  notification: { createMany: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ prisma: mocks }));

import { getConversations, recordInbound, resolveInboxWorkspace, sendReply } from "@/lib/inbox";

beforeEach(() => vi.clearAllMocks());

describe("inbox scoping", () => {
  it("lists open conversations scoped to the workspace", async () => {
    mocks.conversation.findMany.mockResolvedValue([]);
    await getConversations("tenant-a");
    expect(mocks.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { workspaceId: "tenant-a", status: "OPEN" },
    }));
  });

  it("upserts a conversation on the tenant+channel+contact key and stores the inbound message", async () => {
    mocks.conversation.upsert.mockResolvedValue({ id: "c1" });
    mocks.message.create.mockResolvedValue({});
    await recordInbound("tenant-a", { kind: "message", channel: "WHATSAPP", externalId: "999", text: "hi", contactName: "Sam" });
    expect(mocks.conversation.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { workspaceId_channel_externalId: { workspaceId: "tenant-a", channel: "WHATSAPP", externalId: "999" } },
    }));
    expect(mocks.message.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ conversationId: "c1", workspaceId: "tenant-a", direction: "IN", body: "hi" }),
    }));
  });
});

describe("AI auto-reply", () => {
  it("answers an inbound message when the AI auto-reply automation is enabled", async () => {
    mocks.conversation.upsert.mockResolvedValue({ id: "c1" });
    mocks.message.create.mockResolvedValue({});
    // Auto-reply automation is on.
    mocks.automation.findFirst.mockResolvedValue({ id: "auto1" });
    // Conversation loaded for context, and again inside sendReply.
    mocks.conversation.findFirst.mockResolvedValue({ id: "c1", channel: "WHATSAPP", contactName: "Sam", contactHandle: "999", externalId: "999", companyId: null, messages: [{ direction: "IN", body: "hello" }] });
    mocks.channelConnection.findFirst.mockResolvedValue(null); // no live channel -> simulated send
    mocks.conversation.updateMany.mockResolvedValue({ count: 1 });

    await recordInbound("tenant-a", { kind: "message", channel: "WHATSAPP", externalId: "999", text: "hello" });

    // Two messages written: the inbound, then the AI reply (OUT).
    const directions = mocks.message.create.mock.calls.map((c) => c[0].data.direction);
    expect(directions).toContain("IN");
    expect(directions).toContain("OUT");
  });

  it("escalates a sensitive message: no auto-reply, notify owners/admins", async () => {
    mocks.conversation.upsert.mockResolvedValue({ id: "c3" });
    mocks.message.create.mockResolvedValue({});
    mocks.automation.findFirst.mockResolvedValue({ id: "auto1" });
    mocks.conversation.findFirst.mockResolvedValue({ id: "c3", channel: "WHATSAPP", contactName: "Sam", contactHandle: "999", externalId: "999", companyId: null, messages: [{ direction: "IN", body: "I want a refund now" }] });
    mocks.membership.findMany.mockResolvedValue([{ userId: "owner1" }]);
    mocks.notification.createMany.mockResolvedValue({});

    await recordInbound("tenant-a", { kind: "message", channel: "WHATSAPP", externalId: "999", text: "I want a refund now" });

    // No AI reply sent (only the inbound message written).
    const directions = mocks.message.create.mock.calls.map((c) => c[0].data.direction);
    expect(directions).toEqual(["IN"]);
    // Owner notified about the escalation.
    expect(mocks.notification.createMany).toHaveBeenCalled();
    expect(mocks.membership.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { workspaceId: "tenant-a", role: { in: ["OWNER", "ADMIN"] } },
    }));
  });

  it("does nothing when no auto-reply automation is enabled", async () => {
    mocks.conversation.upsert.mockResolvedValue({ id: "c2" });
    mocks.message.create.mockResolvedValue({});
    mocks.automation.findFirst.mockResolvedValue(null);
    await recordInbound("tenant-a", { kind: "message", channel: "WHATSAPP", externalId: "111", text: "hi" });
    const directions = mocks.message.create.mock.calls.map((c) => c[0].data.direction);
    expect(directions).toEqual(["IN"]); // only the inbound, no auto-reply
  });
});

describe("resolveInboxWorkspace", () => {
  it("prefers a workspace with a connected channel, mapping DM channels to META_PAGE", async () => {
    mocks.channelConnection.findFirst.mockResolvedValue({ workspaceId: "tenant-a" });
    expect(await resolveInboxWorkspace("MESSENGER")).toBe("tenant-a");
    expect(mocks.channelConnection.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { channel: "META_PAGE", status: "CONNECTED" },
    }));
  });

  it("falls back to the first workspace when nothing is connected", async () => {
    mocks.channelConnection.findFirst.mockResolvedValue(null);
    mocks.workspace.findFirst.mockResolvedValue({ id: "w0" });
    expect(await resolveInboxWorkspace("WHATSAPP")).toBe("w0");
  });
});

describe("sendReply", () => {
  it("records an outbound message (simulated when no live credentials)", async () => {
    mocks.conversation.findFirst.mockResolvedValue({ id: "c1", channel: "WHATSAPP", contactHandle: "999", externalId: "999" });
    mocks.channelConnection.findFirst.mockResolvedValue(null); // no connection -> adapter SKIPPED
    mocks.message.create.mockResolvedValue({});
    mocks.conversation.updateMany.mockResolvedValue({ count: 1 });
    const res = await sendReply("tenant-a", "c1", "on my way");
    expect(res).not.toBeNull();
    expect(mocks.message.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ direction: "OUT", body: "on my way" }),
    }));
  });

  it("returns null for a conversation in another workspace", async () => {
    mocks.conversation.findFirst.mockResolvedValue(null);
    expect(await sendReply("tenant-a", "rival", "hi")).toBeNull();
  });
});
