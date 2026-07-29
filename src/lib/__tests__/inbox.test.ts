import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  conversation: { findMany: vi.fn(), findFirst: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
  message: { create: vi.fn() },
  channelConnection: { findFirst: vi.fn() },
  workspace: { findFirst: vi.fn() },
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
